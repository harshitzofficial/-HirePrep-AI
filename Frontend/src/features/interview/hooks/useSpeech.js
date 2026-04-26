import { useState, useEffect, useCallback, useRef } from 'react';

const useSpeech = () => {
    const [isListening, setIsListening] = useState(false);
    const [isAITalking, setIsAITalking] = useState(false);
    const [interimTranscript, setInterimTranscript] = useState("");
    const [finalizedTranscript, setFinalizedTranscript] = useState("");
    const recognitionRef = useRef(null);
    const aiStartTimeRef = useRef(0);

    const speak = (text, onEndCallback) => {
        // Fix #7: speechSynthesis is not available on all browsers/platforms
        if (!window.speechSynthesis) {
            console.warn("TTS not supported in this browser. Skipping speech.");
            if (onEndCallback) onEndCallback(); // still proceed to next question
            return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;

        utterance.onstart = () => {
            setIsAITalking(true);
            aiStartTimeRef.current = Date.now();
        };
        utterance.onend = () => {
            setIsAITalking(false);
            if (onEndCallback) onEndCallback();
        };
        utterance.onerror = () => setIsAITalking(false);

        window.speechSynthesis.speak(utterance);
    };

    const startListening = useCallback(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        if (!recognitionRef.current) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.lang = 'en-US';
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
        }

        const recognition = recognitionRef.current;

        recognition.onstart = () => setIsListening(true);
        
        recognition.onresult = (event) => {
            let currentInterim = '';
            let currentFinalized = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    currentFinalized += result + ' ';
                } else {
                    currentInterim += result;
                }
            }

            if (currentFinalized) {
                setFinalizedTranscript(prev => prev + currentFinalized);
            }
            setInterimTranscript(currentInterim);

            // Interruption Logic
            const speechDuration = Date.now() - aiStartTimeRef.current;
            const wordCount = (currentFinalized || currentInterim).trim().split(/\s+/).length;

            if (window.speechSynthesis.speaking && speechDuration > 1500 && wordCount >= 4) {
                window.speechSynthesis.cancel();
                setIsAITalking(false);
            }
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        try { recognition.start(); } catch (e) {}
    }, []);

    const stopListening = () => {
        if (recognitionRef.current) recognitionRef.current.stop();
        setIsListening(false);
    };

    const resetTranscript = () => {
        setInterimTranscript("");
        setFinalizedTranscript("");
    };

    // 🟢 Manual update (e.g. from typing in textarea)
    const updateTranscriptManually = (text) => {
        setFinalizedTranscript(text);
        setInterimTranscript("");
    };

    useEffect(() => {
        return () => {
            // Fix #2: calling .stop() then .abort() on the same instance throws
            // DOMException in Chrome. abort() alone stops and cleans up correctly.
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
            window.speechSynthesis.cancel();
        };
    }, []);

    return { 
        speak, 
        startListening, 
        stopListening, 
        resetTranscript,
        updateTranscriptManually,
        isListening, 
        isAITalking, 
        transcript: finalizedTranscript + interimTranscript 
    };
};

export default useSpeech;
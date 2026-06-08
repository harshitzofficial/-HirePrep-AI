import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import toast from 'react-hot-toast';
// 🟢 Import the new single evaluation function
import {
  getLiveQuestions,
  evaluateInterview,
  evaluateSingleAnswer,
  getHint
} from "@features/interview/services/interview.api";
import { useInterview } from "@features/interview/hooks/useInterview";
import useSpeech from "../hooks/useSpeech";
import useFaceAnalysis from "../hooks/useFaceAnalysis"; // 🟢 Import the new hook
import LiveInterviewAnalytics from "../components/LiveInterviewAnalytics";
import InterviewCommandCenter from "../components/InterviewCommandCenter";
import LiveCameraPanel from "../components/LiveCameraPanel";
import TranscriptChat from "../components/TranscriptChat";
import "@features/interview/styles/liveInterview.scss";

const LiveInterview = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const { report, getReportById } = useInterview();

  const safeJobDescription = (report?.jobDescription && report.jobDescription.length >= 5)
    ? report.jobDescription
    : (report?.title && report.title.length >= 5 ? report.title : "Standard Technical Role for Candidate");

  const {
    speak,
    startListening,
    stopListening,
    isListening, // 🟢 This is the correct variable name!
    isAITalking, // 🟢 Tracks AI voice output
    transcript,
    updateTranscriptManually,
    resetTranscript,
  } = useSpeech();

  const [questions, setQuestions] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [fullTranscript, setFullTranscript] = useState([]);

  const [evaluation, setEvaluation] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userCommand, setUserCommand] = useState("");

  const [interviewType, setInterviewType] = useState("Technical Interview");

  const [currentFeedback, setCurrentFeedback] = useState(null);

  // 🟢 AI Copilot State
  const [hint, setHint] = useState(null);
  const [isFetchingHint, setIsFetchingHint] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null); // 🟢 Safe reference to the camera stream
  const transcriptEndRef = useRef(null);
  const [isCamOn, setIsCamOn] = useState(false);

  // Guard: prevent submitForGrading from running more than once per session
  // (React StrictMode double-invokes state updaters in dev — this is the fix)
  const isSubmittingRef = useRef(false);

  // 🟢 Real-time Face Analysis
  const { analysis, modelsLoaded, loadModels } = useFaceAnalysis(videoRef);
  const [confidenceHistory, setConfidenceHistory] = useState([]);
  const [eyeContactHistory, setEyeContactHistory] = useState([]); // Fix 1: track eye contact %

  // Track both confidence AND eye contact over time for the final grade
  useEffect(() => {
    if (isCamOn && analysis.confidenceScore > 0) {
      setConfidenceHistory(prev => [...prev, analysis.confidenceScore]);
      // Fix 1: record 1 (good) or 0 (bad) each frame — compute % later
      setEyeContactHistory(prev => [...prev, analysis.eyeContact ? 1 : 0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis.confidenceScore, isCamOn, analysis.eyeContact]);

  const scrollToBottom = () => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [fullTranscript]);

  useEffect(() => {
    if (interviewId) getReportById(interviewId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewId]);

  const startInterview = async () => {
    if (!report) return;
    setIsProcessing(true);
    // Reset the submission guard for a fresh session
    isSubmittingRef.current = false;

    try {
      const data = await getLiveQuestions({
        jobDescription: (report.jobDescription && report.jobDescription.length >= 5) 
            ? report.jobDescription 
            : (report.title && report.title.length >= 5 ? report.title : "Standard Technical Role for Candidate"),
        // Fix #5: schema field is "resume", not "resumeText" or "resumeContent"
        resumeText: report.resume || "Candidate's resume",
        userCommand,
        interviewType,
      });

      setQuestions(data.questions);
      setCurrentStep(1);
      askQuestion(data.questions[0]);
    } catch (err) {
      console.error("Failed to generate questions:", err);
      const backendMsg = err.response?.data?.message || err.message || "Unknown error";
      toast.error(`Failed to start: ${backendMsg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const askQuestion = (text) => {
    speak(text, () => {
      startListening();
    });
  };

  const toggleCamera = async () => {
    if (isCamOn) {
      // Turn off camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
      setIsCamOn(false);
    } else {
      // Turn on camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        streamRef.current = stream; // 🟢 Save reference
        if (videoRef.current) videoRef.current.srcObject = stream;
        setIsCamOn(true);
        // 🔥 Trigger face-api models to load only when camera is activated
        loadModels();
      } catch (err) {
        console.error("Camera access denied or unavailable", err);
        toast.error("Could not access your camera.");
      }
    }
  };

  useEffect(() => {
    return () => {
      // 🟢 Cleanup on unmount using streamRef!
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 🟢 SMART MIC TOGGLE
  const toggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // 🟢 SMART TYPING HANDLER
  const handleTextChange = (e) => {
    // If user starts typing while mic is on, auto-pause mic to prevent text jumping
    if (isListening) {
      stopListening();
    }
    updateTranscriptManually(e.target.value);
  };

  const handleSubmitAnswer = async () => {
    stopListening();
    const finalAnswer = transcript.trim();

    if (!finalAnswer) return;

    try {
      // Call the backend endpoint
      const result = await evaluateSingleAnswer({
        question: questions[currentIndex],
        answer: finalAnswer,
        jobDescription: safeJobDescription,
      });

      // 1. Set the dynamic text to the screen
      setCurrentFeedback(result.feedback);

      // 2. 🗣️ Make the AI speak the feedback out loud!
      speak(result.feedback);

      // Save to full transcript with feedback!
      const qaPair = {
        question: questions[currentIndex],
        answer: finalAnswer,
        feedback: result.feedback, // 🟢 STORE THE FEEDBACK!
      };
      setFullTranscript((prev) => [...prev, qaPair]);
      resetTranscript(); // 🟢 Clear the input so it doesn't look duplicated
    } catch (err) {
      console.error("Single Eval API Error:", err);
      // If it fails, show the error so you know WHY it failed
      const errorMsg =
        "Oops, my connection to the AI failed. Please check your backend console.";
      setCurrentFeedback(errorMsg);
      speak(errorMsg);
    }
  };

  // handleProceedToNext: safe to use fullTranscript directly here.
  // By the time the user clicks this button, React has already re-rendered
  // after handleSubmitAnswer's setFullTranscript, so the closure is fresh.
  const handleProceedToNext = () => {
    // Stop speaking the feedback if the user clicks Next early
    window.speechSynthesis.cancel();

    setCurrentFeedback(null);
    resetTranscript();

    if (currentIndex < questions.length - 1) {
      setHint(null);
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      askQuestion(questions[nextIdx]);
    } else {
      // Use fullTranscript directly — NOT inside a state updater.
      // State updaters must be pure; side effects inside them get double-called
      // by React StrictMode, which was creating 2 sessions per interview.
      submitForGrading(fullTranscript);
    }
  };

  // 🟢 NEW: END INTERVIEW EARLY
  const handleEndInterviewEarly = () => {
    const confirmEnd = window.confirm(
      "End the interview early? Your current progress will be evaluated.",
    );
    if (confirmEnd) {
      stopListening();

      // Grab whatever they were currently typing/saying
      const finalAnswer = transcript.trim();

      let updatedTranscript = fullTranscript;

      // If they had an answer typed but didn't submit it yet, add it to the final grading
      if (finalAnswer && currentIndex < questions.length) {
        updatedTranscript = [
          ...fullTranscript,
          { question: questions[currentIndex], answer: finalAnswer },
        ];
        setFullTranscript(updatedTranscript);
      }

      // Send everything they've done so far to be graded
      submitForGrading(updatedTranscript);
    }
  };

  // 🟢 NEW: HANDLE COPILOT HINT
  const handleGetHint = async () => {
    setIsFetchingHint(true);
    try {
      const result = await getHint({
        question: questions[currentIndex],
        jobDescription: safeJobDescription,
      });
      setHint(result.hint);
    } catch (err) {
      console.error("Get hint error:", err);
      setHint("Take a deep breath and break the problem down into smaller steps.");
    } finally {
      setIsFetchingHint(false);
    }
  };
  
  const submitForGrading = async (finalTranscript) => {
    // Guard against double-submission (React StrictMode + accidental double-click)
    if (isSubmittingRef.current) {
      console.warn("submitForGrading called twice — blocked duplicate.");
      return;
    }
    isSubmittingRef.current = true;
    setIsProcessing(true);

    // 🟢 FORCE STOP CAMERA
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCamOn(false);

    try {
      const avgConfidence = confidenceHistory.length > 0 
        ? Math.round(confidenceHistory.reduce((a, b) => a + b, 0) / confidenceHistory.length)
        : 70;

      // Fix 1: real eye contact % — how many frames user actually looked at screen
      const avgEyeContactScore = eyeContactHistory.length > 0
        ? Math.round((eyeContactHistory.reduce((a, b) => a + b, 0) / eyeContactHistory.length) * 100)
        : 70; // default 70% if camera was off

      const result = await evaluateInterview({
        transcript: finalTranscript,
        jobDescription: safeJobDescription,
        interviewReportId: interviewId,
        aiMetrics: {
            avgConfidence,
            eyeContactScore: avgEyeContactScore   // Fix 1: real % not binary 100/50
        }
      });
      setEvaluation(result);
      setCurrentStep(2);
    } catch (err) {
      console.error("Grading failed:", err);
      toast.error("Grading failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 🟢 KEYBOARD SHORTCUTS
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault(); // Prevent page scroll
        toggleMic();
      } else if (e.code === 'Enter') {
        e.preventDefault();
        if (currentStep === 1) {
          if (currentFeedback) {
            handleProceedToNext();
          } else if (transcript.trim() !== '') {
            handleSubmitAnswer();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, currentFeedback, transcript, isListening]);

  return (
    <div className="live-interview">
      {currentStep === 0 && (
        <InterviewCommandCenter 
            report={report}
            interviewType={interviewType}
            setInterviewType={setInterviewType}
            userCommand={userCommand}
            setUserCommand={setUserCommand}
            isProcessing={isProcessing}
            startInterview={startInterview}
        />
      )}

      {/* --- STEP 1: LIVE INTERVIEW UI --- */}
      {currentStep === 1 && questions.length > 0 && (
        <div className="modern-interview-layout">
          {/* 📱 LEFT COLUMN: MEDIA & AVATARS */}
          <LiveCameraPanel 
            videoRef={videoRef}
            isCamOn={isCamOn}
            modelsLoaded={modelsLoaded}
            analysis={analysis}
            confidenceHistory={confidenceHistory}
            isAITalking={isAITalking}
            isListening={isListening}
            toggleMic={toggleMic}
            toggleCamera={toggleCamera}
            handleEndInterviewEarly={handleEndInterviewEarly}
          />

          {/* 💬 RIGHT COLUMN: CONVERSATION */}
          <TranscriptChat 
            fullTranscript={fullTranscript}
            transcriptEndRef={transcriptEndRef}
            currentIndex={currentIndex}
            questions={questions}
            hint={hint}
            isFetchingHint={isFetchingHint}
            handleGetHint={handleGetHint}
            transcript={transcript}
            handleTextChange={handleTextChange}
            currentFeedback={currentFeedback}
            handleProceedToNext={handleProceedToNext}
            handleSubmitAnswer={handleSubmitAnswer}
          />
        </div>
      )}

      {/* --- STEP 2: ANALYTICS DASHBOARD --- */}
      {currentStep === 2 && evaluation && (
        <LiveInterviewAnalytics 
            evaluation={evaluation} 
            interviewId={interviewId} 
            navigate={navigate} 
        />
      )}
    </div>
  );
};

export default LiveInterview;

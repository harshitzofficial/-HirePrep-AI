import { useState, useEffect, useRef } from "react";
import * as faceapi from "face-api.js";

const useFaceAnalysis = (videoRef) => {
  const [analysis, setAnalysis] = useState({
    eyeContact: true,
    isSmiling: false,
    confidenceScore: 0,
    dominantExpression: "neutral",
  });
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const analysisInterval = useRef(null);
  const faceLostCounter = useRef(0);   // Debounce counter to prevent flicker
  const smoothedScoreRef = useRef(50); // EMA state — persists between frames

  // 1. Load Models from /public/models
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL), // 🟢 Uses the high-accuracy model
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        console.log("Face Analysis Models Loaded");
      } catch (err) {
        console.error("Failed to load face-api models:", err);
      }
    };
    loadModels();
  }, []);

  // 2. Start Real-time Analysis
  useEffect(() => {
    // 🟢 We now check every 1s if the video is ready, even if it wasn't at the start
    const checkVideoStatus = setInterval(() => {
        if (modelsLoaded && videoRef.current && videoRef.current.readyState === 4) {
            if (!analysisInterval.current) {
                console.log("🚀 Camera stream detected! Starting Face Analysis...");
                startAnalysisLoop();
            }
        }
    }, 1000);

    const startAnalysisLoop = () => {
        analysisInterval.current = setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState === 4) {
                analyzeFace();
            }
        }, 500);
    };

    return () => {
      clearInterval(checkVideoStatus);
      if (analysisInterval.current) clearInterval(analysisInterval.current);
    };
  }, [modelsLoaded, videoRef]);

  const analyzeFace = async () => {
    if (!videoRef.current) return;

    try {
      const detection = await faceapi
        .detectSingleFace(
            videoRef.current, 
            new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }) // 🟢 High-accuracy detection
        )
        .withFaceLandmarks()
        .withFaceExpressions();

      if (!detection) {
        faceLostCounter.current++;
        
        // Only reset after 6 consecutive missed frames (~3s) — tolerates blinks & lighting glitches
        if (faceLostCounter.current > 6) {
            smoothedScoreRef.current = 0;
            setAnalysis({
                eyeContact: false,
                isSmiling: false,
                confidenceScore: 0,
                dominantExpression: "Face not detected",
            });
        }
        return;
      }

      // 🟢 We found a face! Reset the counter
      faceLostCounter.current = 0;
      
      console.log("Face detected! Mood:", Object.keys(detection.expressions).reduce((a, b) => detection.expressions[a] > detection.expressions[b] ? a : b));


    // A. EYE CONTACT DETECTION
    // Calculate if the user is looking at the screen based on head orientation (approximate)
    const landmarks = detection.landmarks;
    const nose = landmarks.getNose()[0];
    const leftEye = landmarks.getLeftEye()[0];
    const rightEye = landmarks.getRightEye()[0];
    const jaw = landmarks.getJawOutline();
    
    // Check if nose is roughly centered between eyes and jaw edges
    const faceCenter = (jaw[0].x + jaw[16].x) / 2;
    const noseOffset = Math.abs(nose.x - faceCenter);
    // Fix #13: removed unused eyeNoseDistance — was computed every frame but never used

    // Simple heuristic: if nose is too far from center, user is looking away
    const isLookingAtScreen = noseOffset < 25;

    // B. SMILE DETECTION
    const expressions = detection.expressions;
    const isSmiling = expressions.happy > 0.6;
    const dominantExpression = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);

    // C. RAW CONFIDENCE SCORE (0 - 100)
    let rawScore = 50; // Starting baseline
    if (isLookingAtScreen) rawScore += 20; else rawScore -= 20;
    if (isSmiling) rawScore += 10;
    if (dominantExpression === "neutral" || dominantExpression === "happy") rawScore += 10;
    if (dominantExpression === "surprised") rawScore -= 5;
    if (dominantExpression === "sad" || dominantExpression === "fearful") rawScore -= 15;
    rawScore = Math.min(100, Math.max(0, rawScore));

    // D. EMA SMOOTHING — prevents single-frame expression spikes (yawn, blink)
    // Formula: newSmoothed = 0.65 * prevSmoothed + 0.35 * rawScore
    // High alpha (0.65) = slow to react = stable readout
    const smoothed = Math.round(0.65 * smoothedScoreRef.current + 0.35 * rawScore);
    smoothedScoreRef.current = smoothed;

      setAnalysis({
        eyeContact: isLookingAtScreen,
        isSmiling,
        confidenceScore: smoothed,
        dominantExpression,
      });
    } catch (error) {
      console.error("Face Analysis Error:", error);
    }
  };

  return { analysis, modelsLoaded };
};

export default useFaceAnalysis;

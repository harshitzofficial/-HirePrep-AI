import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
// 🟢 Import the new single evaluation function
import {
  getLiveQuestions,
  evaluateInterview,
  evaluateSingleAnswer,
  getHint
} from "../services/interview.api";
import { useInterview } from "../hooks/useInterview";
import useSpeech from "../hooks/useSpeech";
import useFaceAnalysis from "../hooks/useFaceAnalysis"; // 🟢 Import the new hook
import "../style/liveInterview.scss";

const LiveInterview = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const { report, getReportById } = useInterview();
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
  const [isEvaluatingSingle, setIsEvaluatingSingle] = useState(false);

  // 🟢 AI Copilot State
  const [hint, setHint] = useState(null);
  const [isFetchingHint, setIsFetchingHint] = useState(false);

  const videoRef = useRef(null);
  const transcriptEndRef = useRef(null);
  const [isCamOn, setIsCamOn] = useState(false);

  // Guard: prevent submitForGrading from running more than once per session
  // (React StrictMode double-invokes state updaters in dev — this is the fix)
  const isSubmittingRef = useRef(false);

  // 🟢 Real-time Face Analysis
  const { analysis, modelsLoaded } = useFaceAnalysis(videoRef);
  const [confidenceHistory, setConfidenceHistory] = useState([]);
  const [eyeContactHistory, setEyeContactHistory] = useState([]); // Fix 1: track eye contact %

  // Track both confidence AND eye contact over time for the final grade
  useEffect(() => {
    if (isCamOn && analysis.confidenceScore > 0) {
      setConfidenceHistory(prev => [...prev, analysis.confidenceScore]);
      // Fix 1: record 1 (good) or 0 (bad) each frame — compute % later
      setEyeContactHistory(prev => [...prev, analysis.eyeContact ? 1 : 0]);
    }
  }, [analysis.confidenceScore, isCamOn]);

  const scrollToBottom = () => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [fullTranscript]);

  useEffect(() => {
    if (interviewId) getReportById(interviewId);
  }, [interviewId]);

  const startInterview = async () => {
    if (!report) return;
    setIsProcessing(true);
    // Reset the submission guard for a fresh session
    isSubmittingRef.current = false;

    try {
      const data = await getLiveQuestions({
        jobDescription: report.jobDescription,
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
      alert("Failed to start. Check backend logs for details.");
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
      const stream = videoRef.current?.srcObject;
      const tracks = stream?.getTracks() || [];
      tracks.forEach((track) => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      setIsCamOn(false);
    } else {
      // Turn on camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
        setIsCamOn(true);
      } catch (err) {
        console.error("Camera access denied or unavailable", err);
        alert("Could not access your camera.");
      }
    }
  };

  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
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

  const handleNext = () => {
    stopListening();

    const finalAnswer = transcript.trim();
    const qaPair = { question: questions[currentIndex], answer: finalAnswer };
    const updatedTranscript = [...fullTranscript, qaPair];

    setFullTranscript(updatedTranscript);
    resetTranscript();

    if (currentIndex < questions.length - 1) {
      setHint(null); // Reset hint for next question
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      askQuestion(questions[nextIdx]);
    } else {
      submitForGrading(updatedTranscript);
    }
  };

  const handleSubmitAnswer = async () => {
    stopListening();
    const finalAnswer = transcript.trim();

    if (!finalAnswer) return;

    setIsEvaluatingSingle(true);
    try {
      // Call the backend endpoint
      const result = await evaluateSingleAnswer({
        question: questions[currentIndex],
        answer: finalAnswer,
        jobDescription: report.jobDescription,
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
    } finally {
      setIsEvaluatingSingle(false);
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
        jobDescription: report.jobDescription,
      });
      setHint(result.hint);
    } catch (err) {
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
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
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
        jobDescription: report.jobDescription,
        interviewReportId: interviewId,
        aiMetrics: {
            avgConfidence,
            eyeContactScore: avgEyeContactScore   // Fix 1: real % not binary 100/50
        }
      });
      setEvaluation(result);
      setCurrentStep(2);
    } catch (err) {
      alert("Grading failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="live-interview">
      {currentStep === 0 && (
        <div className="setup-view command-center">
          <h1 className="glow-text">AI Interview Command Center</h1>
          <p className="subtitle">
            Fine-tune your AI interviewer before starting the session.
          </p>

          <div className="command-grid">
            {/* LEFT COLUMN: RESUME INSIGHTS */}
            <div className="command-section insights-panel">
              <h3>
                <i className="fas fa-microchip"></i> Resume Analysis Results
              </h3>

              {/* 🟢 Added Scroll Container to maintain symmetry */}
              <div className="scroll-container">
                <div className="insight-group">
                  <label>Identified Projects</label>
                  <div className="tag-cloud">
                    {report?.identifiedProjects?.length > 0 ? (
                      report.identifiedProjects.map((project, i) => (
                        <span key={i} className="tag project-tag">
                          {project}
                        </span>
                      ))
                    ) : (
                      <span className="no-data-msg">
                        Scanning for projects...
                      </span>
                    )}
                  </div>
                </div>

                <div className="insight-group">
                  <label>Technical Skills Detected</label>
                  <div className="tag-cloud">
                    {report?.detectedSkills?.length > 0 ? (
                      report.detectedSkills.map((skill, i) => (
                        <span key={i} className="tag skill-tag">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="no-data-msg">
                        Scanning for skills...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: CONFIGURATION */}
            <div className="command-section config-panel">
              <h3>
                <i className="fas fa-sliders-h"></i> Interview Setup
              </h3>

              {/* 🟢 Added Scroll Container here too for uniform height */}
              <div className="scroll-container">
                <div className="input-group">
                  <label>Target Role</label>
                  <input
                    type="text"
                    value={report?.title || "Software Developer"}
                    readOnly
                    className="readonly-input"
                  />
                </div>

                <div className="input-group">
                  <label>Interview Type</label>
                  <select
                    className="command-select"
                    value={interviewType} // 🟢 Bind state
                    onChange={(e) => setInterviewType(e.target.value)}
                  >
                    <option value="Technical Interview">
                      Technical Interview
                    </option>
                    <option value="Behavioral Interview">
                      Behavioral Interview
                    </option>
                    <option value="System Design Round">
                      System Design Round
                    </option>
                    <option value="Mixed/General">Mixed/General</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Custom Focus (Optional)</label>
                  <textarea
                    className="command-textarea"
                    placeholder="e.g. Focus on my backend experience or deep dive into React Hooks..."
                    value={userCommand}
                    onChange={(e) => setUserCommand(e.target.value)}
                  />
                </div>

                <div className="quick-chips">
                  {[
                    "React Focus",
                    "Behavioral",
                    "System Design",
                    "Strict Tech",
                  ].map((cmd) => (
                    <button
                      key={cmd}
                      className="chip"
                      onClick={() => setUserCommand(cmd)}
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            className="primary-button start-btn-inside"
            onClick={startInterview}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <div className="loader-container">
                <div className="spinner"></div>
                <span>Preparing...</span>
              </div>
            ) : (
              "Start Interview"
            )}
          </button>
        </div>
      )}

      {/* --- STEP 1: LIVE INTERVIEW UI --- */}
      {currentStep === 1 && questions.length > 0 && (
        <div className="modern-interview-layout">
          {/* 📱 LEFT COLUMN: MEDIA & AVATARS */}
          <div className="media-panel">
            <div className="video-feeds">
              {/* 1. User Camera Box */}
              <div className={`cam-box user-cam ${!isCamOn ? "cam-off" : ""}`}>
                <video ref={videoRef} autoPlay playsInline muted />
                
                {/* 🟢 NEW: AI Body Language Status Overlay */}
                {isCamOn && modelsLoaded && (
                  <div className="analysis-overlay">
                    <div className={`status-pill ${analysis.eyeContact ? "good" : "warning"}`}>
                      {analysis.eyeContact ? "Eye Contact: Good" : "Eye Contact: Look here"}
                    </div>
                    
                    {/* 🟢 NEW: Confidence Meter */}
                    <div className="confidence-meter-container">
                        <span className="label">Confidence</span>
                        <div className="meter-bg">
                            <div className="meter-fill" style={{ width: `${analysis.confidenceScore}%` }}></div>
                        </div>
                        {/* 🟢 Live Session Average */}
                        {confidenceHistory.length > 0 && (
                          <div className="running-avg" style={{ fontSize: '0.65rem', color: '#00ff88', marginTop: '4px', textAlign: 'right' }}>
                            Session Avg: {Math.round(confidenceHistory.reduce((a, b) => a + b, 0) / confidenceHistory.length)}%
                          </div>
                        )}
                    </div>

                    {/* 🟢 NEW: Current Expression */}
                    <div className="status-pill mood">
                      Mood: {analysis.dominantExpression}
                    </div>

                    {analysis.isSmiling && (
                      <div className="status-pill smile">
                        Nice Smile!
                      </div>
                    )}
                  </div>
                )}

                {!isCamOn && (
                  <div className="cam-placeholder">
                    {/* 🟢 Replaced FA Icon with SVG */}
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2.1l1.4-2h5.5l1 1.4" />
                      <path d="M23 19l-4-3v-3l4-3v9z" />
                      <line x1="2" y1="2" x2="22" y2="22" />
                    </svg>
                    <span>Camera Off</span>
                  </div>
                )}
                <div className="cam-label">You</div>
              </div>

              {/* 2. AI Box */}
              <div className={`cam-box ai-cam ${isAITalking ? "ai-talking" : ""}`}>
                <div className="ai-placeholder">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span>AI Assistant</span>
                </div>
                <div className="cam-label ai-label">AI Interviewer</div>
              </div>
            </div>

            {/* Media Controls */}
            <div className="control-bar">
              {/* 🟢 FIXED: Using isListening instead of listening */}
              <button
                className={`control-btn ${isListening ? "active" : "inactive"}`}
                onClick={toggleMic}
              >
                {isListening ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                  </svg>
                )}
              </button>
              <button
                className={`control-btn ${isCamOn ? "active" : "inactive"}`}
                onClick={toggleCamera}
              >
                {isCamOn ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="23 7 16 12 23 17 23 7"></polygon>
                    <rect
                      x="1"
                      y="5"
                      width="15"
                      height="14"
                      rx="2"
                      ry="2"
                    ></rect>
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2.1l1.4-2h5.5l1 1.4" />
                    <path d="M23 19l-4-3v-3l4-3v9z" />
                    <line x1="2" y1="2" x2="22" y2="22" />
                  </svg>
                )}
              </button>
              <button
                className="control-btn end-btn"
                onClick={handleEndInterviewEarly}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path>
                  <line x1="23" y1="1" x2="1" y2="23"></line>
                </svg>{" "}
              </button>
            </div>
          </div>

          {/* 💬 RIGHT COLUMN: CONVERSATION */}
          <div className="conversation-panel">
            {/* 1. History Log (Past Questions & Answers) */}
            <div className="transcript-history">
              {fullTranscript.map((item, idx) => (
                <div className="history-item" key={idx}>
                  <div className="bubble ai-bubble">
                    <strong>Question:</strong> {item.question}
                  </div>
                  <div className="bubble user-bubble">
                    <strong>Your Answer:</strong> {item.answer}
                  </div>
                  {item.feedback && (
                    <div className="bubble ai-feedback-bubble">
                      <strong>AI Feedback:</strong> {item.feedback}
                    </div>
                  )}
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>

            {/* 2. Active Question */}
            <div className="active-interaction">
              <div className="status-header">
                <span className="live-dot"></span>
                QUESTION {currentIndex + 1} OF {questions.length}
              </div>
              <h3 className="active-question">{questions[currentIndex]}</h3>

              {/* 🟢 AI COPILOT HINT UI */}
              <div className="copilot-section" style={{ marginBottom: '15px' }}>
                {!hint ? (
                  <button 
                    className="get-hint-btn" 
                    onClick={handleGetHint} 
                    disabled={isFetchingHint}
                    style={{ background: 'transparent', border: '1px solid #00ff8880', color: '#00ff88', padding: '6px 12px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {isFetchingHint ? (
                       <><div className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px' }}></div> Analyzing...</>
                    ) : (
                       <>💡 Need a hint?</>
                    )}
                  </button>
                ) : (
                  <div className="hint-box" style={{ background: '#00ff8815', borderLeft: '3px solid #00ff88', padding: '10px 15px', borderRadius: '4px', fontSize: '0.9rem', color: '#e0e0e0' }}>
                    <strong>🧠 Copilot:</strong> {hint}
                  </div>
                )}
              </div>

              {/* 3. Input Area */}
              <textarea
                className="answer-input"
                placeholder="Type your answer here or use the microphone..."
                value={transcript}
                onChange={handleTextChange} // 🟢 Ensure typing pauses mic
              />

              <div className="action-row">
                {currentFeedback ? (
                  <button className="submit-btn" onClick={handleProceedToNext}>
                    Proceed to Next Question
                  </button>
                ) : (
                  <button className="submit-btn" onClick={handleSubmitAnswer}>
                    Submit Answer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- STEP 2: ANALYTICS DASHBOARD --- */}
      {currentStep === 2 && evaluation && (
        <div className="analytics-dashboard">
          <div className="dashboard-header">
            <div>
              <h2>Interview Analytics Dashboard</h2>
              <p>AI-powered performance insights</p>
            </div>
            <div className="header-actions">
              <button
                className="secondary-btn"
                onClick={() => navigate(`/interview/${interviewId}`)}
              >
                Exit
              </button>
              {/* 🟢 PDF Download Button triggers browser print dialog styled for saving */}
              <button className="primary-button" onClick={() => window.print()}>
                <i className="fas fa-file-pdf"></i> Download PDF
              </button>
            </div>
          </div>

          <div className="dashboard-grid">
            {/* LEFT COLUMN */}
            <div className="left-panel">
              {/* Overall Performance Card */}
              <div className="stat-card text-center">
                <h3>Overall Performance</h3>
                <div className="circular-score">
                  <svg viewBox="0 0 36 36" className="circular-chart">
                    <path
                      className="circle-bg"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="circle"
                      strokeDasharray={`${evaluation.overallScore * 10}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="score-text">
                    <span className="number">
                      {evaluation.overallScore.toFixed(1)}
                    </span>
                    <span className="label">Out of 10</span>
                  </div>
                </div>
                <p className="summary-text">{evaluation.summary}</p>
              </div>

              {/* Skill Evaluation Card */}
              <div className="stat-card">
                <h3>Skill Evaluation</h3>
                <div className="skill-bars">
                  {Object.entries(evaluation.skills).map(([skill, score]) => (
                    <div className="skill-row" key={skill}>
                      <div className="skill-labels">
                        <span className="skill-name">
                          {skill.charAt(0).toUpperCase() + skill.slice(1)}
                        </span>
                        <span className="skill-score">{score}/10</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${score * 10}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="right-panel">
              <div className="stat-card breakdown-card">
                <h3>Question Breakdown</h3>
                <div className="questions-list">
                  {evaluation.questionBreakdown.map((q, idx) => (
                    <div className="question-item" key={idx}>
                      <div className="q-header">
                        <span className="q-number">Question {idx + 1}</span>
                        <span
                          className={`q-score ${q.score >= 7 ? "good" : q.score >= 5 ? "avg" : "poor"}`}
                        >
                          {q.score} / 10
                        </span>
                      </div>
                      <h4 className="q-text">{q.question}</h4>
                      <div className="ai-feedback-box">
                        <h5>AI Feedback</h5>
                        <p>{q.feedback}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveInterview;

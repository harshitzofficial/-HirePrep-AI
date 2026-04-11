import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
// 🟢 Import the new single evaluation function
import {
  getLiveQuestions,
  evaluateInterview,
  evaluateSingleAnswer,
} from "../services/interview.api";
import { useInterview } from "../hooks/useInterview";
import useSpeech from "../hooks/useSpeech";
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
    transcript,
    setTranscript,
  } = useSpeech();

  const [questions, setQuestions] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [accumulatedAnswer, setAccumulatedAnswer] = useState("");
  const [fullTranscript, setFullTranscript] = useState([]);

  const [evaluation, setEvaluation] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userCommand, setUserCommand] = useState("");

  const [interviewType, setInterviewType] = useState("Technical Interview");

  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [isEvaluatingSingle, setIsEvaluatingSingle] = useState(false);

  const videoRef = useRef(null);
  const [isCamOn, setIsCamOn] = useState(false);

  useEffect(() => {
    if (interviewId) getReportById(interviewId);
  }, [interviewId]);

  const startInterview = async () => {
    if (!report) return;
    setIsProcessing(true);

    try {
      const data = await getLiveQuestions({
        jobDescription: report.jobDescription,
        resumeText:
          report.resumeText || report.resumeContent || "Candidate's resume",
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
      if (transcript) {
        setAccumulatedAnswer((prev) => prev + (prev ? " " : "") + transcript);
        setTranscript("");
      }
    } else {
      startListening();
    }
  };

  // 🟢 SMART TYPING HANDLER
  const handleTextChange = (e) => {
    // If user starts typing while mic is on, auto-pause mic to prevent text jumping
    if (isListening) {
      stopListening();
      setTranscript("");
    }
    setAccumulatedAnswer(e.target.value);
  };

  const handleNext = () => {
    stopListening();

    const finalAnswer = (
      accumulatedAnswer + (transcript ? " " + transcript : "")
    ).trim();
    const qaPair = { question: questions[currentIndex], answer: finalAnswer };
    const updatedTranscript = [...fullTranscript, qaPair];

    setFullTranscript(updatedTranscript);
    setAccumulatedAnswer("");
    setTranscript("");

    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      askQuestion(questions[nextIdx]);
    } else {
      submitForGrading(updatedTranscript);
    }
  };

  const handleSubmitAnswer = async () => {
    stopListening();
    const finalAnswer = (
      accumulatedAnswer + (transcript ? " " + transcript : "")
    ).trim();

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

      // Save to full transcript
      const qaPair = { question: questions[currentIndex], answer: finalAnswer };
      setFullTranscript([...fullTranscript, qaPair]);
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

  // 🟢 SPLIT FUNCTION 2: Proceed to Next Question
  const handleProceedToNext = () => {
    // 🛑 Stop speaking the feedback if the user clicks Next early
    window.speechSynthesis.cancel();

    setCurrentFeedback(null);
    setAccumulatedAnswer("");
    setTranscript("");

    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      askQuestion(questions[nextIdx]); // This will ask the next question
    } else {
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
      const finalAnswer = (
        accumulatedAnswer + (transcript ? " " + transcript : "")
      ).trim();

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

  const submitForGrading = async (finalTranscript) => {
    setIsProcessing(true);
    try {
      const result = await evaluateInterview({
        transcript: finalTranscript,
        jobDescription: report.jobDescription,
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

              {/* 2. AI Visualizer Box */}
              <div className="cam-box ai-cam">
                <div className="ai-visualizer">
                  <div className="ai-ring ring-1"></div>
                  <div className="ai-ring ring-2"></div>
                  <div className="ai-ring ring-3"></div>
                  <div className="ai-core"></div>
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
                    <strong>AI:</strong> {item.question}
                  </div>
                  <div className="bubble user-bubble">
                    <strong>You:</strong> {item.answer}
                  </div>
                </div>
              ))}
            </div>

            {/* 2. Active Question */}
            <div className="active-interaction">
              <div className="status-header">
                <span className="live-dot"></span>
                QUESTION {currentIndex + 1} OF {questions.length}
              </div>
              <h3 className="active-question">{questions[currentIndex]}</h3>

              {/* 3. Input Area */}
              <textarea
                className="answer-input"
                placeholder="Type your answer here or use the microphone..."
                value={accumulatedAnswer + (transcript ? " " + transcript : "")}
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

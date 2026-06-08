import React from 'react';

const LiveCameraPanel = ({
  videoRef,
  isCamOn,
  modelsLoaded,
  analysis,
  confidenceHistory,
  isAITalking,
  isListening,
  toggleMic,
  toggleCamera,
  handleEndInterviewEarly
}) => {
  return (
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
  );
};

export default LiveCameraPanel;

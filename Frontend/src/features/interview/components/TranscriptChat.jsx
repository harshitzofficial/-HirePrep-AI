import React from 'react';

const TranscriptChat = ({
  fullTranscript,
  transcriptEndRef,
  currentIndex,
  questions,
  hint,
  isFetchingHint,
  handleGetHint,
  transcript,
  handleTextChange,
  currentFeedback,
  handleProceedToNext,
  handleSubmitAnswer
}) => {
  return (
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
          onChange={handleTextChange}
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
  );
};

export default TranscriptChat;

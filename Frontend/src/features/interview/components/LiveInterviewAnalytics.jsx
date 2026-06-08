import React from 'react';

const LiveInterviewAnalytics = ({ evaluation, interviewId, navigate }) => {
    return (
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
    );
};

export default LiveInterviewAnalytics;

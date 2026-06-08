import React from 'react';

const InterviewCommandCenter = ({ 
    report, 
    interviewType, 
    setInterviewType, 
    userCommand, 
    setUserCommand, 
    isProcessing, 
    startInterview 
}) => {
    return (
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
                    value={interviewType}
                    onChange={(e) => setInterviewType(e.target.value)}
                  >
                    <option value="Technical Interview">Technical Interview</option>
                    <option value="Behavioral Interview">Behavioral Interview</option>
                    <option value="System Design Round">System Design Round</option>
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
    );
};

export default InterviewCommandCenter;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { getAllInterviewSessions } from "../services/interview.api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import "../style/mockHistory.scss";

const MockHistory = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  // Fix #10: removed unused `weaknesses` state — was never read or rendered
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sessionsData = await getAllInterviewSessions();
        setSessions(sessionsData.sessions || []);
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="history-loading">
        <div className="spinner"></div>
        <p>Analyzing your interview history...</p>
      </div>
    );
  }

  return (
    <div className="mock-history-page">
      <header className="history-header">
        <button onClick={() => navigate("/dashboard")} className="back-btn">
          ← Back to Dashboard
        </button>
        <h1>Interview Performance History</h1>
        <p>Track your growth and master your common weaknesses.</p>
      </header>

      <div className="history-grid">
        {/* LEFT COLUMN: QUICK STATS & CHARTS */}
        <section className="insights-panel">
          {/* Quick Stats */}
          <div className="panel-card stats-overview">
             <h2>Training Stats</h2>
             <div className="stats-grid">
                <div className="stat-box">
                    <span className="stat-value">{sessions.length}</span>
                    <span className="stat-label">Total Interviews</span>
                </div>
                <div className="stat-box">
                    <span className="stat-value">
                        {sessions.length > 0 
                          ? (sessions.reduce((acc, s) => acc + s.overallScore, 0) / sessions.length).toFixed(1) 
                          : "0.0"}
                    </span>
                    <span className="stat-label">Avg. Score</span>
                </div>
             </div>
          </div>

          {/* Progress Chart */}
          {sessions.length > 0 && (
            <div className="panel-card chart-container" style={{ marginTop: '20px', height: '300px', display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ marginBottom: '20px' }}>Score Progression</h2>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[...sessions].reverse().map(s => ({
                      date: new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                      score: s.overallScore
                    }))}
                    margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                    <XAxis dataKey="date" stroke="#ffffff80" fontSize={12} tickMargin={15} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 10]} stroke="#ffffff80" fontSize={12} tickMargin={10} width={40} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f1714', borderColor: '#00ff8840', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#00ff88', fontWeight: 'bold' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#00ff88" 
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#00ff88', strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#fff', stroke: '#00ff88', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: SESSION LIST */}
        <section className="sessions-panel">
          <h2>Recent Sessions</h2>
          <div className="session-list">
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <div className="session-card" key={session._id}>
                  <div className="session-main">
                    <div className="session-info">
                      <h3>{session.interviewReport?.title || "Mock Interview"}</h3>
                      <span className="date">
                        {new Date(session.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="score-badge">
                      <span className="score">{session.overallScore}</span>
                      <span className="total">/10</span>
                    </div>
                  </div>
                  
                  <div className="skill-preview">
                    {Object.entries(session.skills || {}).map(([skill, score]) => (
                      <div className="skill-pill" key={skill}>
                        <span className="skill-name">{skill}</span>
                        <span className="skill-val">{score}/10</span>
                      </div>
                    ))}
                  </div>

                  <p className="summary-preview">{session.summary}</p>
                </div>
              ))
            ) : (
              <div className="no-sessions">
                <p>You haven't completed any mock interviews yet.</p>
                <button onClick={() => navigate("/dashboard")} className="start-btn">
                  Start Your First Interview
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default MockHistory;

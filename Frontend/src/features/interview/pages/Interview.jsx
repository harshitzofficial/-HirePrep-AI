import React, { useState, useEffect } from 'react'
import '@features/interview/styles/interview.scss'
import { useInterview } from '@features/interview/hooks/useInterview'
import { useNavigate, useParams } from 'react-router'
import JobSearchSection from '../components/JobSearchSection'
import FlashcardBank from '../components/FlashcardBank'
import RoadmapSection from '../components/RoadmapSection'

const NAV_ITEMS = [
    { id: 'technical', label: 'Technical Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>) },
    { id: 'behavioral', label: 'Behavioral Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>) },
    { id: 'flashcards', label: 'Flashcard Bank', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>) },
    { id: 'roadmap', label: 'Custom Road Map', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>) },
    { id: 'jobs', label: 'Find Jobs', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>) },
]

// ── Sub-components (QuestionCard, RoadMapDay, JobSearchSection stay EXACTLY the same) ──
const QuestionCard = ({ item, index }) => { /* ... keep your existing code ... */ 
    const [ open, setOpen ] = useState(false)
    return (
        <div className='q-card'>
            <div className='q-card__header' onClick={() => setOpen(o => !o)}>
                <span className='q-card__index'>Q{index + 1}</span>
                <p className='q-card__question'>{item.question}</p>
                <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
            </div>
            {open && (
                <div className='q-card__body'>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--intention'>Intention</span>
                        <p>{item.intention}</p>
                    </div>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--answer'>Model Answer</span>
                        <p>{item.answer}</p>
                    </div>
                </div>
            )}
        </div>
    )
}





// ── Main Component ────────────────────────────────────────────────────────────
const Interview = () => {
    const [ activeNav, setActiveNav ] = useState('technical')
    const { report, getReportById, loading, previewResumePdf } = useInterview()
    const { interviewId } = useParams()
    const navigate = useNavigate()

    // 🟢 SVG Score State
    const [animatedScore, setAnimatedScore] = useState(0);

    // 🟢 NEW: Preview Modal State
    const [previewData, setPreviewData] = useState(null);
    const [isPreviewing, setIsPreviewing] = useState(false);

    useEffect(() => {
        if (interviewId) getReportById(interviewId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ interviewId ])

    useEffect(() => {
        if (report?.matchScore) {
            const timer = setTimeout(() => setAnimatedScore(report.matchScore), 150);
            return () => clearTimeout(timer);
        }
    }, [report?.matchScore]);

    // 🟢 NEW: Handle Preview Click
    const handlePreviewClick = async () => {
        setIsPreviewing(true);
        const data = await previewResumePdf(interviewId);
        if (data) {
            setPreviewData(data);
        }
        setIsPreviewing(false);
    };

    // 🟢 NEW: Confirm Download from Preview
    const handleConfirmDownload = () => {
        if (!previewData) return;
        const link = document.createElement("a");
        link.href = previewData.url;
        link.setAttribute("download", previewData.filename);
        document.body.appendChild(link);
        link.click();
    };

    // 🟢 NEW: Close Modal
    const handleClosePreview = () => {
        if (previewData) {
            window.URL.revokeObjectURL(previewData.url);
        }
        setPreviewData(null);
    };

    if (loading && !isPreviewing && !previewData) {
        return (
            <main className='loading-screen'>
                <h1>Loading your interview plan...</h1>
            </main>
        )
    }

    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

    const getScoreData = (score) => {
        if (!score) return { color: "#555", text: "Calculating...", glow: "transparent" };
        if (score >= 80) return { color: "#00ff88", text: "Strong match for this role", glow: "rgba(0, 255, 136, 0.4)" };
        if (score >= 50) return { color: "#ffc107", text: "Good potential for this role", glow: "rgba(255, 193, 7, 0.4)" };
        return { color: "#ff4d4d", text: "Needs improvement", glow: "rgba(255, 77, 77, 0.4)" };
    };

    const { color, text, glow } = getScoreData(report?.matchScore);

    return (
        <>
            <div className='interview-page'>
                <div className='interview-layout'>

                    {/* ── Left Nav ── */}
                    <nav className='interview-nav'>
                        <div className="interview-nav__header">
                            <h1 
                                className="interview-nav__title" 
                                onClick={() => navigate('/dashboard')}
                                style={{ cursor: 'pointer' }}
                            >
                                HirePrep AI
                            </h1>
                        </div>
                        <div className="nav-content">
                            <p className='interview-nav__label'>Sections</p>
                            {NAV_ITEMS.map(item => (
                                <button
                                    key={item.id}
                                    className={`interview-nav__item ${activeNav === item.id ? 'interview-nav__item--active' : ''}`}
                                    onClick={() => setActiveNav(item.id)}
                                >
                                    <span className='interview-nav__icon'>{item.icon}</span>
                                    {item.label}
                                </button>
                            ))}
                        </div>
                        <div className="interview-nav__footer">
                            <button onClick={() => navigate(`/interview/${interviewId}/live`)} className='button live-button'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pulse-icon"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                Start Live Interview
                            </button>
                            <button onClick={handlePreviewClick} className='button primary-button' disabled={isPreviewing}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                {isPreviewing ? "Generating..." : "Download Resume"}
                            </button>
                        </div>
                    </nav>

                    <div className='interview-divider' />

                    {/* ── Center Content ── */}
                    <main className='interview-content'>
                        {activeNav === 'technical' && (
                            <section>
                                <div className='content-header'>
                                    <h2>Technical Questions</h2>
                                    <span className='content-header__count'>{report?.technicalQuestions?.length} questions</span>
                                </div>
                                <div className='q-list'>
                                    {report?.technicalQuestions?.map((q, i) => (
                                        <QuestionCard key={i} item={q} index={i} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {activeNav === 'behavioral' && (
                            <section>
                                <div className='content-header'>
                                    <h2>Behavioral Questions</h2>
                                    <span className='content-header__count'>{report?.behavioralQuestions?.length} questions</span>
                                </div>
                                <div className='q-list'>
                                    {report?.behavioralQuestions?.map((q, i) => (
                                        <QuestionCard key={i} item={q} index={i} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {activeNav === 'flashcards' && (
                            <FlashcardBank 
                                technicalQuestions={report?.technicalQuestions || []} 
                                behavioralQuestions={report?.behavioralQuestions || []} 
                            />
                        )}

                        {/* 🟢 NEW DYNAMIC ROADMAP UI */}
                        {activeNav === 'roadmap' && (
                            <RoadmapSection report={report} interviewId={interviewId} />
                        )}

                        {activeNav === 'jobs' && (
                            <JobSearchSection />
                        )}
                    </main>

                    <div className='interview-divider' />

                    {/* ── Right Sidebar ── */}
                    <aside className='interview-sidebar'>
                        <div className="match-score-widget">
                            <h3 className="widget-title">MATCH SCORE</h3>
                            <div className="svg-ring-container">
                                <svg className="progress-ring" width="140" height="140">
                                    <circle className="progress-ring__track" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="8" fill="transparent" r={radius} cx="70" cy="70" />
                                    <circle className="progress-ring__circle" stroke={color} strokeWidth="8" fill="transparent" r={radius} cx="70" cy="70" style={{ strokeDasharray: circumference, strokeDashoffset: strokeDashoffset, filter: `drop-shadow(0 0 8px ${glow})` }} />
                                </svg>
                                <div className="ring-content">
                                    <span className="score-value">{animatedScore}</span>
                                    <span className="score-pct">%</span>
                                </div>
                            </div>
                            <p className="match-score-sub" style={{ color: color }}>{text}</p>
                        </div>

                        <div className='sidebar-divider' />

                        <div className='skill-gaps'>
                            <p className='skill-gaps__label'>Skill Proficiency</p>
                            <div className='skill-gaps__list'>
                                {report?.skillGaps?.map((gap, i) => {
                                    let targetPercentage = 50; 
                                    let colorClass = 'medium';
                                    if (gap.severity === 'high') {
                                        targetPercentage = 25; // High gap = low proficiency
                                        colorClass = 'high';
                                    } else if (gap.severity === 'low') {
                                        targetPercentage = 85; // Low gap = high proficiency
                                        colorClass = 'low';
                                    }

                                    // Animate from 0 to target
                                    const displayedPercentage = animatedScore > 0 ? targetPercentage : 0;

                                    return (
                                        <div 
                                            key={i} 
                                            className={`skill-progress skill-progress--${colorClass}`}
                                            style={{ 
                                                animation: `fadeInRight 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards`, 
                                                animationDelay: `${0.4 + i * 0.15}s`, 
                                                opacity: 0 
                                            }}
                                        >
                                            <div className="skill-progress__header">
                                                <div className="skill-progress__tooltip-wrapper" data-tooltip={gap.skill}>
                                                    <span className="skill-progress__name">{gap.skill}</span>
                                                </div>
                                                <span className="skill-progress__percent">{displayedPercentage}%</span>
                                            </div>
                                            <div className="skill-progress__bar-bg">
                                                <div 
                                                    className="skill-progress__bar-fill" 
                                                    style={{ 
                                                        width: `${displayedPercentage}%`,
                                                        transitionDelay: `${0.6 + i * 0.15}s`
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            {/* 🟢 NEW: Preview Modal Overlay */}
            {previewData && (
                <div className="preview-modal-overlay" onClick={handleClosePreview}>
                    <div className="preview-modal" onClick={e => e.stopPropagation()}>
                        <div className="preview-modal__header">
                            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>AI Enhanced Resume Preview</h2>
                            <button onClick={handleClosePreview} className="preview-modal__close">✕</button>
                        </div>
                        <div className="preview-modal__body">
                            <iframe 
                                src={previewData.url} 
                                title="Resume Preview"
                                className="preview-modal__iframe"
                            />
                        </div>
                        <div className="preview-modal__footer">
                            <button onClick={handleClosePreview} className="button" style={{ background: 'transparent', border: '1px solid #444', color: '#ccc' }}>Cancel</button>
                            <button onClick={handleConfirmDownload} className="button primary-button">Confirm & Download PDF</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default Interview
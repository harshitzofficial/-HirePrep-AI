import React, { useState, useEffect } from 'react'
import '../style/interview.scss'
import { useInterview } from '../hooks/useInterview.js'
import { useNavigate, useParams } from 'react-router'
import { searchLiveJobs, generateDynamicRoadmap } from '../services/interview.api' // 🟢 Imported new API

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

const RoadMapDay = ({ day }) => { /* ... keep your existing code ... */ 
    return (
        <div className='roadmap-day'>
            <div className='roadmap-day__header'>
                <span className='roadmap-day__badge'>Day {day.day}</span>
                <h3 className='roadmap-day__focus'>{day.focus}</h3>
            </div>
            <ul className='roadmap-day__tasks'>
                {day.tasks.map((task, i) => (
                    <li key={i}>
                        <span className='roadmap-day__bullet' />
                        {task}
                    </li>
                ))}
            </ul>
        </div>
    )
}

const JobSearchSection = () => {
    const [location, setLocation] = useState('');
    const [jobs, setJobs] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchedQuery, setSearchedQuery] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!location.trim()) return;

        setIsSearching(true);
        try {
            const data = await searchLiveJobs(location);
            setJobs(data.jobs || []);
            setSearchedQuery(data.searchQuery);
        } catch (error) {
            console.error("Failed to fetch jobs:", error);
            // Fix #9: show user-friendly error instead of silent failure
            setSearchedQuery(location);
            setJobs([]);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <section className="job-search-section" style={{ width: '100%', textAlign: 'left' }}>
            <div className='content-header' style={{ marginBottom: '0.5rem' }}>
                <h2>Find Your Next Role</h2>
                {jobs.length > 0 && <span className='content-header__count'>{jobs.length} matches</span>}
            </div>
            
            <p style={{ color: '#a0a0a0', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
                We'll analyze your uploaded resume and find the best active job listings in your area tailored specifically to your skill set.
            </p>

            {/* 🟢 This flex row keeps the input and button side-by-side */}
            <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'row', gap: '1rem', width: '100%', marginBottom: '2rem' }}>
                <input 
                    type="text" 
                    placeholder="Enter city or 'remote' (e.g., New York, NY)" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    style={{ 
                        flex: 1, // Makes the input stretch to fill available space
                        padding: '0.8rem 1.2rem', 
                        borderRadius: '8px', 
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        backgroundColor: 'rgba(20, 20, 20, 0.8)', 
                        color: 'white',
                        outline: 'none',
                        fontSize: '1rem'
                    }}
                />
                <button 
                    type="submit" 
                    className="button primary-button" 
                    disabled={isSearching}
                    style={{ whiteSpace: 'nowrap', padding: '0 1.5rem' }} // Prevents button text from wrapping
                >
                    {isSearching ? "Searching..." : "Search Jobs"}
                </button>
            </form>

            {searchedQuery && (
                <div style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem', backgroundColor: 'rgba(0, 255, 136, 0.05)', borderRadius: '8px', border: '1px solid rgba(0, 255, 136, 0.2)' }}>
                    <p style={{ margin: 0, color: '#00ff88', fontSize: '0.9rem' }}>
                        🤖 AI searched based on your resume for: <strong>{searchedQuery}</strong>
                    </p>
                </div>
            )}

            {/* Fix #9: empty state so users know the search ran but found nothing */}
            {jobs.length === 0 && searchedQuery && !isSearching && (
                <p style={{ color: '#888', textAlign: 'center', padding: '2rem 0', fontSize: '0.95rem' }}>
                    No jobs found for <strong style={{ color: '#ccc' }}>"{searchedQuery}"</strong> in <strong style={{ color: '#ccc' }}>{location}</strong>.<br />
                    <span style={{ fontSize: '0.85rem' }}>Try a different city or search term.</span>
                </p>
            )}

            <div className='job-list' style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {jobs.map((job, index) => (
                    <div key={index} className='q-card' style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div className='q-card__header' style={{ cursor: 'default' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>{job.job_title}</h3>
                                <span style={{ color: '#00ff88', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                    {job.employer_name} • {job.job_city}, {job.job_state}
                                </span>
                            </div>
                        </div>
                        <div className='q-card__body' style={{ marginTop: 0, paddingTop: '0.5rem' }}>
                            <p style={{ color: '#ccc', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1rem' }}>
                                {job.job_description?.substring(0, 200)}...
                            </p>
                            <a 
                                href={job.job_apply_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="button"
                                style={{ 
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                                    color: '#fff', 
                                    textDecoration: 'none',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    padding: '0.6rem 1.2rem',
                                    borderRadius: '6px',
                                    fontSize: '0.85rem',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                            >
                                Apply Externally 
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ── Flashcard Bank Component ──────────────────────────────────────────────────
const FlashcardBank = ({ technicalQuestions = [], behavioralQuestions = [] }) => {
    const [filter, setFilter] = useState('all');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [tiltStyle, setTiltStyle] = useState({
        transform: `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
        '--glare-x': '50%',
        '--glare-y': '50%',
        '--glare-opacity': '0'
    });

    const allCards = [
        ...technicalQuestions.map(q => ({ ...q, type: 'Technical' })),
        ...behavioralQuestions.map(q => ({ ...q, type: 'Behavioral' }))
    ];

    const filteredCards = filter === 'all' 
        ? allCards 
        : allCards.filter(c => c.type.toLowerCase() === filter);

    const currentCard = filteredCards[currentIndex];

    useEffect(() => {
        setCurrentIndex(0);
        setIsFlipped(false);
    }, [filter]);

    const nextCard = () => {
        if (currentIndex < filteredCards.length - 1) {
            setIsFlipped(false);
            setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
        }
    };

    const prevCard = () => {
        if (currentIndex > 0) {
            setIsFlipped(false);
            setTimeout(() => setCurrentIndex(prev => prev - 1), 150);
        }
    };

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Calculate tilt
        const rotateX = ((y - centerY) / centerY) * -12; // Max 12 deg tilt
        const rotateY = ((x - centerX) / centerX) * 12;

        // Calculate glare position
        const glareX = (x / rect.width) * 100;
        const glareY = (y / rect.height) * 100;

        setTiltStyle({
            transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
            '--glare-x': `${glareX}%`,
            '--glare-y': `${glareY}%`,
            '--glare-opacity': '1'
        });
    };

    const handleMouseLeave = () => {
        setTiltStyle({
            transform: `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
            '--glare-x': '50%',
            '--glare-y': '50%',
            '--glare-opacity': '0'
        });
    };

    if (filteredCards.length === 0) return <div style={{ color: '#fff', textAlign: 'center', padding: '2rem' }}>No cards available.</div>;

    return (
        <section className="flashcard-section">
            <div className='content-header flashcard-header'>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h2>Flashcard Bank</h2>
                    <span className='content-header__count'>{filteredCards.length} Cards</span>
                </div>
                <div className="flashcard-filters">
                    <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
                    <button className={filter === 'technical' ? 'active' : ''} onClick={() => setFilter('technical')}>Technical</button>
                    <button className={filter === 'behavioral' ? 'active' : ''} onClick={() => setFilter('behavioral')}>Behavioral</button>
                </div>
            </div>

            <div className="flashcard-container">
                <div 
                    className={`flashcard ${isFlipped ? 'flipped' : ''}`} 
                    onClick={() => setIsFlipped(!isFlipped)}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    style={tiltStyle}
                >
                    <div className="flashcard__inner">
                        {/* FRONT OF CARD */}
                        <div className="flashcard__front">
                            <span className={`flashcard__badge flashcard__badge--${currentCard.type.toLowerCase()}`}>{currentCard.type}</span>
                            <div className="flashcard__front-content">
                                <h3>{currentCard.question}</h3>
                            </div>
                            <p className="flashcard__hint">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
                                Click to flip and view the answer
                            </p>
                        </div>
                        
                        {/* BACK OF CARD */}
                        <div className="flashcard__back">
                            <div className="flashcard__back-content">
                                <div className="flashcard__section">
                                    <span className='q-card__tag q-card__tag--intention'>Intention</span>
                                    <p>{currentCard.intention}</p>
                                </div>
                                <div className="flashcard__section">
                                    <span className='q-card__tag q-card__tag--answer'>Model Answer</span>
                                    <p>{currentCard.answer}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flashcard-controls">
                <button className="button" onClick={prevCard} disabled={currentIndex === 0}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    Previous
                </button>
                <span className="flashcard-progress">{currentIndex + 1} / {filteredCards.length}</span>
                <button className="button primary-button" onClick={nextCard} disabled={currentIndex === filteredCards.length - 1}>
                    Next
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
            </div>
        </section>
    );
};

// ── Main Component ────────────────────────────────────────────────────────────
const Interview = () => {
    const [ activeNav, setActiveNav ] = useState('technical')
    const { report, getReportById, loading, previewResumePdf } = useInterview()
    const { interviewId } = useParams()
    const navigate = useNavigate()

    // 🟢 SVG Score State
    const [animatedScore, setAnimatedScore] = useState(0);

    // 🟢 NEW: Custom Roadmap States
    const [customDays, setCustomDays] = useState(7);
    const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
    const [activeRoadmap, setActiveRoadmap] = useState([]); // Will hold either default or custom roadmap

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

    // 🟢 Set the default roadmap when the report first loads
    useEffect(() => {
        if (report?.preparationPlan) {
            setActiveRoadmap(report.preparationPlan);
        }
    }, [report?.preparationPlan]);

    // 🟢 NEW: Function to generate custom roadmap
    const handleGenerateCustomRoadmap = async () => {
        if (customDays < 1 || customDays > 30) return alert("Please select between 1 and 30 days.");
        
        setIsGeneratingRoadmap(true);
        try {
            const data = await generateDynamicRoadmap({
                interviewId,
                jobDescription: report.jobDescription,
                // Fix #5: schema field is "resume", not "resumeText" or "resumeContent"
                resumeText: report.resume || "",
                days: customDays
            });
            // Update the UI with the fresh roadmap!
            setActiveRoadmap(data.preparationPlan);
        } catch (error) {
            console.error(error);
            alert("Failed to generate custom roadmap. Please check backend.");
        } finally {
            setIsGeneratingRoadmap(false);
        }
    };

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
                            <section>
                                <div className='content-header' style={{ marginBottom: '1rem' }}>
                                    <h2>Preparation Road Map</h2>
                                    <span className='content-header__count'>{activeRoadmap?.length}-day plan</span>
                                </div>
                                
                                {/* Generator Widget */}
                                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1rem', color: '#fff', margin: '0 0 0.5rem 0' }}>Adjust Your Timeline</h3>
                                        <p style={{ fontSize: '0.85rem', color: '#888', margin: 0 }}>How many days do you have left to prepare?</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <input 
                                            type="number" 
                                            min="1" max="30" 
                                            value={customDays} 
                                            // Fix #8: clamp on change so invalid values are corrected immediately
                                            onChange={(e) => setCustomDays(Math.min(30, Math.max(1, Number(e.target.value) || 1)))}
                                            style={{ width: '80px', padding: '0.6rem', borderRadius: '8px', border: '1px solid #444', background: '#111', color: '#fff', fontSize: '1rem', outline: 'none', textAlign: 'center' }}
                                        />
                                        <span style={{ color: '#aaa', fontSize: '0.9rem' }}>Days</span>
                                        <button 
                                            onClick={handleGenerateCustomRoadmap} 
                                            disabled={isGeneratingRoadmap}
                                            style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', background: '#00ff88', color: '#000', fontWeight: 'bold', cursor: isGeneratingRoadmap ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: isGeneratingRoadmap ? 0.7 : 1 }}
                                        >
                                            {isGeneratingRoadmap ? "Recalculating..." : "Regenerate Plan"}
                                        </button>
                                    </div>
                                </div>

                                <div className='roadmap-list'>
                                    {activeRoadmap?.map((day) => (
                                        <RoadMapDay key={day.day} day={day} />
                                    ))}
                                </div>
                            </section>
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
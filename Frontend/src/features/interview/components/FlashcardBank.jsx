import React, { useState, useEffect } from 'react';

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
                    <button className={filter === 'all' ? 'active' : ''} onClick={() => { setFilter('all'); setCurrentIndex(0); setIsFlipped(false); }}>All</button>
                    <button className={filter === 'technical' ? 'active' : ''} onClick={() => { setFilter('technical'); setCurrentIndex(0); setIsFlipped(false); }}>Technical</button>
                    <button className={filter === 'behavioral' ? 'active' : ''} onClick={() => { setFilter('behavioral'); setCurrentIndex(0); setIsFlipped(false); }}>Behavioral</button>
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

export default FlashcardBank;

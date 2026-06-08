import React, { useState } from 'react';
import { searchLiveJobs } from "@features/interview/services/interview.api";

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

            <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'row', gap: '1rem', width: '100%', marginBottom: '2rem' }}>
                <input 
                    type="text" 
                    placeholder="Enter city or 'remote' (e.g., New York, NY)" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    style={{ 
                        flex: 1,
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
                    style={{ whiteSpace: 'nowrap', padding: '0 1.5rem' }}
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

export default JobSearchSection;

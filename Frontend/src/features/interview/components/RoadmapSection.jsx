import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { generateDynamicRoadmap } from "@features/interview/services/interview.api";

const RoadMapDay = ({ day }) => {
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

const RoadmapSection = ({ report, interviewId }) => {
    const [customDays, setCustomDays] = useState(7);
    const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
    const [activeRoadmap, setActiveRoadmap] = useState([]);

    // Set the default roadmap when the report first loads
    useEffect(() => {
        if (report?.preparationPlan) {
            setActiveRoadmap(report.preparationPlan);
        }
    }, [report?.preparationPlan]);

    const handleGenerateCustomRoadmap = async () => {
        if (customDays < 1 || customDays > 30) return toast.error("Please select between 1 and 30 days.");
          
        const safeJobDescription = (report?.jobDescription && report.jobDescription.length >= 5) 
            ? report.jobDescription 
            : (report?.title && report.title.length >= 5 ? report.title : "Standard Technical Role for Candidate");

        setIsGeneratingRoadmap(true);
        try {
            const data = await generateDynamicRoadmap({
                interviewId,
                jobDescription: safeJobDescription,
                resumeText: report.resume || "",
                days: customDays
            });
            setActiveRoadmap(data.preparationPlan);
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate custom roadmap. Please check backend.");
        } finally {
            setIsGeneratingRoadmap(false);
        }
    };

    return (
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
    );
};

export default RoadmapSection;

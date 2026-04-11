import React from "react";
import { useNavigate } from "react-router";
import "../style/landing.scss";
const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <nav className="navbar glass-panel">
        <div className="logo">
          <span className="text-gradient">HirePrep AI</span>
        </div>
        <div className="nav-actions">
          <button
            className="button secondary-button"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
          <button
            className="button primary-button"
            onClick={() => navigate("/register")}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-content">
          <div className="badge-pill glass-panel">
            <span className="pulse-dot"></span> New: Advanced Behavioral AI Analysis
          </div>
          <h1 className="hero-title">
            Don't just practice.
            <br />
            <span className="text-gradient">Dominate your interview.</span>
          </h1>
          <p className="hero-subtitle">
            Practice with live AI mock interviews, uncover skill gaps, 
            get a custom prep roadmap, and find curated job matches instantly.
          </p>
          <div className="hero-cta">
            <button
              className="button primary-button large-cta"
              onClick={() => navigate("/register")}
            >
              Start Your Strategy For Free
            </button>
            <p className="cta-subtext">
              No credit card required. Generate your first plan immediately.
            </p>
          </div>
        </div>
      </header>

      {/* Social Proof */}
      <section className="social-proof">
        <p>Trusted by candidates who landed offers at top tech companies</p>
        <div className="company-logos">
          <span>Google</span>
          <span>Meta</span>
          <span>Amazon</span>
          <span>Netflix</span>
          <span>Apple</span>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section">
  <h2 className="section-title">The ultimate preparation toolkit.</h2>
  <div className="features-grid">
    
    {/* Feature 1: AI Job Matcher */}
    <div className="feature-card glass-panel group">
      <div className="premium-icon icon-sparkles">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
        </svg>
      </div>
      <h3>AI Job Matcher</h3>
      <p>
        Our AI analyzes your unique profile and cross-references it with live job boards to find high-probability matches in your preferred location.
      </p>
    </div>

    {/* Feature 2: Deep Resume Analysis */}
    <div className="feature-card glass-panel group">
      <div className="premium-icon icon-scan">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="10" cy="13" r="2"/><line x1="11.4" y1="14.4" x2="15" y2="18"/>
        </svg>
      </div>
      <h3>Deep Resume Analysis</h3>
      <p>
        We read your experience and logically map your career history directly to the job requirements, finding your strong suits automatically.
      </p>
    </div>

    {/* Feature 3: Targeted Strategy */}
    <div className="feature-card glass-panel group">
      <div className="premium-icon icon-target">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
        </svg>
      </div>
      <h3>Targeted Strategy</h3>
      <p>
        Get custom-tailored technical and behavioral answers generated specific to your background and the company's culture.
      </p>
    </div>

    {/* Feature 4: Instant Roadmaps */}
    <div className="feature-card glass-panel group">
      <div className="premium-icon icon-route">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
        </svg>
      </div>
      <h3>Instant Roadmaps</h3>
      <p>
        Generate comprehensive day-by-day preparation plans in under 30 seconds using state-of-the-art LLMs.
      </p>
    </div>

    {/* Feature 5: Live Voice Interviews */}
    <div className="feature-card glass-panel group">
      <div className="premium-icon icon-mic">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>
        </svg>
      </div>
      <h3>Live Voice Interviews</h3>
      <p>
        Experience real-time, voice-enabled mock interviews. Direct the AI's focus and practice your delivery with instant conversational feedback.
      </p>
    </div>
    
  </div>
</section>

      {/* How It Works */}
      <section className="how-it-works glass-panel-container">
        <h2 className="section-title">How it works</h2>

        {/* Update your CSS to handle 4 columns instead of 3! */}
        <div className="steps-container">
          <div className="step-item">
            <div className="step-number">1</div>
            <h3>Upload & Target</h3>
            <p>
              Drop in your current resume and paste the exact Job Description
              you want to conquer.
            </p>
          </div>

          <div className="step-item">
            <div className="step-number">2</div>
            <h3>Get Your Action Plan</h3>
            <p>
              Receive a day-by-day study roadmap, skill gap analysis, and
              tailored Q&A generated by AI.
            </p>
          </div>

          <div className="step-item">
            <div className="step-number">3</div>
            <h3>Export Tailored Resume</h3>
            <p>
              Instantly generate and download an ATS-optimized PDF resume
              rewritten specifically for this role.
            </p>
          </div>

          <div className="step-item">
            <div className="step-number">4</div>
            <h3>Live Voice Interview</h3>
            <p>
              Step into the Command Center for a real-time, voice-enabled mock
              interview with our AI recruiter to perfect your delivery.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <h2 className="section-title">Ready to ace your next round?</h2>
        <p>
          Join thousands of successful candidates who supercharged their
          interview prep.
        </p>
        <button
          className="button primary-button large-cta"
          onClick={() => navigate("/register")}
        >
          Create Free Account
        </button>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          {/* Brand */}
          <div className="footer-brand">
            <h2 className="text-gradient logo-small">HirePrep AI</h2>
            <p>
              AI-powered resume analysis, interview prep, and job discovery.
            </p>
          </div>

          {/* Contact / Links */}
          <div className="footer-links">
            <a
              href="https://harshit-singh-profile.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Portfolio
            </a>

            <a href="mailto:harshit.official.281005@gmail.com">Email</a>

            <a
              href="https://github.com/harshitzofficial"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>

            <a
              href="https://www.linkedin.com/in/harshit-singh-7a209a282/"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} HirePrep AI • Built by Harshit Singh
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

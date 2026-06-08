import React from "react";
import { useRouteError } from "react-router";

const RouteErrorBoundary = () => {
    const error = useRouteError();
    console.error("Route Error Caught:", error);
    
    return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: 'var(--bg-dark)',
          color: 'var(--text-primary)',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <h1 style={{ color: 'var(--accent-color)', marginBottom: '1rem' }}>Oops! Application Error</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '600px' }}>
            {error?.statusText || error?.message || "Failed to load the requested page. A network error or temporary glitch occurred."}
          </p>
          <button 
            className="button primary-button"
            onClick={() => window.location.reload()}
          >
            Reload Application
          </button>
        </div>
    );
};

export default RouteErrorBoundary;

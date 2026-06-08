import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
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
          <h1 style={{ color: 'var(--accent-color)', marginBottom: '1rem' }}>Oops! Something went wrong.</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '600px' }}>
            {this.state.error?.message || "An unexpected error occurred in the application."}
          </p>
          <button 
            className="button primary-button"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;

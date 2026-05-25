import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Leaves from './pages/Leaves';
import Performance from './pages/Performance';
import Attendance from './pages/Attendance';

const AppContent = () => {
  const { user, token, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('aura-theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('aura-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [showSlowMessage, setShowSlowMessage] = useState(false);

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setShowSlowMessage(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowSlowMessage(false);
    }
  }, [loading]);

  // If session is loading, show high-end spinner matching glass theme
  if (loading) {
    return (
      <div 
        style={{ 
          width: '100vw', 
          height: '100vh', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: 'var(--bg-primary)',
          color: '#ffffff',
          gap: '1rem'
        }}
      >
        <div 
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.05)',
            borderTopColor: 'var(--accent-primary)',
            animation: 'spin 1s linear infinite'
          }}
        ></div>
        <p style={{ color: '#64748b', fontSize: '0.9rem', letterSpacing: '0.05em' }}>
          Configuring Secure Session...
        </p>
        {showSlowMessage && (
          <p style={{ 
            color: 'var(--accent-primary)', 
            fontSize: '0.8rem', 
            marginTop: '0.5rem', 
            maxWidth: '300px', 
            textAlign: 'center', 
            opacity: 0.8,
            lineHeight: '1.4',
            animation: 'fadeIn 0.5s ease-in-out'
          }}>
            Note: Free hosting server is spinning up. This can take up to 50 seconds on first load. Thank you for your patience!
          </p>
        )}
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 0.8; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  // If no user session active, render stunning Login Screen
  if (!token || !user) {
    return <Login />;
  }

  // Active Tab View selector
  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'employees':
        return <Employees />;
      case 'leaves':
        return <Leaves />;
      case 'performance':
        return <Performance />;
      case 'attendance':
        return <Attendance />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      {/* Dynamic Background Floating Blobs */}
      <div className="floating-blob blob-primary"></div>
      <div className="floating-blob blob-secondary"></div>

      {/* Mobile Sidebar Overlay Backdrop */}
      {isSidebarOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Persistent Left Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
      />

      {/* Right Content Column */}
      <div className="main-content">
        <Navbar 
          activeTab={activeTab} 
          theme={theme} 
          toggleTheme={toggleTheme} 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        {renderActiveView()}
      </div>
    </div>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      hasError: true,
      error: error,
      errorInfo: errorInfo
    });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', background: '#0a0e1a', color: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <h2 style={{ color: '#ef4444' }}>Something went wrong.</h2>
          <details open style={{ whiteSpace: 'pre-wrap', marginTop: '1rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#ef4444', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}
          >
            Clear Cache & Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;

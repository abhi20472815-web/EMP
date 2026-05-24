import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, KeyRound, Mail, AlertCircle } from 'lucide-react';

const Login = () => {
  const { login, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }

    setLocalError('');
    setLoading(true);

    const result = await login(email, password);
    if (!result.success) {
      setLocalError(result.error || 'Invalid credentials');
      setLoading(false);
    }
  };

  // Helper to prefill login for testing
  const handlePrefill = (roleEmail, rolePassword) => {
    setEmail(roleEmail);
    setPassword(rolePassword);
  };

  return (
    <div className="login-viewport">
      {/* Decorative animated floating blobs */}
      <div className="floating-blob blob-primary"></div>
      <div className="floating-blob blob-secondary"></div>

      <div className="login-card glass-panel">
        <div className="login-header">
          <div className="login-logo">
            <Shield size={30} />
          </div>
          <h2 className="login-title">AURA EMS</h2>
          <p className="login-subtitle">Sleek Enterprise Employee Management</p>
        </div>

        {(localError || authError) && (
          <div 
            className="badge badge-danger" 
            style={{ 
              width: '100%', 
              padding: '0.75rem 1rem', 
              borderRadius: 'var(--radius-md)', 
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem'
            }}
          >
            <AlertCircle size={16} />
            <span>{localError || authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Work Email</label>
            <div style={{ position: 'relative' }}>
              <Mail 
                size={18} 
                style={{ 
                  position: 'absolute', 
                  left: '1.2rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: '#64748b' 
                }} 
              />
              <input
                type="email"
                id="email"
                className="form-input"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '3rem' }}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label" htmlFor="password">Security Password</label>
            <div style={{ position: 'relative' }}>
              <KeyRound 
                size={18} 
                style={{ 
                  position: 'absolute', 
                  left: '1.2rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: '#64748b' 
                }} 
              />
              <input
                type="password"
                id="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '3rem' }}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating Credentials...' : 'Access Portal'}
          </button>
        </form>

        {/* Quick Access Prefill Panel */}
        <div style={{ marginTop: '2.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <h4 style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.85rem', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Quick Access Roles
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary"
              onClick={() => handlePrefill('tommy@ems.com', 'tommy123')}
              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', width: '100%', justifyContent: 'space-between' }}
            >
              <span>Tommy Shelby (HR Admin)</span>
              <span className="badge badge-info" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>Admin</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => handlePrefill('manager@ems.com', 'manager123')}
              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', width: '100%', justifyContent: 'space-between' }}
            >
              <span>Marcus Aurelius (Eng Director)</span>
              <span className="badge badge-pending" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>Manager</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => handlePrefill('jane@ems.com', 'employee123')}
              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', width: '100%', justifyContent: 'space-between' }}
            >
              <span>Jane Doe (Frontend Architect)</span>
              <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>Employee</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

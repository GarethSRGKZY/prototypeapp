import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext, useApi } from '../App';

export default function WelcomePage() {
  const { login, showToast } = useContext(AppContext);
  const navigate = useNavigate();
  const api = useApi();
  const [loading, setLoading] = useState(false);

  const handleQuickLogin = async (email) => {
    setLoading(true);
    try {
      const user = await api.get(`/api/auth/login?email=${email}`);
      // Fallback to POST
      const res = await api.post('/api/auth/login', { email });
      if (res.id) {
        login(res);
        showToast('Welcome back!');
        navigate('/');
      } else {
        showToast('Login failed');
      }
    } catch (e) {
      // Try direct login
      try {
        const res = await api.post('/api/auth/login', { email });
        if (res.id) {
          login(res);
          showToast('Welcome back!');
          navigate('/');
        }
      } catch {
        showToast('Connection error');
      }
    }
    setLoading(false);
  };

  const handleDemoLogin = () => {
    // Quick demo login without backend
    const demoUser = {
      id: 1, name: 'John Doe', email: 'john@example.com',
      avatar_initials: 'JD', is_verified: 1, is_organization: 0,
      member_since: 'January 2026', rating: 4.9, total_hours: 12.0,
      tasks_completed: 5
    };
    login(demoUser);
    showToast('Welcome, John! 👋');
    navigate('/');
  };

  return (
    <div className="welcome-page">
      <div className="welcome-icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87"/>
          <path d="M16 3.13a4 4 0 010 7.75"/>
        </svg>
      </div>

      <h2>Join Our Community</h2>
      <p>Connect with local volunteers and task providers in a safe, verified environment</p>

      <button className="auth-btn" onClick={handleDemoLogin} disabled={loading}>
        <span className="icon">📧</span>
        Continue with Gmail
      </button>

      <button className="auth-btn" onClick={handleDemoLogin} disabled={loading}>
        <span className="icon">💬</span>
        Continue with WhatsApp
      </button>

      <button className="auth-btn" onClick={handleDemoLogin} disabled={loading}>
        <span className="icon">👤</span>
        Continue with Facebook
      </button>

      <div className="verification-box">
        <h3>🛡️ Verification Required</h3>
        <p>Upload your ID to unlock tasks and ensure a safe environment for everyone</p>
        <button className="btn btn-warning" onClick={handleDemoLogin}>
          ⬆️ Upload ID Now
        </button>
      </div>

      <div className="trust-badges" style={{ marginTop: 24 }}>
        <div className="trust-badge">
          <span className="icon">🔒</span>
          Secure
        </div>
        <div className="trust-badge">
          <span className="icon">✅</span>
          Verified
        </div>
        <div className="trust-badge">
          <span className="icon">🤝</span>
          Trusted
        </div>
      </div>
    </div>
  );
}

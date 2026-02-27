import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext, useApi } from '../App';

// --- Brand SVG Icons ---
const GmailIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24">
    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L12 9.73l8.073-6.236C21.691 2.279 24 3.434 24 5.457z" fill="#EA4335"/>
  </svg>
);

const MetaIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M6.915 4.03c-1.968 0-3.204 1.412-4.126 3.09C1.81 9.022.87 11.558.456 13.14c-.413 1.576-.198 3.336.57 4.453.763 1.114 1.95 1.573 3.095 1.573 1.037 0 2.142-.378 3.13-1.2.996-.83 1.872-2.07 2.545-3.737l.245-.608.243.608c.673 1.668 1.549 2.908 2.545 3.737.988.822 2.093 1.2 3.13 1.2 1.144 0 2.332-.46 3.095-1.573.768-1.117.984-2.877.57-4.453-.413-1.582-1.353-4.118-2.333-6.02C16.29 5.442 15.053 4.03 13.085 4.03c-1.313 0-2.41.783-3.232 1.884L10 5.7l-.147.214C8.99 4.813 7.895 4.03 6.582 4.03h.333z" fill="#0081FB"/>
    <path d="M6.915 5.73c-1.263 0-2.153.997-2.933 2.427-.78 1.427-1.66 3.78-2.05 5.272-.39 1.493-.073 2.57.385 3.238.46.672 1.168.966 1.804.966.728 0 1.532-.287 2.28-.91.748-.623 1.465-1.612 2.043-3.047l.878-2.18.878 2.18c.578 1.435 1.295 2.424 2.043 3.047.748.623 1.552.91 2.28.91.636 0 1.344-.294 1.804-.966.458-.668.775-1.745.385-3.238-.39-1.492-1.27-3.845-2.05-5.272-.78-1.43-1.67-2.427-2.933-2.427-.89 0-1.67.58-2.32 1.452L10 7.7l-.307-.518c-.65-.872-1.43-1.452-2.32-1.452h-.458z" fill="#0081FB"/>
  </svg>
);

const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#000000">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

export default function WelcomePage() {
  const { login, showToast } = useContext(AppContext);
  const navigate = useNavigate();
  const api = useApi();

  const [view, setView] = useState('main'); // main | signin | signup | forgot
  const [loading, setLoading] = useState(false);

  // Sign In state
  const [siIdentifier, setSiIdentifier] = useState('');
  const [siPassword, setSiPassword] = useState('');
  const [siError, setSiError] = useState('');

  // Sign Up state
  const [suUsername, setSuUsername] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suError, setSuError] = useState('');

  // Forgot Password state
  const [fpEmail, setFpEmail] = useState('');
  const [fpNewPass, setFpNewPass] = useState('');
  const [fpConfirmPass, setFpConfirmPass] = useState('');
  const [fpError, setFpError] = useState('');
  const [fpSuccess, setFpSuccess] = useState(false);

  // Social login
  const handleSocialLogin = async (provider) => {
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', {
        provider,
        identifier: `demo_${provider}`,
        email: `demo@${provider}.com`,
        name: `Demo ${provider.charAt(0).toUpperCase() + provider.slice(1)} User`
      });
      if (res.id) {
        login(res);
        showToast(`Welcome! Signed in with ${provider.charAt(0).toUpperCase() + provider.slice(1)} 👋`);
        navigate('/');
      }
    } catch {
      // Fallback demo
      const demoUser = {
        id: 1, name: 'John Doe', email: 'john@example.com',
        avatar_initials: 'JD', is_verified: 1, is_organization: 0,
        member_since: 'January 2026', rating: 4.9, total_hours: 12.0, tasks_completed: 5
      };
      login(demoUser);
      showToast('Welcome! 👋');
      navigate('/');
    }
    setLoading(false);
  };

  // Sign In
  const handleSignIn = async (e) => {
    e.preventDefault();
    setSiError('');
    if (!siIdentifier || !siPassword) {
      setSiError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', {
        identifier: siIdentifier,
        password: siPassword
      });
      if (res.id) {
        login(res);
        showToast(`Welcome back, ${res.name}! 👋`);
        navigate('/');
      }
    } catch (err) {
      setSiError(err.data?.error || 'Invalid username/email or password');
    }
    setLoading(false);
  };

  // Sign Up
  const handleSignUp = async (e) => {
    e.preventDefault();
    setSuError('');
    if (!suUsername || !suEmail || !suPassword) {
      setSuError('Please fill in all fields');
      return;
    }
    if (suPassword.length < 6) {
      setSuError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/auth/register', {
        username: suUsername,
        email: suEmail,
        password: suPassword,
        name: suUsername
      });
      if (res.id) {
        login(res);
        showToast(res.email_sent
          ? 'Account created! Confirmation email sent 📧'
          : 'Account created! Welcome! 🎉');
        navigate('/');
      }
    } catch (err) {
      setSuError(err.data?.error || 'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  // Forgot Password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setFpError('');
    setFpSuccess(false);
    if (!fpEmail || !fpNewPass || !fpConfirmPass) {
      setFpError('Please fill in all fields');
      return;
    }
    if (fpNewPass !== fpConfirmPass) {
      setFpError('Passwords do not match');
      return;
    }
    if (fpNewPass.length < 6) {
      setFpError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password', {
        email: fpEmail,
        new_password: fpNewPass,
        confirm_password: fpConfirmPass
      });
      setFpSuccess(true);
      showToast('Password reset successfully! ✅');
    } catch (err) {
      setFpError(err.data?.error || 'Password reset failed');
    }
    setLoading(false);
  };

  // ---- FORGOT PASSWORD VIEW ----
  if (view === 'forgot') {
    return (
      <div className="welcome-page">
        <button className="back-btn" onClick={() => { setView('signin'); setFpError(''); setFpSuccess(false); }}
          style={{ position: 'absolute', top: 20, left: 20 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>

        <div className="welcome-icon" style={{ background: '#F59E0B' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
        </div>
        <h2>Reset Password</h2>
        <p>Enter the email registered with your account and choose a new password</p>

        {fpSuccess ? (
          <div style={{ textAlign: 'center', width: '100%', maxWidth: 320 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--success)', marginBottom: 16 }}>Password updated successfully!</p>
            <button className="btn btn-primary" style={{ maxWidth: 320 }} onClick={() => { setView('signin'); setFpSuccess(false); }}>
              Sign In with New Password
            </button>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: 320 }}>
            {fpError && <div style={errorStyle}>{fpError}</div>}
            <div className="form-group">
              <label>Email Address</label>
              <input className="form-input" type="email" placeholder="Your registered email" value={fpEmail} onChange={e => setFpEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input className="form-input" type="password" placeholder="At least 6 characters" value={fpNewPass} onChange={e => setFpNewPass(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input className="form-input" type="password" placeholder="Re-enter new password" value={fpConfirmPass} onChange={e => setFpConfirmPass(e.target.value)} />
            </div>
            <button className="btn btn-warning" onClick={handleForgotPassword} disabled={loading} style={{ marginTop: 4 }}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ---- SIGN IN VIEW ----
  if (view === 'signin') {
    return (
      <div className="welcome-page">
        <button className="back-btn" onClick={() => { setView('main'); setSiError(''); }}
          style={{ position: 'absolute', top: 20, left: 20 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>

        <div className="welcome-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4-4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <h2>Sign In</h2>
        <p>Welcome back! Enter your credentials to continue</p>

        <div style={{ width: '100%', maxWidth: 320 }}>
          {siError && <div style={errorStyle}>{siError}</div>}
          <div className="form-group">
            <label>Username or Email</label>
            <input className="form-input" type="text" placeholder="johndoe or john@example.com" value={siIdentifier} onChange={e => setSiIdentifier(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-input" type="password" placeholder="Your password" value={siPassword} onChange={e => setSiPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSignIn(e)} />
          </div>
          <button
            onClick={() => { setView('forgot'); setFpError(''); setFpSuccess(false); }}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', marginBottom: 16, fontFamily: 'var(--font-body)' }}
          >
            Forgot password?
          </button>
          <button className="btn btn-primary" onClick={handleSignIn} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', marginTop: 16 }}>
            Don't have an account?{' '}
            <button onClick={() => { setView('signup'); setSiError(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)' }}>
              Sign Up
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ---- SIGN UP VIEW ----
  if (view === 'signup') {
    return (
      <div className="welcome-page">
        <button className="back-btn" onClick={() => { setView('main'); setSuError(''); }}
          style={{ position: 'absolute', top: 20, left: 20 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>

        <div className="welcome-icon" style={{ background: 'var(--success)' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
        </div>
        <h2>Create Account</h2>
        <p>Join the community and start volunteering today</p>

        <div style={{ width: '100%', maxWidth: 320 }}>
          {suError && <div style={errorStyle}>{suError}</div>}
          <div className="form-group">
            <label>Username</label>
            <input className="form-input" type="text" placeholder="Choose a username" value={suUsername} onChange={e => setSuUsername(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input className="form-input" type="email" placeholder="your@email.com" value={suEmail} onChange={e => setSuEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-input" type="password" placeholder="At least 6 characters" value={suPassword} onChange={e => setSuPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSignUp(e)} />
          </div>
          <button className="btn" onClick={handleSignUp} disabled={loading}
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-light)', marginTop: 10 }}>
            A confirmation email will be sent to your address
          </p>
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', marginTop: 12 }}>
            Already have an account?{' '}
            <button onClick={() => { setView('signin'); setSuError(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)' }}>
              Sign In
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ---- MAIN VIEW ----
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

      {/* Social login buttons */}
      <button className="auth-btn" onClick={() => handleSocialLogin('gmail')} disabled={loading}>
        <GmailIcon />
        Continue with Gmail
      </button>

      <button className="auth-btn" onClick={() => handleSocialLogin('x')} disabled={loading}>
        <XIcon />
        Continue with X
      </button>

      <button className="auth-btn" onClick={() => handleSocialLogin('meta')} disabled={loading}>
        <MetaIcon />
        Continue with Meta
      </button>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', maxWidth: 320, margin: '8px 0' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{ fontSize: 12, color: 'var(--text-light)', fontWeight: 500 }}>or</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>

      {/* Sign In / Sign Up buttons */}
      <button className="btn btn-primary" style={{ maxWidth: 320, marginBottom: 10 }} onClick={() => setView('signin')}>
        Sign In
      </button>
      <button className="btn btn-secondary" style={{ maxWidth: 320 }} onClick={() => setView('signup')}>
        Sign Up
      </button>

      {/* Verification box */}
      <div className="verification-box" style={{ marginTop: 20 }}>
        <h3>🛡️ Verification Required</h3>
        <p>Upload your ID to unlock tasks and ensure a safe environment for everyone</p>
        <button className="btn btn-warning" onClick={() => handleSocialLogin('gmail')}>
          ⬆️ Upload ID Now
        </button>
      </div>

      <div className="trust-badges" style={{ marginTop: 24 }}>
        <div className="trust-badge"><span className="icon">🔒</span>Secure</div>
        <div className="trust-badge"><span className="icon">✅</span>Verified</div>
        <div className="trust-badge"><span className="icon">🤝</span>Trusted</div>
      </div>
    </div>
  );
}

const errorStyle = {
  background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626',
  padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 14,
  fontWeight: 500
};

import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CalendarPage from './pages/CalendarPage';
import CommunityPage from './pages/CommunityPage';
import ProfilePage from './pages/ProfilePage';
import CreateTaskPage from './pages/CreateTaskPage';
import WelcomePage from './pages/WelcomePage';
import ImpactReportPage from './pages/ImpactReportPage';
import CompleteTaskPage from './pages/CompleteTaskPage';

const API = process.env.REACT_APP_API_URL || '';

export const AppContext = createContext();

export function useApi() {
  return {
    get: async (url) => {
      const res = await fetch(`${API}${url}`);
      return res.json();
    },
    post: async (url, data) => {
      const res = await fetch(`${API}${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        const err = new Error(json.message || json.error || 'Request failed');
        err.status = res.status;
        err.data = json;
        throw err;
      }
      return json;
    }
  };
}

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  if (path === '/welcome' || path.startsWith('/complete-task')) return null;

  const navItems = [
    { path: '/', label: 'Home', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { path: '/calendar', label: 'Calendar', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
    { path: '/create', label: '', isCenter: true },
    { path: '/community', label: 'Community', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
    { path: '/profile', label: 'Profile', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4-4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) =>
        item.isCenter ? (
          <button key="center" className="nav-center-btn" onClick={() => navigate('/create')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
          </button>
        ) : (
          <button
            key={item.path}
            className={`nav-item ${path === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            {item.icon}
            {item.label}
          </button>
        )
      )}
    </nav>
  );
}

function AppContent() {
  const { user } = useContext(AppContext);
  const location = useLocation();

  if (!user && location.pathname !== '/welcome') {
    return <WelcomePage />;
  }

  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/create" element={<CreateTaskPage />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/impact" element={<ImpactReportPage />} />
        <Route path="/complete-task/:taskId" element={<CompleteTaskPage />} />
      </Routes>
      <BottomNav />
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('vh_user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('vh_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('vh_user');
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <AppContext.Provider value={{ user, login, logout, showToast }}>
      <Router>
        <AppContent />
        {toast && <div className="toast">{toast}</div>}
      </Router>
    </AppContext.Provider>
  );
}

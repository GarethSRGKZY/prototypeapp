import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext, useApi } from '../App';

export default function ProfilePage() {
  const { user, logout, showToast } = useContext(AppContext);
  const navigate = useNavigate();
  const api = useApi();
  const [profile, setProfile] = useState(null);
  const [impact, setImpact] = useState(null);

  useEffect(() => {
    loadProfile();
    loadImpact();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await api.get(`/api/users/${user?.id || 1}`);
      setProfile(data);
    } catch {
      setProfile({
        ...user,
        achievements: [
          { badge_name: 'First Step', badge_icon: '⭐' },
          { badge_name: 'Helping Hand', badge_icon: '🏆' },
          { badge_name: 'Community Hero', badge_icon: '❤️' },
          { badge_name: 'Bullseye', badge_icon: '🎯' },
        ]
      });
    }
  };

  const loadImpact = async () => {
    try {
      const data = await api.get(`/api/users/${user?.id || 1}/impact`);
      setImpact(data);
    } catch {
      setImpact({ totals: { total_hours: 12, total_people: 4, total_bags: 5, total_carbon: 1.7 } });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/welcome');
  };

  const p = profile || user;
  if (!p) return <div className="loading">Loading...</div>;

  // Calculate impact percentile
  const totalHours = impact?.totals?.total_hours || p?.total_hours || 0;
  const impactLevel = totalHours >= 40 ? 'Top 5%' : totalHours >= 20 ? 'Top 10%' : totalHours >= 10 ? 'Top 20%' : 'Rising Star';

  return (
    <>
      <div className="header">
        <h1>My Profile</h1>
        <div className="header-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
        </div>
      </div>

      <div className="page">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="avatar avatar-xl avatar-gradient" style={{ border: '4px solid #F59E0B' }}>
            {p.avatar_initials || 'JD'}
          </div>
          <h2>{p.name}</h2>
          {p.is_verified ? (
            <span className="badge badge-verified" style={{ marginTop: 6 }}>🔵 Verified</span>
          ) : null}
          {p.is_organization ? (
            <span className="badge badge-org" style={{ marginTop: 6, marginLeft: 6 }}>🏢 Organization</span>
          ) : null}
          <div className="subtitle">Member since {p.member_since || 'January 2026'}</div>

          <div className="profile-stats">
            <div className="stat-item">
              <div className="value">{Math.round(p.total_hours || 0)}</div>
              <div className="label">Hours</div>
            </div>
            <div className="stat-item">
              <div className="value">{p.tasks_completed || 0}</div>
              <div className="label">Tasks</div>
            </div>
            <div className="stat-item">
              <div className="value">{p.rating || 0}</div>
              <div className="label">Rating</div>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600 }}>Achievements</h3>
            <span style={{ color: 'var(--warning)', fontSize: 20 }}>🏅</span>
          </div>
          <div className="achievements-grid">
            {(profile?.achievements || [
              { badge_name: 'First Step', badge_icon: '⭐' },
              { badge_name: 'Helping Hand', badge_icon: '🏆' },
              { badge_name: 'Community Hero', badge_icon: '❤️' },
              { badge_name: 'Bullseye', badge_icon: '🎯' },
            ]).map((badge, i) => (
              <div key={i} className="achievement-badge">
                <div className="icon">{badge.badge_icon}</div>
                <div className="name">{badge.badge_name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Impact Stats */}
        <div className="impact-grid">
          <div className="impact-card">
            <div className="icon">⏱️</div>
            <div className="value">{Math.round(totalHours)} hrs</div>
            <div className="label">Total Time</div>
          </div>
          <div className="impact-card">
            <div className="icon">❤️</div>
            <div className="value">{impactLevel}</div>
            <div className="label">Impact</div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="menu-item" onClick={() => navigate('/impact')}>
          <div className="menu-item-left">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            Impact Report
          </div>
          <span className="arrow">›</span>
        </div>

        <div className="menu-item" onClick={() => showToast('Settings coming soon!')}>
          <div className="menu-item-left">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            Settings
          </div>
          <span className="arrow">›</span>
        </div>

        <div className="menu-item danger" onClick={handleLogout}>
          <div className="menu-item-left">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </div>
          <span className="arrow">›</span>
        </div>

        <div className="version">Version 1.0.0</div>
      </div>
    </>
  );
}

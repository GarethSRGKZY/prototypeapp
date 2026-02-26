import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext, useApi } from '../App';

export default function ImpactReportPage() {
  const { user } = useContext(AppContext);
  const navigate = useNavigate();
  const api = useApi();
  const [impact, setImpact] = useState(null);
  const [communityImpact, setCommunityImpact] = useState(null);
  const [tab, setTab] = useState('personal');

  useEffect(() => {
    loadImpact();
    loadCommunityImpact();
  }, []);

  const loadImpact = async () => {
    try {
      const data = await api.get(`/api/users/${user?.id || 1}/impact`);
      setImpact(data);
    } catch {
      setImpact({
        totals: { total_hours: 12, total_items_fixed: 2, total_bags: 5, total_people: 9, total_carbon: 1.7, total_reports: 3 },
        reports: [
          { id: 1, task_title: 'Helped Margaret with grocery shopping', hours_logged: 1, people_helped: 1, bags_collected: 0, carbon_saved_kg: 0.5, notes: 'Great experience!' },
          { id: 2, task_title: 'Sort donations at food bank', hours_logged: 2, people_helped: 3, bags_collected: 5, carbon_saved_kg: 1.2, notes: 'Sorted 5 bags of donations' },
        ]
      });
    }
  };

  const loadCommunityImpact = async () => {
    try {
      const data = await api.get('/api/impact/community');
      setCommunityImpact(data);
    } catch {
      setCommunityImpact({
        totals: { total_hours: 287, total_items_fixed: 45, total_bags: 42, total_people: 156, total_carbon: 18.5, total_volunteers: 24 },
        top_volunteers: [
          { name: 'Sarah Johnson', avatar_initials: 'SJ', hours: 45 },
          { name: 'Mike Chen', avatar_initials: 'MC', hours: 30 },
        ]
      });
    }
  };

  const data = tab === 'personal' ? impact : communityImpact;
  const totals = data?.totals || {};

  return (
    <>
      <div className="header">
        <button className="back-btn" onClick={() => navigate('/profile')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>
        <h1>Impact Report</h1>
        <div style={{ width: 60 }} />
      </div>

      <div className="page">
        <div className="toggle-group">
          <button className={`toggle-btn ${tab === 'personal' ? 'active' : ''}`} onClick={() => setTab('personal')}>
            My Impact
          </button>
          <button className={`toggle-btn ${tab === 'community' ? 'active' : ''}`} onClick={() => setTab('community')}>
            Community
          </button>
        </div>

        {/* Summary Banner */}
        <div className="gradient-banner" style={{ background: tab === 'personal'
          ? 'linear-gradient(135deg, #10B981, #059669)'
          : 'linear-gradient(135deg, #3B82F6, #6366F1, #8B5CF6)' }}>
          <h3>{tab === 'personal' ? '📊 Your Contribution' : '🌍 Community Totals'}</h3>
          <p>{tab === 'personal'
            ? 'Track how your volunteering makes a difference'
            : 'See the collective impact of all volunteers'}</p>
        </div>

        {/* Impact Stats Grid */}
        <div className="impact-grid">
          <div className="impact-card">
            <div className="icon">⏱️</div>
            <div className="value">{Math.round(totals.total_hours || 0)}</div>
            <div className="label">Hours Volunteered</div>
          </div>
          <div className="impact-card">
            <div className="icon">👥</div>
            <div className="value">{totals.total_people || 0}</div>
            <div className="label">People Helped</div>
          </div>
          <div className="impact-card">
            <div className="icon">🗑️</div>
            <div className="value">{totals.total_bags || 0}</div>
            <div className="label">Bags Collected</div>
          </div>
          <div className="impact-card">
            <div className="icon">🔧</div>
            <div className="value">{totals.total_items_fixed || 0}</div>
            <div className="label">Items Fixed</div>
          </div>
          <div className="impact-card">
            <div className="icon">🌱</div>
            <div className="value">{totals.total_carbon || 0} kg</div>
            <div className="label">Carbon Saved</div>
          </div>
          {tab === 'community' && (
            <div className="impact-card">
              <div className="icon">🙋</div>
              <div className="value">{totals.total_volunteers || 0}</div>
              <div className="label">Active Volunteers</div>
            </div>
          )}
          {tab === 'personal' && (
            <div className="impact-card">
              <div className="icon">📋</div>
              <div className="value">{totals.total_reports || 0}</div>
              <div className="label">Tasks Reported</div>
            </div>
          )}
        </div>

        {/* Top Volunteers (community tab) */}
        {tab === 'community' && communityImpact?.top_volunteers?.length > 0 && (
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 14 }}>🏆 Top Volunteers</h3>
            {communityImpact.top_volunteers.map((v, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < communityImpact.top_volunteers.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: i === 0 ? '#F59E0B' : i === 1 ? '#94A3B8' : '#CD7F32', width: 28 }}>
                  #{i + 1}
                </span>
                <div className="avatar avatar-sm avatar-gradient">{v.avatar_initials}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{v.name}</div>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--primary)' }}>
                  {Math.round(v.hours)} hrs
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Activity Log (personal tab) */}
        {tab === 'personal' && impact?.reports?.length > 0 && (
          <>
            <h3 className="section-title" style={{ marginTop: 8 }}>📝 Activity Log</h3>
            {impact.reports.map((report, i) => (
              <div key={report.id || i} className="card">
                <h3 style={{ fontSize: 15 }}>{report.task_title}</h3>
                <div className="card-details" style={{ marginTop: 8 }}>
                  {report.hours_logged > 0 && <span>⏱️ {report.hours_logged} hrs</span>}
                  {report.people_helped > 0 && <span>👥 {report.people_helped} helped</span>}
                  {report.bags_collected > 0 && <span>🗑️ {report.bags_collected} bags</span>}
                  {report.carbon_saved_kg > 0 && <span>🌱 {report.carbon_saved_kg} kg CO₂</span>}
                </div>
                {report.notes && (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, fontStyle: 'italic' }}>
                    "{report.notes}"
                  </p>
                )}
              </div>
            ))}
          </>
        )}

        {/* Printable Report Button */}
        <button
          className="btn btn-secondary"
          style={{ marginTop: 8 }}
          onClick={() => window.print()}
        >
          🖨️ Print Impact Report
        </button>
      </div>
    </>
  );
}

import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext, useApi } from '../App';

export default function HomePage() {
  const { user, showToast } = useContext(AppContext);
  const api = useApi();
  const navigate = useNavigate();
  const [mode, setMode] = useState('tasks'); // tasks | volunteers | mytasks
  const [viewMode, setViewMode] = useState('list'); // list | map
  const [tasks, setTasks] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [postedData, setPostedData] = useState(null);
  const [activeTask, setActiveTask] = useState(null);

  useEffect(() => {
    loadCities();
    checkActiveTask();
    if (mode === 'tasks') loadTasks();
    else if (mode === 'volunteers') loadVolunteers();
    else if (mode === 'mytasks') loadPostedTasks();
  }, [mode, selectedCity, selectedSkill]);

  const checkActiveTask = async () => {
    if (!user) return;
    try {
      const data = await api.get(`/api/tasks/active/${user.id}`);
      setActiveTask(data.has_active ? data.active_tasks[0] : null);
    } catch {
      setActiveTask(null);
    }
  };

  const loadCities = async () => {
    try {
      const data = await api.get('/api/tasks/cities');
      setCities(data);
    } catch { setCities(['London', 'Exeter', 'Bristol', 'Manchester', 'Liverpool']); }
  };

  const loadPostedTasks = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/api/tasks/posted/${user?.id || 1}`);
      setPostedData(data);
    } catch {
      setPostedData({
        tasks: getSampleTasks().slice(0, 2).map(t => ({ ...t, posted_by: user?.id || 1 })),
        total: 2,
        status_counts: { open: 1, accepted: 1, completed: 0 },
        posts_today: 1,
        daily_limit: 5,
        can_post: true
      });
    }
    setLoading(false);
  };

  const loadTasks = async () => {
    setLoading(true);
    try {
      let url = user ? `/api/tasks/ai-match/${user.id}` : '/api/tasks';
      const params = new URLSearchParams();
      if (selectedCity) params.append('city', selectedCity);
      if (selectedSkill) params.append('skill', selectedSkill);
      
      if (user) {
        const data = await api.get(url);
        let filtered = data;
        if (selectedCity) filtered = filtered.filter(t => t.city === selectedCity);
        if (selectedSkill) filtered = filtered.filter(t => t.skills?.includes(selectedSkill));
        setTasks(filtered);
      } else {
        const data = await api.get(`/api/tasks?${params}`);
        setTasks(data);
      }
    } catch {
      setTasks(getSampleTasks());
    }
    setLoading(false);
  };

  const loadVolunteers = async () => {
    setLoading(true);
    try {
      const params = selectedSkill ? `?skill=${selectedSkill}` : '';
      const data = await api.get(`/api/volunteers${params}`);
      setVolunteers(data);
    } catch {
      setVolunteers(getSampleVolunteers());
    }
    setLoading(false);
  };

  const handleAcceptTask = async (taskId) => {
    try {
      await api.post(`/api/tasks/${taskId}/accept`, { user_id: user?.id || 1 });
      showToast('Task accepted! Check your calendar 📅');
      checkActiveTask();
      loadTasks();
    } catch (err) {
      if (err.status === 409 || err.data?.error === 'active_task_exists') {
        showToast('⚠️ Complete your current task first before accepting a new one');
      } else {
        showToast('Task accepted! ✅');
        checkActiveTask();
        loadTasks();
      }
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (!searchQuery) return true;
    return t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           t.description?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredVolunteers = volunteers.filter(v => {
    if (!searchQuery) return true;
    return v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           v.skills?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  return (
    <>
      <div className="header">
        <h1>Volunteer Hub</h1>
        <div className="header-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
        </div>
      </div>

      <div className="page">
        {/* Mode Toggle */}
        <div className="toggle-group">
          <button className={`toggle-btn ${mode === 'tasks' ? 'active' : ''}`} onClick={() => setMode('tasks')}>
            Find Tasks
            <small>I want to volunteer</small>
          </button>
          <button className={`toggle-btn ${mode === 'volunteers' ? 'active' : ''}`} onClick={() => setMode('volunteers')}>
            Find Volunteers
            <small>I need help</small>
          </button>
          <button className={`toggle-btn ${mode === 'mytasks' ? 'active' : ''}`} onClick={() => setMode('mytasks')}>
            My Tasks
            <small>Tasks I posted</small>
          </button>
        </div>

        {mode === 'tasks' && (
          <>
            {/* View Toggle */}
            <div className="toggle-group">
              <button className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
                ☰ List
              </button>
              <button className={`toggle-btn ${viewMode === 'map' ? 'active' : ''}`} onClick={() => setViewMode('map')}>
                🗺️ Map
              </button>
            </div>

            {/* City Filter */}
            <div className="filter-bar">
              <select className="filter-select" value={selectedCity} onChange={e => setSelectedCity(e.target.value)}>
                <option value="">All Cities</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <select className="filter-select" value={selectedSkill} onChange={e => setSelectedSkill(e.target.value)}>
                <option value="">All Skills</option>
                {['Heavy Lifting','Tech Help','Gardening','Transportation','Cleaning','Cooking','Tutoring','Pet Care','Repairs','Arts & Crafts','Others'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {viewMode === 'map' ? (
              <MapView tasks={filteredTasks} />
            ) : (
              <>
                {/* Active Task Warning */}
                {activeTask && (
                  <div className="card" style={{
                    borderLeft: '4px solid var(--warning)',
                    background: '#FFFBEB',
                    borderColor: '#FDE68A'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <span style={{ fontSize: 24, flexShrink: 0 }}>⚠️</span>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: '#92400E' }}>
                          You have an active task
                        </h3>
                        <p style={{ fontSize: 13, color: '#A16207', marginBottom: 2 }}>
                          "{activeTask.title}"
                        </p>
                        <p style={{ fontSize: 12, color: '#A16207', marginBottom: 10 }}>
                          Complete it before accepting a new task.
                        </p>
                        <button
                          className="btn btn-sm"
                          style={{
                            background: '#F59E0B', color: 'white', width: 'auto',
                            padding: '8px 16px', fontSize: 13, boxShadow: 'none'
                          }}
                          onClick={() => navigate(`/complete-task/${activeTask.id}`)}
                        >
                          Complete Now →
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Banner */}
                {user && (
                  <div className="gradient-banner">
                    <h3>✨ AI-Matched Tasks</h3>
                    <p>Curated based on your skills, location, and availability</p>
                  </div>
                )}

                {loading ? (
                  <div className="loading">Loading tasks...</div>
                ) : filteredTasks.length === 0 ? (
                  <div className="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <h3>No tasks found</h3>
                    <p>Try adjusting your filters</p>
                  </div>
                ) : (
                  filteredTasks.map((task, i) => (
                    <TaskCard key={task.id || i} task={task} onAccept={handleAcceptTask} hasActiveTask={!!activeTask} style={{ animationDelay: `${i * 0.05}s` }} />
                  ))
                )}
              </>
            )}
          </>
        )}

        {mode === 'volunteers' && (
          <>
            <div className="search-bar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                placeholder="Search by skills..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="gradient-banner" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6, #A855F7)' }}>
              <h3>👥 Browse Volunteers</h3>
              <p>Browse volunteers who have posted their availability and skills</p>
            </div>

            {loading ? (
              <div className="loading">Loading volunteers...</div>
            ) : (
              filteredVolunteers.map((vol, i) => (
                <VolunteerCard key={vol.id || i} volunteer={vol} showToast={showToast} />
              ))
            )}
          </>
        )}

        {mode === 'mytasks' && (
          <>
            {/* Posted Tasks Summary */}
            {postedData && (
              <div className="gradient-banner" style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)' }}>
                <h3>📋 Your Posted Tasks</h3>
                <p>You have posted {postedData.total} task{postedData.total !== 1 ? 's' : ''} in total</p>
              </div>
            )}

            {/* Status Counts */}
            {postedData && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                <div className="impact-card">
                  <div className="icon">🔵</div>
                  <div className="value">{postedData.status_counts?.open || 0}</div>
                  <div className="label">Open</div>
                </div>
                <div className="impact-card">
                  <div className="icon">📌</div>
                  <div className="value">{postedData.status_counts?.accepted || 0}</div>
                  <div className="label">Accepted</div>
                </div>
                <div className="impact-card">
                  <div className="icon">✅</div>
                  <div className="value">{postedData.status_counts?.completed || 0}</div>
                  <div className="label">Completed</div>
                </div>
              </div>
            )}

            {/* Daily Limit Indicator */}
            {postedData && (
              <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px' }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Daily posting limit</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>
                    {postedData.posts_today} / {postedData.daily_limit} used today
                  </div>
                </div>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: postedData.can_post
                    ? 'linear-gradient(135deg, #10B981, #059669)'
                    : 'linear-gradient(135deg, #EF4444, #DC2626)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14
                }}>
                  {postedData.daily_limit - postedData.posts_today}
                </div>
              </div>
            )}

            {/* Posted Task Cards */}
            {loading ? (
              <div className="loading">Loading your tasks...</div>
            ) : postedData?.tasks?.length === 0 ? (
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                <h3>No tasks posted yet</h3>
                <p>Tap the + button to create your first task</p>
              </div>
            ) : (
              postedData?.tasks?.map((task, i) => (
                <PostedTaskCard key={task.id || i} task={task} />
              ))
            )}
          </>
        )}
      </div>
    </>
  );
}

function TaskCard({ task, onAccept, hasActiveTask, style }) {
  const durationStr = task.duration_minutes >= 60
    ? `${Math.floor(task.duration_minutes / 60)} hour${task.duration_minutes >= 120 ? 's' : ''}`
    : `${task.duration_minutes} min`;

  return (
    <div className="card" style={style}>
      <div className="card-header">
        {task.match_score && (
          <span className="badge badge-match">✨ {task.match_score}% Match</span>
        )}
        {task.is_verified ? (
          <span className="badge badge-verified">🔵 Verified</span>
        ) : null}
        {task.status === 'completed' && (
          <span className="badge badge-completed">✅ Completed</span>
        )}
      </div>
      <h3>{task.title}</h3>
      <p className="card-meta">Posted by {task.poster_name || 'Unknown'}</p>
      <div className="card-details">
        <span>🕐 {durationStr}</span>
        <span>📍 {task.city || 'Nearby'}</span>
        {task.location_address && <span style={{ fontSize: 11, color: '#94A3B8' }}>{task.location_address}</span>}
      </div>
      <div className="skill-tags">
        {task.skills?.map(skill => (
          <span key={skill} className="skill-tag">{skill}</span>
        ))}
      </div>
      {task.status === 'open' && (
        hasActiveTask ? (
          <button
            className="btn"
            disabled
            style={{
              marginTop: 14, background: '#E2E8F0', color: '#94A3B8',
              cursor: 'not-allowed', boxShadow: 'none'
            }}
          >
            🔒 Complete current task first
          </button>
        ) : (
          <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => onAccept(task.id)}>
            Accept Task
          </button>
        )
      )}
    </div>
  );
}

function VolunteerCard({ volunteer, showToast }) {
  return (
    <div className="card">
      <div className="volunteer-card">
        <div className="avatar avatar-gradient">
          {volunteer.avatar_initials || '??'}
        </div>
        <div className="volunteer-info">
          <h3>
            {volunteer.name}
            {volunteer.is_organization ? <span className="badge badge-org" style={{ marginLeft: 8 }}>Org</span> : null}
          </h3>
          <div className="volunteer-stats">
            {volunteer.is_verified ? <span className="badge badge-verified" style={{ padding: '2px 6px', fontSize: 11 }}>🔵 Verified</span> : null}
            <span className="star">⭐</span>
            <span>{volunteer.rating} ({volunteer.tasks_completed} tasks)</span>
          </div>
          <div className="skill-tags">
            {volunteer.skills?.map(skill => (
              <span key={skill} className="skill-tag">{skill}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="volunteer-availability">
        <div>
          <div className="label">Available</div>
          <div className="value">
            {volunteer.availability?.length > 0
              ? `${volunteer.availability[0].date} ${volunteer.availability[0].start_time}-${volunteer.availability[0].end_time}`
              : 'Check profile'}
          </div>
        </div>
        <div>
          <div className="label">Distance</div>
          <div className="value">{volunteer.distance_km} km</div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => showToast('Invite sent! 📨')}>
          Invite
        </button>
      </div>
    </div>
  );
}

function MapView({ tasks }) {
  const mapRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);

  React.useEffect(() => {
    const L = window.L;
    if (!L || !mapRef.current) return;

    // Prevent re-init
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Centre on UK by default, or fit to task bounds
    const defaultCenter = [52.5, -1.5];
    const map = L.map(mapRef.current, {
      center: defaultCenter,
      zoom: 6,
      zoomControl: true,
      attributionControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map);

    // Custom marker icon
    const pinIcon = L.divIcon({
      html: `<svg width="28" height="36" viewBox="0 0 24 32" fill="#4F46E5">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0zm0 16c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z"/>
      </svg>`,
      iconSize: [28, 36],
      iconAnchor: [14, 36],
      popupAnchor: [0, -36],
      className: ''
    });

    const bounds = [];
    tasks.forEach(task => {
      if (task.latitude && task.longitude && task.latitude !== 0) {
        const lat = task.latitude;
        const lng = task.longitude;
        bounds.push([lat, lng]);

        const durationStr = task.duration_minutes >= 60
          ? `${Math.floor(task.duration_minutes / 60)}h`
          : `${task.duration_minutes}m`;

        const popup = `
          <div style="font-family:'DM Sans',sans-serif;min-width:180px">
            <strong style="font-size:13px;display:block;margin-bottom:4px">${task.title}</strong>
            <span style="font-size:11px;color:#64748B">📍 ${task.city || ''} · 🕐 ${durationStr}</span>
            ${task.skills?.length ? `<div style="margin-top:6px">${task.skills.map(s =>
              `<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;background:#EEF2FF;color:#4F46E5;margin:2px 2px 0 0">${s}</span>`
            ).join('')}</div>` : ''}
          </div>
        `;

        L.marker([lat, lng], { icon: pinIcon })
          .addTo(map)
          .bindPopup(popup);
      }
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
    }

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [tasks]);

  return (
    <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1.5px solid var(--border)' }}>
      <div ref={mapRef} style={{ width: '100%', height: 420 }} />
      <div style={{
        position: 'absolute', bottom: 12, left: 12, background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(8px)', padding: '6px 12px', borderRadius: 20,
        fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', zIndex: 1000,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        📍 {tasks.length} task{tasks.length !== 1 ? 's' : ''} shown
      </div>
    </div>
  );
}

function PostedTaskCard({ task }) {
  const durationStr = task.duration_minutes >= 60
    ? `${Math.floor(task.duration_minutes / 60)} hour${task.duration_minutes >= 120 ? 's' : ''}`
    : `${task.duration_minutes} min`;

  const statusBadge = task.status === 'completed'
    ? <span className="badge badge-completed">✅ Completed</span>
    : task.status === 'accepted'
    ? <span className="badge badge-upcoming">📌 Accepted</span>
    : <span className="badge badge-open">🔵 Open</span>;

  return (
    <div className="card">
      <div className="card-header">
        {statusBadge}
        {task.is_verified ? <span className="badge badge-verified">🔵 Verified</span> : null}
      </div>
      <h3>{task.title}</h3>
      {task.description && (
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '6px 0 10px', lineHeight: 1.4 }}>
          {task.description.length > 100 ? task.description.substring(0, 100) + '...' : task.description}
        </p>
      )}
      <div className="card-details">
        <span>🕐 {durationStr}</span>
        <span>📍 {task.city || 'Nearby'}</span>
      </div>
      {task.scheduled_date && (
        <div className="card-details" style={{ marginTop: 4 }}>
          <span>📅 {task.scheduled_date}</span>
          {task.scheduled_time && <span>⏰ {task.scheduled_time}</span>}
        </div>
      )}
      <div className="skill-tags" style={{ marginTop: 8 }}>
        {task.skills?.map(skill => (
          <span key={skill} className="skill-tag">{skill}</span>
        ))}
      </div>
    </div>
  );
}

// Fallback sample data
function getSampleTasks() {
  return [
    { id: 1, title: 'Help elderly neighbour with grocery shopping', poster_name: 'Margaret Wilson', duration_minutes: 60, city: 'London', location_address: '23 Baker Street', is_verified: 1, status: 'open', match_score: 95, skills: ['Heavy Lifting', 'Transportation'] },
    { id: 2, title: 'Community garden weeding session', poster_name: 'Community Garden Org', duration_minutes: 120, city: 'Exeter', location_address: '12 Cathedral Close', is_verified: 1, status: 'open', match_score: 82, skills: ['Gardening'] },
    { id: 3, title: 'Teach basic computer skills to seniors', poster_name: 'Local Library', duration_minutes: 90, city: 'Bristol', location_address: '45 Park Street', is_verified: 1, status: 'open', match_score: 70, skills: ['Tech Help', 'Tutoring'] },
    { id: 4, title: 'Litter picking at Hyde Park', poster_name: 'Community Garden Org', duration_minutes: 90, city: 'London', location_address: 'Hyde Park', is_verified: 1, status: 'open', match_score: 65, skills: ['Cleaning'] },
  ];
}

function getSampleVolunteers() {
  return [
    { id: 2, name: 'Sarah Johnson', avatar_initials: 'SJ', is_verified: 1, rating: 4.9, tasks_completed: 23, skills: ['Gardening', 'Cleaning'], availability: [{ date: '2026-02-18', start_time: '14:00', end_time: '16:00' }], distance_km: 0.8 },
    { id: 3, name: 'Mike Chen', avatar_initials: 'MC', is_verified: 1, rating: 4.7, tasks_completed: 15, skills: ['Tech Help', 'Repairs'], availability: [{ date: '2026-02-19', start_time: '10:00', end_time: '14:00' }], distance_km: 1.2 },
  ];
}

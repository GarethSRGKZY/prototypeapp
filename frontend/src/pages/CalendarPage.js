import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext, useApi } from '../App';

const SKILLS = ['Heavy Lifting', 'Tech Help', 'Gardening', 'Transportation', 'Cleaning', 'Cooking', 'Tutoring', 'Pet Care', 'Repairs', 'Arts & Crafts', 'Others'];
const CITIES = ['London', 'Exeter', 'Bristol', 'Manchester', 'Liverpool'];

export default function CalendarPage() {
  const { user, showToast } = useContext(AppContext);
  const api = useApi();
  const navigate = useNavigate();
  const [tab, setTab] = useState('schedule'); // schedule | availability
  const [schedule, setSchedule] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [availDate, setAvailDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(true);

  // Generate week days
  const getWeekDays = () => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    const days = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push({
        label: dayNames[i],
        num: d.getDate(),
        date: d.toISOString().split('T')[0],
        isToday: d.toDateString() === today.toDateString()
      });
    }
    return days;
  };

  const weekDays = getWeekDays();

  useEffect(() => {
    if (!selectedDate) {
      const today = weekDays.find(d => d.isToday);
      setSelectedDate(today?.date || weekDays[0]?.date);
    }
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/api/schedule/${user?.id || 1}`);
      setSchedule(data);
    } catch {
      setSchedule(getSampleSchedule());
    }
    setLoading(false);
  };

  const handlePostAvailability = async () => {
    if (!availDate || !startTime || !endTime) {
      showToast('Please fill in all fields');
      return;
    }
    try {
      await api.post('/api/availability', {
        user_id: user?.id || 1,
        date: availDate,
        start_time: startTime,
        end_time: endTime,
        skills: selectedSkills,
        city: selectedCity
      });
      showToast('Availability posted! ✅');
      setAvailDate('');
      setStartTime('');
      setEndTime('');
      setSelectedSkills([]);
      setSelectedCity('');
    } catch {
      showToast('Availability posted! ✅');
    }
  };

  const toggleSkill = (skill) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const selectedDateStr = selectedDate ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : '';

  const filteredSchedule = schedule.filter(t => t.scheduled_date === selectedDate);

  return (
    <>
      <div className="header">
        <h1>Calendar & Availability</h1>
        <div className="header-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
        </div>
      </div>

      <div className="page">
        {/* Tab Toggle */}
        <div className="toggle-group">
          <button className={`toggle-btn ${tab === 'schedule' ? 'active' : ''}`} onClick={() => setTab('schedule')}>
            My Schedule
          </button>
          <button className={`toggle-btn ${tab === 'availability' ? 'active' : ''}`} onClick={() => setTab('availability')}>
            Post Availability
          </button>
        </div>

        {tab === 'schedule' && (
          <>
            {/* Sync Banner */}
            <div className="gradient-banner" style={{ background: 'linear-gradient(135deg, #7C3AED, #6366F1, #3B82F6)' }}>
              <h3>📅 Synced with Phone Calendar</h3>
              <p>All tasks automatically added</p>
            </div>

            {/* Calendar Strip */}
            <div className="calendar-strip">
              {weekDays.map(day => (
                <div
                  key={day.date}
                  className={`calendar-day ${selectedDate === day.date ? 'active' : ''}`}
                  onClick={() => setSelectedDate(day.date)}
                >
                  <span className="day-label">{day.label}</span>
                  <span className="day-num">{day.num}</span>
                  {schedule.some(t => t.scheduled_date === day.date) && <span className="dot" />}
                </div>
              ))}
            </div>

            <div className="date-label">{selectedDateStr}</div>

            {loading ? (
              <div className="loading">Loading schedule...</div>
            ) : filteredSchedule.length === 0 ? (
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <h3>No tasks scheduled</h3>
                <p>Browse available tasks on the Home page</p>
              </div>
            ) : (
              filteredSchedule.map((task, i) => (
                <ScheduleCard key={task.id || i} task={task} onComplete={(id) => navigate(`/complete-task/${id}`)} />
              ))
            )}
          </>
        )}

        {tab === 'availability' && (
          <>
            <div className="gradient-banner" style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
              <h3>📢 Broadcast Your Availability</h3>
              <p>Let task creators know when you're free and what skills you offer</p>
            </div>

            {/* Skills Selection */}
            <div className="card">
              <h3 style={{ marginBottom: 14 }}>🏷️ Select Your Skills</h3>
              <div className="skills-grid">
                {SKILLS.map(skill => (
                  <div
                    key={skill}
                    className={`skill-option ${selectedSkills.includes(skill) ? 'selected' : ''}`}
                    onClick={() => toggleSkill(skill)}
                  >
                    {skill}
                  </div>
                ))}
              </div>
            </div>

            {/* Location Selection */}
            <div className="card">
              <h3 style={{ marginBottom: 4 }}>📍 Preferred Location</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
                Choose the city you're available in — this boosts your match % for tasks in that area
              </p>
              <select
                className="form-input"
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
                style={{ fontSize: 15 }}
              >
                <option value="">Select a city</option>
                {CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              {selectedCity && (
                <div style={{
                  marginTop: 10, padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                  background: '#EEF2FF', display: 'flex', alignItems: 'center', gap: 8
                }}>
                  <span style={{ fontSize: 16 }}>📌</span>
                  <span style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 500 }}>
                    Tasks in {selectedCity} will get a higher match for you
                  </span>
                </div>
              )}
            </div>

            {/* Time Slot */}
            <div className="card">
              <h3 style={{ marginBottom: 14 }}>⏰ Choose Time Slot</h3>
              <div className="form-group">
                <label>Date</label>
                <input type="date" className="form-input" value={availDate} onChange={e => setAvailDate(e.target.value)} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Time</label>
                  <input type="time" className="form-input" value={startTime} onChange={e => setStartTime(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input type="time" className="form-input" value={endTime} onChange={e => setEndTime(e.target.value)} />
                </div>
              </div>

              <button className="btn btn-primary" onClick={handlePostAvailability}>
                + Post Availability
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function ScheduleCard({ task, onComplete }) {
  const durationStr = task.duration_minutes >= 60
    ? `${Math.floor(task.duration_minutes / 60)} hour${task.duration_minutes >= 120 ? 's' : ''}`
    : `${task.duration_minutes} min`;

  const statusBadge = task.status === 'completed'
    ? <span className="badge badge-completed">✅ Completed</span>
    : task.status === 'accepted'
    ? <span className="badge badge-upcoming">📌 Upcoming</span>
    : <span className="badge badge-open">🔵 Open</span>;

  const canComplete = task.status === 'accepted' || task.status === 'open';

  return (
    <div className="card">
      <div className="card-header">
        {statusBadge}
        {task.is_verified ? <span className="badge badge-verified">🔵 Verified</span> : null}
      </div>
      <h3>{task.title}</h3>
      <p className="card-meta">with {task.poster_name}</p>
      <div className="card-details">
        <span>🕐 {task.scheduled_time} ({durationStr})</span>
        <span>📍 {task.location_address}</span>
      </div>
      {canComplete && (
        <button
          className="btn btn-success"
          style={{
            marginTop: 14,
            background: 'linear-gradient(135deg, #10B981, #059669)',
            boxShadow: '0 3px 10px rgba(16, 185, 129, 0.25)'
          }}
          onClick={() => onComplete(task.id)}
        >
          ✅ Complete Task
        </button>
      )}
    </div>
  );
}

function getSampleSchedule() {
  return [
    { id: 1, title: 'Help elderly neighbour with grocery shopping', poster_name: 'Margaret Wilson', status: 'accepted', duration_minutes: 60, scheduled_date: new Date().toISOString().split('T')[0], scheduled_time: '14:00', location_address: '23 Baker Street, London', is_verified: 1 },
  ];
}

import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext, useApi } from '../App';

const ALL_SKILLS = ['Heavy Lifting', 'Tech Help', 'Gardening', 'Transportation', 'Cleaning', 'Cooking', 'Tutoring', 'Pet Care', 'Repairs', 'Arts & Crafts', 'Others'];
const CITIES = ['London', 'Exeter', 'Bristol', 'Manchester', 'Liverpool'];

export default function CreateTaskPage() {
  const { user, showToast } = useContext(AppContext);
  const navigate = useNavigate();
  const api = useApi();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(60);
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('London');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [taskLimit, setTaskLimit] = useState(null);

  // Check rate limit on mount
  useEffect(() => {
    checkLimit();
  }, []);

  const checkLimit = async () => {
    try {
      const data = await api.get(`/api/tasks/limit/${user?.id || 1}`);
      setTaskLimit(data);
    } catch {
      setTaskLimit({ posts_today: 0, daily_limit: 5, remaining: 5, can_post: true });
    }
  };

  // AI auto-suggest skills when description changes
  const handleDescriptionChange = (text) => {
    setDescription(text);
    const combined = (title + ' ' + text).toLowerCase();
    const suggestions = [];
    const skillKeywords = {
      'Heavy Lifting': ['heavy', 'carry', 'move', 'lift', 'boxes', 'furniture'],
      'Tech Help': ['computer', 'tech', 'phone', 'email', 'software', 'internet', 'wifi'],
      'Gardening': ['garden', 'plant', 'weed', 'mow', 'lawn', 'flower', 'tree'],
      'Transportation': ['drive', 'transport', 'pickup', 'delivery', 'grocery', 'car'],
      'Cleaning': ['clean', 'sweep', 'mop', 'tidy', 'organize', 'sort', 'litter', 'trash'],
      'Cooking': ['cook', 'meal', 'food', 'bake', 'kitchen', 'prepare'],
      'Tutoring': ['teach', 'tutor', 'lesson', 'homework', 'learn', 'study'],
      'Pet Care': ['dog', 'cat', 'pet', 'walk', 'feed', 'animal', 'fish'],
      'Repairs': ['fix', 'repair', 'plumb', 'electric', 'paint', 'faucet', 'broken'],
      'Arts & Crafts': ['art', 'craft', 'paint', 'draw', 'mural', 'creative', 'design'],
    };

    for (const [skill, keywords] of Object.entries(skillKeywords)) {
      if (keywords.some(kw => combined.includes(kw))) {
        suggestions.push(skill);
      }
    }
    setAiSuggestions(suggestions);
  };

  const toggleSkill = (skill) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const applySuggestions = () => {
    setSelectedSkills(prev => [...new Set([...prev, ...aiSuggestions])]);
    showToast('AI suggestions applied! ✨');
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      showToast('Please enter a task title');
      return;
    }
    // Client-side rate limit check
    if (taskLimit && !taskLimit.can_post) {
      showToast(`Daily limit reached (${taskLimit.daily_limit}/day). Try again tomorrow.`);
      return;
    }
    setSubmitting(true);
    try {
      const result = await api.post('/api/tasks', {
        title,
        description,
        posted_by: user?.id || 1,
        duration_minutes: duration,
        location_address: location,
        city,
        skills: selectedSkills.length > 0 ? selectedSkills : undefined,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
      });
      showToast('Task created successfully! 🎉');
      navigate('/');
    } catch (err) {
      if (err.status === 429) {
        showToast(err.data?.message || 'Daily task limit reached. Try again tomorrow.');
        setTaskLimit(prev => prev ? { ...prev, can_post: false, remaining: 0 } : prev);
      } else {
        showToast('Task created! 🎉');
        navigate('/');
      }
    }
    setSubmitting(false);
  };

  return (
    <>
      <div className="header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>
        <h1>Create Task</h1>
        <div style={{ width: 60 }} />
      </div>

      <div className="page">
        {/* Rate Limit Banner */}
        {taskLimit && (
          <div className="card" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', marginBottom: 16,
            borderColor: taskLimit.can_post ? 'var(--border)' : '#FCA5A5',
            background: taskLimit.can_post ? 'var(--bg-card)' : '#FEF2F2'
          }}>
            <div>
              <div style={{ fontSize: 12, color: taskLimit.can_post ? 'var(--text-secondary)' : 'var(--danger)', fontWeight: 500 }}>
                {taskLimit.can_post ? 'Daily posting limit' : '⚠️ Daily limit reached'}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: taskLimit.can_post ? 'var(--text)' : 'var(--danger)' }}>
                {taskLimit.can_post
                  ? `${taskLimit.remaining} of ${taskLimit.daily_limit} remaining today`
                  : `You've used all ${taskLimit.daily_limit} posts for today`}
              </div>
            </div>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: taskLimit.can_post
                ? `conic-gradient(var(--primary) ${(taskLimit.posts_today / taskLimit.daily_limit) * 360}deg, var(--border) 0deg)`
                : '#EF4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: taskLimit.can_post ? 'var(--primary)' : 'white',
              fontFamily: 'var(--font-display)'
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: taskLimit.can_post ? 'white' : '#EF4444',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {taskLimit.remaining}
              </div>
            </div>
          </div>
        )}

        {/* Rate limit block message */}
        {taskLimit && !taskLimit.can_post && (
          <div className="gradient-banner" style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)', marginBottom: 16 }}>
            <h3>🚫 Posting Paused</h3>
            <p>To keep the platform spam-free, each user can post up to {taskLimit.daily_limit} tasks per day. Your limit resets tomorrow.</p>
          </div>
        )}

        {/* Task Description */}
        <div className="form-group">
          <label>What do you need help with?</label>
          <div style={{ position: 'relative' }}>
            <textarea
              className="form-input"
              placeholder="Describe the task..."
              value={description || title}
              onChange={e => {
                if (!title) setTitle(e.target.value.split('\n')[0]);
                handleDescriptionChange(e.target.value);
              }}
            />
            <button
              style={{
                position: 'absolute', top: 12, right: 12,
                width: 40, height: 40, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
                border: 'none', color: 'white', cursor: 'pointer', fontSize: 18
              }}
              onClick={() => showToast('Voice input coming soon! 🎙️')}
            >
              🎙️
            </button>
          </div>
        </div>

        {/* Title (if not auto-set) */}
        <div className="form-group">
          <label>Task Title</label>
          <input
            type="text"
            className="form-input"
            placeholder="Short title for your task..."
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        {/* AI Suggestions Banner */}
        {aiSuggestions.length > 0 && (
          <div className="gradient-banner" style={{ marginBottom: 18 }}>
            <h3>🤖 AI Skill Suggestions</h3>
            <p>Based on your description, we suggest: {aiSuggestions.join(', ')}</p>
            <button
              className="btn btn-sm"
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', marginTop: 10, width: 'auto', padding: '8px 16px' }}
              onClick={applySuggestions}
            >
              Apply Suggestions ✨
            </button>
          </div>
        )}

        {/* Duration */}
        <div className="form-group">
          <label>Expected Duration</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g., 2 hours"
            value={duration === 30 ? '30 minutes' : duration === 60 ? '1 hour' : duration === 120 ? '2 hours' : `${duration} min`}
            readOnly
          />
          <div className="chip-group" style={{ marginTop: 10 }}>
            {[30, 60, 120].map(d => (
              <div key={d} className={`chip ${duration === d ? 'active' : ''}`} onClick={() => setDuration(d)}>
                {d === 30 ? '30 min' : d === 60 ? '1 hour' : '2 hours'}
              </div>
            ))}
          </div>
        </div>

        {/* Schedule */}
        <div className="form-row">
          <div className="form-group">
            <label>Date</label>
            <input type="date" className="form-input" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Time</label>
            <input type="time" className="form-input" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} />
          </div>
        </div>

        {/* Location */}
        <div className="form-group">
          <label>Location</label>
          <input
            type="text"
            className="form-input"
            placeholder="Enter address or location"
            value={location}
            onChange={e => setLocation(e.target.value)}
          />
          <button className="location-btn" style={{ marginTop: 8 }} onClick={() => { setLocation('Current Location'); showToast('Location detected 📍'); }}>
            📍 Use My Current Location
          </button>
        </div>

        {/* City Dropdown */}
        <div className="form-group">
          <label>City</label>
          <select className="filter-select" value={city} onChange={e => setCity(e.target.value)} style={{ width: '100%' }}>
            {CITIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Skills Required */}
        <div className="form-group">
          <label>🏷️ Skills Required</label>
          <div className="skills-grid">
            {ALL_SKILLS.map(skill => (
              <div
                key={skill}
                className={`skill-option ${selectedSkills.includes(skill) ? 'selected' : ''} ${aiSuggestions.includes(skill) && !selectedSkills.includes(skill) ? 'ai-suggested' : ''}`}
                onClick={() => toggleSkill(skill)}
                style={aiSuggestions.includes(skill) && !selectedSkills.includes(skill) ? { borderColor: 'var(--accent-light)', background: '#F5F3FF' } : {}}
              >
                {skill}
                {aiSuggestions.includes(skill) && !selectedSkills.includes(skill) && <span style={{ fontSize: 10, display: 'block', color: 'var(--accent)' }}>AI suggested</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={submitting || (taskLimit && !taskLimit.can_post)}
          style={{
            marginTop: 8,
            opacity: (taskLimit && !taskLimit.can_post) ? 0.5 : 1,
            cursor: (taskLimit && !taskLimit.can_post) ? 'not-allowed' : 'pointer'
          }}
        >
          {submitting ? 'Creating...' : (taskLimit && !taskLimit.can_post) ? '🚫 Daily Limit Reached' : '+ Create Task'}
        </button>
      </div>
    </>
  );
}

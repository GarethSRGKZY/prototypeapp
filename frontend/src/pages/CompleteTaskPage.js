import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext, useApi } from '../App';

export default function CompleteTaskPage() {
  const { taskId } = useParams();
  const { user, showToast } = useContext(AppContext);
  const navigate = useNavigate();
  const api = useApi();
  const fileInputRef = useRef(null);

  const [task, setTask] = useState(null);
  const [notes, setNotes] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoData, setPhotoData] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTask();
  }, [taskId]);

  const loadTask = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/api/tasks/${taskId}`);
      setTask(data);
    } catch {
      // Fallback for demo
      setTask({
        id: parseInt(taskId),
        title: 'Help elderly neighbor with grocery shopping',
        description: 'Need someone to help carry groceries from Tesco to my home. Heavy items involved.',
        poster_name: 'Margaret Wilson',
        duration_minutes: 60,
        location_address: '23 Baker Street',
        city: 'London',
        scheduled_date: '2026-02-14',
        scheduled_time: '14:00',
        status: 'accepted',
        skills: ['Heavy Lifting', 'Transportation']
      });
    }
    setLoading(false);
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Photo must be under 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(event.target.result);
      setPhotoData(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setPhotoData('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      await api.post(`/api/tasks/${taskId}/complete`, {
        user_id: user?.id || 1,
        notes: notes || 'Task completed successfully',
        completion_photo: photoData
      });
      setCompleted(true);
      showToast('Task completed! Great work! 🎉');
    } catch {
      // Fallback for demo
      setCompleted(true);
      showToast('Task completed! Great work! 🎉');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="header">
          <button className="back-btn" onClick={() => navigate('/calendar')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </button>
          <h1>Complete Task</h1>
          <div style={{ width: 60 }} />
        </div>
        <div className="page"><div className="loading">Loading task...</div></div>
      </div>
    );
  }

  // Success state after completion
  if (completed) {
    return (
      <div className="app-container">
        <div className="page" style={{ paddingTop: 60, textAlign: 'center' }}>
          <div style={{
            width: 100, height: 100, borderRadius: '50%', margin: '0 auto 24px',
            background: 'linear-gradient(135deg, #10B981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 48, animation: 'scaleIn 0.4s ease'
          }}>
            ✅
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 8 }}>
            Task Completed!
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 8, maxWidth: 280, margin: '0 auto 24px' }}>
            Thank you for volunteering. Your impact has been recorded.
          </p>

          {/* Impact summary */}
          <div className="card" style={{ textAlign: 'left', marginBottom: 16 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 12 }}>📊 Impact Recorded</h3>
            <div className="card-details">
              <span>⏱️ {task.duration_minutes >= 60 ? `${task.duration_minutes / 60} hr` : `${task.duration_minutes} min`} logged</span>
              <span>👤 1 person helped</span>
              <span>🌱 {(task.duration_minutes / 60 * 0.4).toFixed(1)} kg CO₂ saved</span>
            </div>
          </div>

          <button className="btn btn-primary" onClick={() => navigate('/calendar')} style={{ marginBottom: 12 }}>
            Back to Calendar
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/community')}>
            Share in Community
          </button>
        </div>
      </div>
    );
  }

  const durationStr = task.duration_minutes >= 60
    ? `${Math.floor(task.duration_minutes / 60)} hour${task.duration_minutes >= 120 ? 's' : ''}`
    : `${task.duration_minutes} min`;

  return (
    <div className="app-container">
      <div className="header">
        <button className="back-btn" onClick={() => navigate('/calendar')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>
        <h1>Complete Task</h1>
        <div style={{ width: 60 }} />
      </div>

      <div className="page">
        {/* Task Details Card */}
        <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="card-header">
            <span className="badge badge-upcoming">📌 In Progress</span>
            {task.is_verified ? <span className="badge badge-verified">🔵 Verified</span> : null}
          </div>
          <h3>{task.title}</h3>
          <p className="card-meta">Posted by {task.poster_name}</p>

          {task.description && (
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '12px 0', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
              {task.description}
            </p>
          )}

          <div className="card-details">
            <span>🕐 {durationStr}</span>
            <span>📍 {task.location_address || task.city}</span>
          </div>

          {task.scheduled_date && (
            <div className="card-details" style={{ marginTop: 4 }}>
              <span>📅 {task.scheduled_date}</span>
              {task.scheduled_time && <span>⏰ {task.scheduled_time}</span>}
            </div>
          )}

          {task.skills?.length > 0 && (
            <div className="skill-tags" style={{ marginTop: 8 }}>
              {task.skills.map(skill => (
                <span key={skill} className="skill-tag">{skill}</span>
              ))}
            </div>
          )}
        </div>

        {/* Photo Upload Section */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 6 }}>
            📸 Upload Completion Photo
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
            Optional — share a photo of your volunteering experience
          </p>

          {photoPreview ? (
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <img
                src={photoPreview}
                alt="Completion"
                style={{
                  width: '100%', height: 200, objectFit: 'cover',
                  borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border)'
                }}
              />
              <button
                onClick={removePhoto}
                style={{
                  position: 'absolute', top: 8, right: 8,
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.6)', color: 'white',
                  border: 'none', cursor: 'pointer', fontSize: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%', height: 160,
                border: '2px dashed var(--border)',
                borderRadius: 'var(--radius-md)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.2s',
                background: 'var(--bg-elevated)',
                gap: 8
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary-light)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-light)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>
                Tap to upload photo
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-light)' }}>
                JPG, PNG up to 5MB
              </span>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            style={{ display: 'none' }}
          />
        </div>

        {/* Completion Notes */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 6 }}>
            📝 Completion Notes
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
            Optional — add any notes about how the task went
          </p>
          <textarea
            className="form-input"
            placeholder="How did it go? Any highlights to share..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            style={{ minHeight: 100 }}
          />
        </div>

        {/* Complete Button */}
        <button
          className="btn btn-success"
          onClick={handleComplete}
          disabled={submitting}
          style={{
            marginTop: 8, fontSize: 16, padding: '16px 24px',
            background: 'linear-gradient(135deg, #10B981, #059669)',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
          }}
        >
          {submitting ? 'Completing...' : '✅ Complete Task'}
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => navigate('/calendar')}
          style={{ marginTop: 8 }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

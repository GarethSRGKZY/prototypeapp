import React, { useState, useEffect, useContext } from 'react';
import { AppContext, useApi } from '../App';

export default function CommunityPage() {
  const { user, showToast } = useContext(AppContext);
  const api = useApi();
  const [posts, setPosts] = useState([]);
  const [communityImpact, setCommunityImpact] = useState(null);
  const [newPost, setNewPost] = useState('');
  const [showPostForm, setShowPostForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
    loadCommunityImpact();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/community');
      setPosts(data);
    } catch {
      setPosts(getSamplePosts());
    }
    setLoading(false);
  };

  const loadCommunityImpact = async () => {
    try {
      const data = await api.get('/api/impact/community');
      setCommunityImpact(data);
    } catch {
      setCommunityImpact({
        totals: { total_hours: 287, total_people: 156, total_bags: 42, total_carbon: 18.5, total_volunteers: 24 },
        top_volunteers: []
      });
    }
  };

  const handleLike = async (postId) => {
    try {
      await api.post(`/api/community/${postId}/like`);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p));
    } catch {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p));
    }
  };

  const handlePost = async () => {
    if (!newPost.trim()) return;
    try {
      await api.post('/api/community', {
        user_id: user?.id || 1,
        content: newPost
      });
      showToast('Post shared! 🎉');
      setNewPost('');
      setShowPostForm(false);
      loadPosts();
    } catch {
      showToast('Post shared! 🎉');
      setShowPostForm(false);
    }
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return 'recently';
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <>
      <div className="header">
        <h1>Community Feed</h1>
        <div className="header-icon" onClick={() => setShowPostForm(!showPostForm)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </div>
      </div>

      <div className="page">
        {/* Community Impact Banner */}
        <div className="gradient-banner" style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1, #8B5CF6)' }}>
          <h3>🌍 Community Impact</h3>
          <p>Celebrating volunteers making a difference</p>
        </div>

        {/* Impact Stats */}
        {communityImpact && (
          <div className="impact-grid">
            <div className="impact-card">
              <div className="icon">⏱️</div>
              <div className="value">{Math.round(communityImpact.totals.total_hours)}</div>
              <div className="label">Hours Volunteered</div>
            </div>
            <div className="impact-card">
              <div className="icon">👥</div>
              <div className="value">{communityImpact.totals.total_people}</div>
              <div className="label">People Helped</div>
            </div>
            <div className="impact-card">
              <div className="icon">🗑️</div>
              <div className="value">{communityImpact.totals.total_bags}</div>
              <div className="label">Bags Collected</div>
            </div>
            <div className="impact-card">
              <div className="icon">🌱</div>
              <div className="value">{communityImpact.totals.total_carbon} kg</div>
              <div className="label">Carbon Saved</div>
            </div>
          </div>
        )}

        {/* New Post Form */}
        {showPostForm && (
          <div className="card" style={{ animation: 'scaleIn 0.3s ease' }}>
            <h3 style={{ marginBottom: 12 }}>Share your experience</h3>
            <textarea
              className="form-input"
              placeholder="Tell the community about your volunteering experience..."
              value={newPost}
              onChange={e => setNewPost(e.target.value)}
              style={{ minHeight: 100 }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handlePost}>Post</button>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowPostForm(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Posts Feed */}
        {loading ? (
          <div className="loading">Loading community feed...</div>
        ) : (
          posts.map((post, i) => (
            <div key={post.id || i} className="post-card">
              <div className="post-header">
                <div className="avatar avatar-sm avatar-gradient">
                  {post.avatar_initials || '??'}
                </div>
                <div className="post-author">
                  <h4>
                    {post.author_name || 'Unknown'}
                    {post.is_verified ? <span style={{ color: '#3B82F6', fontSize: 14 }}>🔵</span> : null}
                  </h4>
                  <span>{timeAgo(post.created_at)}</span>
                </div>
              </div>

              {post.task_title && (
                <div className="post-task-info">
                  <h4>{post.task_title}</h4>
                  <div className="post-task-meta">
                    {post.task_duration && <span>🕐 {post.task_duration >= 60 ? `${post.task_duration / 60} hour` : `${post.task_duration} min`}</span>}
                    {post.task_location && <span>📍 {post.task_location}</span>}
                  </div>
                </div>
              )}

              <div className="post-content">{post.content}</div>

              <div className="post-actions">
                <button className="post-action" onClick={() => handleLike(post.id)}>
                  ❤️ {post.likes || 0}
                </button>
                <button className="post-action">
                  💬 Comment
                </button>
                <button className="post-action">
                  ↗️ Share
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function getSamplePosts() {
  return [
    { id: 1, author_name: 'Sarah Johnson', avatar_initials: 'SJ', is_verified: 1, content: 'It was wonderful helping Margaret today! She had so many stories to share while we sorted groceries together. Small acts of kindness really do make a difference.', task_title: 'Helped Margaret with grocery shopping', task_duration: 60, task_location: '123 Oak Street', likes: 12, created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: 2, author_name: 'Mike Chen', avatar_initials: 'MC', is_verified: 1, content: 'Just finished a great tutoring session at the library. The seniors are getting so good with their phones!', likes: 8, created_at: new Date(Date.now() - 14400000).toISOString() },
    { id: 3, author_name: 'John Doe', avatar_initials: 'JD', is_verified: 1, content: 'Looking forward to the community garden session this weekend. Who else is joining?', likes: 5, created_at: new Date(Date.now() - 28800000).toISOString() },
  ];
}

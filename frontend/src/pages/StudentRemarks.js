import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { remarksAPI } from '../services/api';
import { toast } from 'react-toastify';

const StudentRemarks = () => {
  const { user } = useAuth();
  const [remarks, setRemarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRemarks: 0,
    recentRemarks: 0,
    classCount: 0
  });
  const [selectedClass, setSelectedClass] = useState('all');
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    loadRemarks();
  }, []);

  const loadRemarks = async () => {
    try {
      setLoading(true);
      const response = await remarksAPI.getMyRemarks({ limit: 100 });
      const remarksData = response.data.remarks;
      setRemarks(remarksData);

      // Calculate statistics
      calculateStats(remarksData);

      // Extract unique classes
      const uniqueClasses = [...new Set(remarksData.map(remark => remark.class_name).filter(Boolean))];
      setClasses(['all', ...uniqueClasses]);

    } catch (error) {
      console.error('Failed to load remarks:', error);
      toast.error('Failed to load teacher remarks');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (remarksData) => {
    const totalRemarks = remarksData.length;
    const recentRemarks = remarksData.filter(remark => {
      const remarkDate = new Date(remark.created_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return remarkDate >= thirtyDaysAgo;
    }).length;
    const classCount = new Set(remarksData.map(remark => remark.class_name).filter(Boolean)).size;

    setStats({
      totalRemarks,
      recentRemarks,
      classCount
    });
  };

  const getFilteredRemarks = () => {
    if (selectedClass === 'all') {
      return remarks;
    }
    return remarks.filter(remark => remark.class_name === selectedClass);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRelativeTime = (dateString) => {
    const now = new Date();
    const remarkDate = new Date(dateString);
    const diffInHours = Math.floor((now - remarkDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInHours < 168) { // 7 days
      const days = Math.floor(diffInHours / 24);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return remarkDate.toLocaleDateString();
    }
  };

  const getRemarkType = (remark) => {
    const content = remark.content.toLowerCase();
    if (content.includes('excellent') || content.includes('great') || content.includes('outstanding') || content.includes('amazing')) {
      return { type: 'positive', icon: '🌟', color: 'text-green-600' };
    } else if (content.includes('good') || content.includes('well done') || content.includes('nice') || content.includes('keep it up')) {
      return { type: 'encouraging', icon: '👍', color: 'text-blue-600' };
    } else if (content.includes('improve') || content.includes('better') || content.includes('work on') || content.includes('focus')) {
      return { type: 'constructive', icon: '💡', color: 'text-yellow-600' };
    } else if (content.includes('concern') || content.includes('worry') || content.includes('issue') || content.includes('problem')) {
      return { type: 'concern', icon: '⚠️', color: 'text-orange-600' };
    } else {
      return { type: 'general', icon: '💬', color: 'text-gray-600' };
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const filteredRemarks = getFilteredRemarks();

  return (
    <div className="main-content">
      <div className="remarks-overview">
        <div className="page-header">
          <h1 className="page-title">💬 Teacher Remarks</h1>
          <p className="page-subtitle">View feedback and remarks from your teachers</p>
        </div>

        {/* Statistics Cards */}
        <div className="remarks-stats">
          <div className="stat-card">
            <div className="stat-icon">💬</div>
            <div className="stat-content">
              <h3>Total Remarks</h3>
              <div className="stat-value">{stats.totalRemarks}</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🕒</div>
            <div className="stat-content">
              <h3>Recent (30 days)</h3>
              <div className="stat-value text-blue-600">{stats.recentRemarks}</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <h3>Classes</h3>
              <div className="stat-value text-purple-600">{stats.classCount}</div>
            </div>
          </div>
        </div>

        {/* Class Filter */}
        {classes.length > 1 && (
          <div className="filter-section">
            <label htmlFor="class-filter" className="filter-label">Filter by Class:</label>
            <select
              id="class-filter"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Classes</option>
              {classes.slice(1).map(className => (
                <option key={className} value={className}>{className}</option>
              ))}
            </select>
          </div>
        )}

        {/* Remarks List */}
        <div className="remarks-section">
          <h2 className="section-title">Teacher Feedback</h2>
          
          {filteredRemarks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💬</div>
              <h3>No remarks yet</h3>
              <p>
                {selectedClass === 'all' 
                  ? "You don't have any teacher remarks yet"
                  : `No remarks found for ${selectedClass}`
                }
              </p>
            </div>
          ) : (
            <div className="remarks-list">
              {filteredRemarks.map(remark => {
                const remarkType = getRemarkType(remark);
                return (
                  <div key={remark.id} className="remark-card">
                    <div className="remark-header">
                      <div className="remark-meta">
                        <div className="remark-teacher">
                          <span className="teacher-icon">👨‍🏫</span>
                          <span className="teacher-name">
                            {remark.teacher_first_name} {remark.teacher_last_name}
                          </span>
                        </div>
                        <div className="remark-class">
                          <span className="class-icon">📚</span>
                          <span className="class-name">{remark.class_name || 'General'}</span>
                        </div>
                      </div>
                      <div className="remark-type">
                        <span className={`remark-type-badge ${remarkType.color}`}>
                          {remarkType.icon} {remarkType.type}
                        </span>
                      </div>
                    </div>
                    
                    <div className="remark-content">
                      <p>{remark.content}</p>
                    </div>
                    
                    <div className="remark-footer">
                      <div className="remark-date">
                        <span className="date-icon">📅</span>
                        <span className="date-text">{formatDate(remark.created_at)}</span>
                      </div>
                      <div className="remark-relative-time">
                        {getRelativeTime(remark.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary */}
        {stats.totalRemarks > 0 && (
          <div className="remarks-summary">
            <h2 className="section-title">Summary</h2>
            <div className="summary-content">
              <div className="summary-text">
                <p>
                  You have received <strong>{stats.totalRemarks}</strong> remark{stats.totalRemarks !== 1 ? 's' : ''} 
                  from your teachers across <strong>{stats.classCount}</strong> class{stats.classCount !== 1 ? 'es' : ''}.
                  {stats.recentRemarks > 0 && (
                    <span> <strong>{stats.recentRemarks}</strong> of these were given in the last 30 days.</span>
                  )}
                </p>
                {stats.totalRemarks > 0 && (
                  <p className="summary-message info">
                    💡 Keep engaging with your teachers and implementing their feedback to improve your learning experience!
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentRemarks;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { attendanceAPI } from '../services/api';
import { toast } from 'react-toastify';
import { Icon } from '../components/Icons';

const StudentAttendance = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    attendancePercentage: 0
  });
  const [selectedClass, setSelectedClass] = useState('all');
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getStudentAttendance({ limit: 100 });
      const attendanceData = response.data.attendance;
      setAttendance(attendanceData);

      // Calculate statistics
      calculateStats(attendanceData);

      // Extract unique classes
      const uniqueClasses = [...new Set(attendanceData.map(record => record.class_name))];
      setClasses(['all', ...uniqueClasses]);

    } catch (error) {
      console.error('Failed to load attendance:', error);
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (attendanceData) => {
    const totalDays = attendanceData.length;
    const presentDays = attendanceData.filter(record => record.status === 'present').length;
    const absentDays = attendanceData.filter(record => record.status === 'absent').length;
    const lateDays = attendanceData.filter(record => record.status === 'late').length;
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    setStats({
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      attendancePercentage
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      present: { class: 'status-present', icon: 'present', text: 'Present' },
      absent: { class: 'status-absent', icon: 'absent', text: 'Absent' },
      late: { class: 'status-late', icon: 'late', text: 'Late' }
    };

    const config = statusConfig[status] || statusConfig.absent;
    
    return (
      <span className={`status-badge ${config.class}`}>
<Icon name={config.icon} size={16} style={{ marginRight: '4px' }} />{config.text}
      </span>
    );
  };

  const getFilteredAttendance = () => {
    if (selectedClass === 'all') {
      return attendance;
    }
    return attendance.filter(record => record.class_name === selectedClass);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAttendancePercentageColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const filteredAttendance = getFilteredAttendance();

  return (
    <div className="main-content">
      <div className="attendance-overview">
        <div className="page-header">
          <h1 className="page-title"><Icon name="attendance" size={24} style={{ marginRight: '8px' }} />My Attendance</h1>
          <p className="page-subtitle">Track your attendance records across all enrolled classes</p>
        </div>

        {/* Statistics Cards */}
        <div className="attendance-stats">
          <div className="stat-card">
            <div className="stat-icon"><Icon name="calendar" size={20} /></div>
            <div className="stat-content">
              <h3>Total Days</h3>
              <div className="stat-value">{stats.totalDays}</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon"><Icon name="present" size={20} /></div>
            <div className="stat-content">
              <h3>Present</h3>
              <div className="stat-value text-green-600">{stats.presentDays}</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon"><Icon name="absent" size={20} /></div>
            <div className="stat-content">
              <h3>Absent</h3>
              <div className="stat-value text-red-600">{stats.absentDays}</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon"><Icon name="late" size={20} /></div>
            <div className="stat-content">
              <h3>Late</h3>
              <div className="stat-value text-yellow-600">{stats.lateDays}</div>
            </div>
          </div>
          
          <div className="stat-card highlight">
            <div className="stat-icon"><Icon name="trending" size={20} /></div>
            <div className="stat-content">
              <h3>Attendance %</h3>
              <div className={`stat-value ${getAttendancePercentageColor(stats.attendancePercentage)}`}>
                {stats.attendancePercentage}%
              </div>
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

        {/* Attendance Records */}
        <div className="attendance-section">
          <h2 className="section-title">Attendance Records</h2>
          
          {filteredAttendance.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Icon name="attendance" size={48} /></div>
              <h3>No attendance records</h3>
              <p>
                {selectedClass === 'all' 
                  ? "You don't have any attendance records yet"
                  : `No attendance records found for ${selectedClass}`
                }
              </p>
            </div>
          ) : (
            <div className="attendance-list">
              {filteredAttendance.map(record => (
                <div key={record.id} className="attendance-card">
                  <div className="attendance-header">
                    <div className="attendance-date">
                      <h3>{formatDate(record.date)}</h3>
                      <span className="class-name"><Icon name="classes" size={16} style={{ marginRight: '4px' }} />{record.class_name}</span>
                    </div>
                    <div className="attendance-status">
                      {getStatusBadge(record.status)}
                    </div>
                  </div>
                  
                  <div className="attendance-details">
                    <div className="detail-item">
                      <span className="detail-label">Marked by:</span>
                      <span className="detail-value">
                        {record.teacher_first_name} {record.teacher_last_name}
                      </span>
                    </div>
                    
                    <div className="detail-item">
                      <span className="detail-label">Date:</span>
                      <span className="detail-value">
                        {new Date(record.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attendance Summary */}
        {stats.totalDays > 0 && (
          <div className="attendance-summary">
            <h2 className="section-title">Attendance Summary</h2>
            <div className="summary-content">
              <div className="summary-text">
                <p>
                  You have attended <strong>{stats.presentDays}</strong> out of <strong>{stats.totalDays}</strong> total days,
                  giving you an attendance rate of <strong className={getAttendancePercentageColor(stats.attendancePercentage)}>
                    {stats.attendancePercentage}%
                  </strong>.
                </p>
                {stats.attendancePercentage >= 90 && (
                  <p className="summary-message success">
                    🎉 Excellent attendance! Keep up the great work!
                  </p>
                )}
                {stats.attendancePercentage >= 75 && stats.attendancePercentage < 90 && (
                  <p className="summary-message warning">
                    <Icon name="trending" size={16} style={{ marginRight: '4px' }} />Good attendance! Try to improve a bit more.
                  </p>
                )}
                {stats.attendancePercentage < 75 && (
                  <p className="summary-message error">
                    <Icon name="warning" size={16} style={{ marginRight: '4px' }} />Your attendance needs improvement. Please try to attend more classes.
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

export default StudentAttendance;

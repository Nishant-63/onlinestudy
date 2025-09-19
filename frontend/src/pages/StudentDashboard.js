import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { classesAPI, assignmentsAPI } from '../services/api';
import { toast } from 'react-toastify';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [stats, setStats] = useState({
    enrolledClasses: 0,
    totalVideos: 0,
    pendingAssignments: 0,
    completedAssignments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load enrolled classes
      const classesResponse = await classesAPI.getStudentClasses({ limit: 5 });
      setClasses(classesResponse.data.classes);

      // Load recent assignments
      const assignmentsResponse = await assignmentsAPI.getMySubmissions({ limit: 5 });
      setRecentAssignments(assignmentsResponse.data.submissions);

      // Calculate stats
      const enrolledClasses = classesResponse.data.pagination.totalCount;
      
      setStats(prev => ({
        ...prev,
        enrolledClasses
      }));

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'status-pending',
      approved: 'status-approved',
      rejected: 'status-rejected'
    };
    
    return (
      <span className={`status-badge ${statusClasses[status] || 'status-pending'}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">
            Welcome, {user.firstName}!
          </h1>
          <p className="dashboard-subtitle">
            Access your classes, assignments, and learning materials
          </p>
        </div>

        {/* Stats Cards */}
        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Enrolled Classes</h3>
            <div className="value">{stats.enrolledClasses}</div>
          </div>
          <div className="stat-card">
            <h3>Total Videos</h3>
            <div className="value">{stats.totalVideos}</div>
          </div>
          <div className="stat-card">
            <h3>Pending Assignments</h3>
            <div className="value">{stats.pendingAssignments}</div>
          </div>
          <div className="stat-card">
            <h3>Completed Assignments</h3>
            <div className="value">{stats.completedAssignments}</div>
          </div>
        </div>

        <div className="dashboard-content">
          {/* My Classes */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">My Classes</h2>
              <Link to="/student/classes" className="btn btn-outline">
                View All
              </Link>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Class Name</th>
                    <th>Teacher</th>
                    <th>Videos</th>
                    <th>Assignments</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map(classItem => (
                    <tr key={classItem.id}>
                      <td>
                        <div>
                          <div className="font-medium">{classItem.name}</div>
                          {classItem.description && (
                            <div className="text-sm text-gray-500">
                              {classItem.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        {classItem.teacher_first_name} {classItem.teacher_last_name}
                      </td>
                      <td>{classItem.video_count || 0}</td>
                      <td>{classItem.assignment_count || 0}</td>
                      <td>
                        <Link
                          to={`/student/classes/${classItem.id}`}
                          className="btn btn-outline"
                        >
                          Enter Class
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Assignment Submissions */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Recent Assignment Submissions</h2>
              <Link to="/student/assignments" className="btn btn-outline">
                View All
              </Link>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Assignment</th>
                    <th>Class</th>
                    <th>Submitted</th>
                    <th>Grade</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAssignments.map(submission => (
                    <tr key={submission.id}>
                      <td>
                        <div className="font-medium">{submission.assignment_title}</div>
                      </td>
                      <td>{submission.class_name}</td>
                      <td>
                        {submission.submitted_at 
                          ? new Date(submission.submitted_at).toLocaleDateString()
                          : 'Not submitted'
                        }
                      </td>
                      <td>
                        {submission.grade !== null ? submission.grade : '-'}
                      </td>
                      <td>
                        {submission.grade !== null ? 'Graded' : 'Pending'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Access */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Quick Access</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/student/classes" className="quick-action-card">
                <div className="quick-action-icon">📚</div>
                <div className="quick-action-title">My Classes</div>
                <div className="quick-action-description">
                  View all your enrolled classes
                </div>
              </Link>
              
              <Link to="/student/assignments" className="quick-action-card">
                <div className="quick-action-icon">📝</div>
                <div className="quick-action-title">Assignments</div>
                <div className="quick-action-description">
                  View and submit assignments
                </div>
              </Link>
              
              <Link to="/student/attendance" className="quick-action-card">
                <div className="quick-action-icon">📊</div>
                <div className="quick-action-title">Attendance</div>
                <div className="quick-action-description">
                  Check your attendance records
                </div>
              </Link>
              
              <Link to="/student/remarks" className="quick-action-card">
                <div className="quick-action-icon">💬</div>
                <div className="quick-action-title">Teacher Remarks</div>
                <div className="quick-action-description">
                  View teacher feedback
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

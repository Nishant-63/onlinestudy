import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { classesAPI, usersAPI } from '../services/api';
import { toast } from 'react-toastify';
import CreateClassModal from '../components/modals/CreateClassModal';
import UploadVideoModal from '../components/modals/UploadVideoModal';
import CreateAssignmentModal from '../components/modals/CreateAssignmentModal';
import MarkAttendanceModal from '../components/modals/MarkAttendanceModal';
import '../components/modals/Modal.css';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    pendingApprovals: 0,
    totalVideos: 0
  });
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [showUploadVideoModal, setShowUploadVideoModal] = useState(false);
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState(false);
  const [showMarkAttendanceModal, setShowMarkAttendanceModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load classes (get all classes for accurate totals)
      const classesResponse = await classesAPI.getTeacherClasses({ limit: 1000 });
      setClasses(classesResponse.data.classes.slice(0, 5)); // Show only first 5 for recent classes

      // Load pending students
      const studentsResponse = await usersAPI.getPending({ limit: 5 });
      setPendingStudents(studentsResponse.data.users);

      // Calculate stats
      const totalClasses = classesResponse.data.pagination.totalCount;
      const pendingApprovals = studentsResponse.data.pagination.totalCount;
      
      // Calculate total students and videos across all classes
      const totalStudents = classesResponse.data.classes.reduce((sum, classItem) => {
        const count = parseInt(classItem.student_count) || 0;
        console.log(`Class ${classItem.name}: ${count} students`);
        return sum + count;
      }, 0);
      
      const totalVideos = classesResponse.data.classes.reduce((sum, classItem) => {
        const count = parseInt(classItem.video_count) || 0;
        console.log(`Class ${classItem.name}: ${count} videos`);
        return sum + count;
      }, 0);
      
      console.log(`Total students: ${totalStudents}, Total videos: ${totalVideos}`);
      
      setStats({
        totalClasses,
        totalStudents,
        pendingApprovals,
        totalVideos
      });

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveStudent = async (studentId) => {
    try {
      await usersAPI.updateStatus(studentId, 'approved');
      setPendingStudents(prev => 
        prev.filter(student => student.id !== studentId)
      );
      setStats(prev => ({
        ...prev,
        pendingApprovals: prev.pendingApprovals - 1,
        totalStudents: prev.totalStudents + 1
      }));
      toast.success('Student approved successfully');
    } catch (error) {
      console.error('Failed to approve student:', error);
      toast.error('Failed to approve student');
    }
  };

  const handleRejectStudent = async (studentId) => {
    try {
      await usersAPI.updateStatus(studentId, 'rejected');
      setPendingStudents(prev => 
        prev.filter(student => student.id !== studentId)
      );
      setStats(prev => ({
        ...prev,
        pendingApprovals: prev.pendingApprovals - 1
      }));
      toast.success('Student rejected');
    } catch (error) {
      console.error('Failed to reject student:', error);
      toast.error('Failed to reject student');
    }
  };

  const handleModalSuccess = () => {
    // Refresh dashboard data when a modal action is successful
    loadDashboardData();
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="dashboard">
        <div className="dashboard-header fade-in">
          <h1 className="dashboard-title">
            Welcome back, {user.firstName}! 👋
          </h1>
          <p className="dashboard-subtitle">
            Manage your classes, students, and content with ease
          </p>
        </div>

        {/* Stats Cards */}
        <div className="dashboard-stats fade-in">
          <div className="stat-card">
            <h3>📚 Total Classes</h3>
            <div className="value">{stats.totalClasses}</div>
          </div>
          <div className="stat-card">
            <h3>👥 Total Students</h3>
            <div className="value">{stats.totalStudents}</div>
          </div>
          <div className="stat-card">
            <h3>⏳ Pending Approvals</h3>
            <div className="value">{stats.pendingApprovals}</div>
          </div>
          <div className="stat-card">
            <h3>🎥 Total Videos</h3>
            <div className="value">{stats.totalVideos}</div>
          </div>
        </div>

        <div className="dashboard-content">
          {/* Pending Student Approvals */}
          {pendingStudents.length > 0 && (
            <div className="card slide-in">
              <div className="card-header">
                <h2 className="card-title">⏳ Pending Student Approvals</h2>
                <Link to="/students" className="btn btn-outline">
                  View All
                </Link>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Registered</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingStudents.map(student => (
                      <tr key={student.id}>
                        <td>{student.first_name} {student.last_name}</td>
                        <td>{student.email}</td>
                        <td>{new Date(student.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              className="btn btn-success"
                              onClick={() => handleApproveStudent(student.id)}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={() => handleRejectStudent(student.id)}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent Classes */}
          <div className="card slide-in">
            <div className="card-header">
              <h2 className="card-title">📚 Recent Classes</h2>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  console.log('Create Class button clicked');
                  setShowCreateClassModal(true);
                }}
              >
                ➕ Create New Class
              </button>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Class Name</th>
                    <th>Students</th>
                    <th>Videos</th>
                    <th>Created</th>
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
                      <td>{classItem.student_count || 0}</td>
                      <td>{classItem.video_count || 0}</td>
                      <td>{new Date(classItem.created_at).toLocaleDateString()}</td>
                      <td>
                        <Link
                          to={`/teacher/classes/${classItem.id}`}
                          className="btn btn-outline"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card slide-in">
            <div className="card-header">
              <h2 className="card-title">⚡ Quick Actions</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button 
                className="quick-action-card"
                onClick={() => setShowCreateClassModal(true)}
              >
                <div className="quick-action-icon">📚</div>
                <div className="quick-action-title">Create Class</div>
                <div className="quick-action-description">
                  Set up a new class for your students
                </div>
              </button>
              
              <button 
                className="quick-action-card"
                onClick={() => setShowUploadVideoModal(true)}
              >
                <div className="quick-action-icon">🎥</div>
                <div className="quick-action-title">Upload Video</div>
                <div className="quick-action-description">
                  Add a new video lecture
                </div>
              </button>
              
              <button 
                className="quick-action-card"
                onClick={() => setShowCreateAssignmentModal(true)}
              >
                <div className="quick-action-icon">📝</div>
                <div className="quick-action-title">Create Assignment</div>
                <div className="quick-action-description">
                  Upload notes or create assignments
                </div>
              </button>
              
              <button 
                className="quick-action-card"
                onClick={() => setShowMarkAttendanceModal(true)}
              >
                <div className="quick-action-icon">📊</div>
                <div className="quick-action-title">Mark Attendance</div>
                <div className="quick-action-description">
                  Record student attendance
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <CreateClassModal
        isOpen={showCreateClassModal}
        onClose={() => setShowCreateClassModal(false)}
        onSuccess={handleModalSuccess}
      />
      
      <UploadVideoModal
        isOpen={showUploadVideoModal}
        onClose={() => setShowUploadVideoModal(false)}
        onSuccess={handleModalSuccess}
      />
      
      <CreateAssignmentModal
        isOpen={showCreateAssignmentModal}
        onClose={() => setShowCreateAssignmentModal(false)}
        onSuccess={handleModalSuccess}
      />
      
      <MarkAttendanceModal
        isOpen={showMarkAttendanceModal}
        onClose={() => setShowMarkAttendanceModal(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default TeacherDashboard;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { classesAPI, videosAPI, assignmentsAPI } from '../services/api';
import { toast } from 'react-toastify';
import { Icon } from '../components/Icons';
import AddStudentModal from '../components/modals/AddStudentModal';
import UploadVideoModal from '../components/modals/UploadVideoModal';
import CreateAssignmentModal from '../components/modals/CreateAssignmentModal';
import '../components/modals/Modal.css';

const ClassDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [classData, setClassData] = useState(null);
  const [videos, setVideos] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('videos');
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showUploadVideoModal, setShowUploadVideoModal] = useState(false);
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState(false);

  useEffect(() => {
    loadClassData();
  }, [id]);

  const loadClassData = async () => {
    try {
      setLoading(true);
      
      // Load class details
      const classResponse = await classesAPI.getClass(id);
      setClassData(classResponse.data.class);

      // Load videos
      const videosResponse = await videosAPI.getClassVideos(id);
      setVideos(videosResponse.data.videos);

      // Load assignments
      const assignmentsResponse = await assignmentsAPI.getClassAssignments(id);
      setAssignments(assignmentsResponse.data.assignments);

      // Load students (only for teachers)
      if (user.role === 'teacher') {
        const studentsResponse = await classesAPI.getStudents(id);
        setStudents(studentsResponse.data.students);
      }

    } catch (error) {
      console.error('Failed to load class data:', error);
      toast.error('Failed to load class data');
    } finally {
      setLoading(false);
    }
  };

  const handleModalSuccess = () => {
    loadClassData();
  };

  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to remove this student from the class?')) {
      return;
    }

    try {
      await classesAPI.removeStudent(id, studentId);
      toast.success('Student removed successfully');
      loadClassData();
    } catch (error) {
      console.error('Failed to remove student:', error);
      toast.error('Failed to remove student');
    }
  };

  const handleVideoClick = (videoId) => {
    navigate(`/video/${videoId}`);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="container">
        <div className="alert alert-error">
          Class not found or access denied
        </div>
      </div>
    );
  }

  return (
    <div className="class-details">
      <div className="container">
        {/* Class Header */}
        <div className="class-header">
          <h1 className="class-title">{classData.name}</h1>
          <p className="class-description">{classData.description}</p>
          <div className="class-meta">
            <span>Teacher: {classData.teacher_first_name} {classData.teacher_last_name}</span>
          </div>
        </div>

        {/* Quick Actions for Teachers */}
        {user.role === 'teacher' && (
          <div className="quick-actions">
            <button
              className="btn btn-primary"
              onClick={() => setShowUploadVideoModal(true)}
            >
<Icon name="video" size={16} style={{ marginRight: '6px' }} />Upload Video
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateAssignmentModal(true)}
            >
<Icon name="createAssignment" size={16} style={{ marginRight: '6px' }} />Add Assignment
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'videos' ? 'active' : ''}`}
            onClick={() => setActiveTab('videos')}
          >
            Videos ({videos.length})
          </button>
          {user.role === 'teacher' && (
            <button
              className={`tab ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
            >
              Students ({students.length})
            </button>
          )}
          <button
            className={`tab ${activeTab === 'assignments' ? 'active' : ''}`}
            onClick={() => setActiveTab('assignments')}
          >
            Assignments ({assignments.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'videos' && (
            <div className="videos-section">
              {videos.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><Icon name="videos" size={48} /></div>
                  <h3>No videos yet</h3>
                  <p>Upload your first video to get started</p>
                  {user.role === 'teacher' && (
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowUploadVideoModal(true)}
                    >
                      Upload Video
                    </button>
                  )}
                </div>
              ) : (
                <div className="videos-grid">
                  {videos.map(video => (
                    <div key={video.id} className="video-card" onClick={() => handleVideoClick(video.id)}>
                      <div className="video-thumbnail">
                        {video.thumbnail_key ? (
                          <img src={video.thumbnailUrl} alt={video.title} />
                        ) : (
                          <div className="video-placeholder">
                            <Icon name="video" size={16} />
                          </div>
                        )}
                        <div className="video-duration">
                          {video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` : '--:--'}
                        </div>
                      </div>
                      <div className="video-info">
                        <h3 className="video-title">{video.title}</h3>
                        <p className="video-description">{video.description}</p>
                        <div className="video-meta">
                          <span>By {video.teacher_first_name} {video.teacher_last_name}</span>
                          <span>{new Date(video.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'students' && user.role === 'teacher' && (
            <div className="students-section">
              <div className="section-header">
                <h3>Class Students</h3>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowAddStudentModal(true)}
                >
                  ➕ Add Student
                </button>
              </div>
              
              {students.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><Icon name="students" size={48} /></div>
                  <h3>No students enrolled</h3>
                  <p>Add students to this class to get started</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowAddStudentModal(true)}
                  >
                    Add Student
                  </button>
                </div>
              ) : (
                <div className="students-list">
                  {students.map(student => (
                    <div key={student.id} className="student-card">
                      <div className="student-info">
                        <div className="student-avatar">
                          {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                        </div>
                        <div className="student-details">
                          <h4 className="student-name">
                            {student.first_name} {student.last_name}
                          </h4>
                          <p className="student-email">{student.email}</p>
                          <p className="student-enrolled">
                            Enrolled: {new Date(student.enrolled_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="student-actions">
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRemoveStudent(student.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="assignments-section">
              {assignments.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><Icon name="assignments" size={48} /></div>
                  <h3>No assignments yet</h3>
                  <p>Create your first assignment to get started</p>
                  {user.role === 'teacher' && (
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowCreateAssignmentModal(true)}
                    >
                      Add Assignment
                    </button>
                  )}
                </div>
              ) : (
                <div className="assignments-list">
                  {assignments.map(assignment => (
                    <div key={assignment.id} className="assignment-card">
                      <div className="assignment-header">
                        <h3 className="assignment-title">{assignment.title}</h3>
                        <div className="assignment-meta">
                          <span>Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No due date'}</span>
                        </div>
                      </div>
                      <p className="assignment-description">{assignment.description}</p>
                      <div className="assignment-actions">
                        {assignment.downloadUrl ? (
                          <button
                            onClick={() => {
                              // Open assignment in a new tab for viewing
                              window.open(assignment.downloadUrl, '_blank');
                            }}
                            className="btn btn-outline"
                          >
                            View Assignment
                          </button>
                        ) : (
                          <button className="btn btn-outline" disabled>
                            No File
                          </button>
                        )}
                        {user.role === 'student' && (
                          <button className="btn btn-primary">
                            Submit Assignment
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddStudentModal
        isOpen={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        onSuccess={handleModalSuccess}
        classId={id}
      />
      
      <UploadVideoModal
        isOpen={showUploadVideoModal}
        onClose={() => setShowUploadVideoModal(false)}
        onSuccess={handleModalSuccess}
        classId={id}
      />
      
      <CreateAssignmentModal
        isOpen={showCreateAssignmentModal}
        onClose={() => setShowCreateAssignmentModal(false)}
        onSuccess={handleModalSuccess}
        classId={id}
      />
    </div>
  );
};

export default ClassDetails;

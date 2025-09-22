import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { classesAPI } from '../services/api';
import { toast } from 'react-toastify';
import { Icon } from '../components/Icons';
import CreateClassModal from '../components/modals/CreateClassModal';
import '../components/modals/Modal.css';

const ClassesOverview = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const response = user.role === 'teacher' 
        ? await classesAPI.getTeacherClasses({ limit: 50 })
        : await classesAPI.getStudentClasses({ limit: 50 });
      setClasses(response.data.classes);
    } catch (error) {
      console.error('Failed to load classes:', error);
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleModalSuccess = () => {
    loadClasses();
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
      <div className="classes-overview">
        <div className="page-header">
          <h1 className="page-title"><Icon name="classes" size={24} style={{ marginRight: '8px' }} />{user.role === 'teacher' ? 'My Classes' : 'My Classes'}</h1>
          <p className="page-subtitle">
            {user.role === 'teacher' 
              ? 'Manage your classes and view detailed information' 
              : 'View your enrolled classes and access learning materials'
            }
          </p>
          {user.role === 'teacher' && (
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateClassModal(true)}
            >
              ➕ Create New Class
            </button>
          )}
        </div>

        <div className="classes-grid">
          {classes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Icon name="classes" size={48} /></div>
              <h3>{user.role === 'teacher' ? 'No classes yet' : 'No enrolled classes'}</h3>
              <p>
                {user.role === 'teacher' 
                  ? 'Create your first class to get started' 
                  : 'You are not enrolled in any classes yet'
                }
              </p>
              {user.role === 'teacher' && (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowCreateClassModal(true)}
                >
                  Create Class
                </button>
              )}
            </div>
          ) : (
            classes.map(classItem => (
              <div key={classItem.id} className="class-card">
                <div className="class-card-header">
                  <h3 className="class-name">{classItem.name}</h3>
                  <div className="class-stats">
                    {user.role === 'teacher' ? (
                      <>
                        <span className="stat">
                          <Icon name="students" size={16} style={{ marginRight: '4px' }} />{classItem.student_count || 0} students
                        </span>
                        <span className="stat">
                          <Icon name="videos" size={16} style={{ marginRight: '4px' }} />{classItem.video_count || 0} videos
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="stat">
                          👨‍🏫 {classItem.teacher_first_name} {classItem.teacher_last_name}
                        </span>
                        <span className="stat">
                          <Icon name="videos" size={16} style={{ marginRight: '4px' }} />{classItem.video_count || 0} videos
                        </span>
                        <span className="stat">
                          <Icon name="assignments" size={16} style={{ marginRight: '4px' }} />{classItem.assignment_count || 0} assignments
                        </span>
                      </>
                    )}
                  </div>
                </div>
                
                {classItem.description && (
                  <p className="class-description">{classItem.description}</p>
                )}
                
                <div className="class-meta">
                  <span>Created: {new Date(classItem.created_at).toLocaleDateString()}</span>
                </div>
                
                <div className="class-actions">
                  <Link
                    to={user.role === 'teacher' 
                      ? `/teacher/classes/${classItem.id}`
                      : `/student/classes/${classItem.id}`
                    }
                    className="btn btn-primary"
                  >
                    {user.role === 'teacher' ? 'View Details' : 'Enter Class'}
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Class Modal */}
      <CreateClassModal
        isOpen={showCreateClassModal}
        onClose={() => setShowCreateClassModal(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default ClassesOverview;

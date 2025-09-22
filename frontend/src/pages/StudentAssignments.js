import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { assignmentsAPI } from '../services/api';
import { toast } from 'react-toastify';
import { Icon } from '../components/Icons';

const StudentAssignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState({});
  const [selectedFile, setSelectedFile] = useState({});

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const response = await assignmentsAPI.getStudentAssignments({ limit: 50 });
      setAssignments(response.data.assignments);
    } catch (error) {
      console.error('Failed to load assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (assignmentId, event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file type
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        return;
      }
      
      // Check file size (500MB = 500 * 1024 * 1024 bytes)
      const maxSize = 500 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('File size must be less than 500MB');
        return;
      }

      setSelectedFile(prev => ({
        ...prev,
        [assignmentId]: file
      }));
    }
  };

  const handleSubmitAssignment = async (assignmentId) => {
    const file = selectedFile[assignmentId];
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      setUploading(prev => ({ ...prev, [assignmentId]: true }));

      // Get upload URL
      const response = await assignmentsAPI.submit(assignmentId, {
        fileSize: file.size
      });

      const { uploadUrl } = response.data;

      // Upload file to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': 'application/pdf',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      // Complete submission
      await assignmentsAPI.completeSubmission(assignmentId, {
        fileSize: file.size
      });

      toast.success('Assignment submitted successfully!');
      
      // Clear selected file
      setSelectedFile(prev => {
        const newState = { ...prev };
        delete newState[assignmentId];
        return newState;
      });

      // Reload assignments
      loadAssignments();

    } catch (error) {
      console.error('Failed to submit assignment:', error);
      toast.error('Failed to submit assignment');
    } finally {
      setUploading(prev => ({ ...prev, [assignmentId]: false }));
    }
  };

  const getStatusBadge = (assignment) => {
    if (assignment.submission_id) {
      if (assignment.grade !== null) {
        return <span className="status-badge status-graded">Graded ({assignment.grade})</span>;
      }
      return <span className="status-badge status-submitted">Submitted</span>;
    }
    
    if (assignment.due_date) {
      const dueDate = new Date(assignment.due_date);
      const now = new Date();
      if (now > dueDate) {
        return <span className="status-badge status-overdue">Overdue</span>;
      }
    }
    
    return <span className="status-badge status-pending">Pending</span>;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
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
      <div className="assignments-overview">
        <div className="page-header">
          <h1 className="page-title"><Icon name="assignments" size={24} style={{ marginRight: '8px' }} />My Assignments</h1>
          <p className="page-subtitle">View and submit your assignments from all enrolled classes</p>
        </div>

        <div className="assignments-list">
          {assignments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Icon name="assignments" size={48} /></div>
              <h3>No assignments yet</h3>
              <p>You don't have any assignments from your enrolled classes</p>
            </div>
          ) : (
            assignments.map(assignment => (
              <div key={assignment.id} className="assignment-card">
                <div className="assignment-header">
                  <div className="assignment-title-section">
                    <h3 className="assignment-title">{assignment.title}</h3>
                    <div className="assignment-meta">
                      <span className="class-name"><Icon name="classes" size={16} style={{ marginRight: '4px' }} />{assignment.class_name}</span>
                      <span className="teacher-name">
                        👨‍🏫 {assignment.teacher_first_name} {assignment.teacher_last_name}
                      </span>
                      {assignment.due_date && (
                        <span className="due-date">
                          <Icon name="calendar" size={16} style={{ marginRight: '4px' }} />Due: {new Date(assignment.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="assignment-status">
                    {getStatusBadge(assignment)}
                  </div>
                </div>

                {assignment.description && (
                  <div className="assignment-description">
                    <p>{assignment.description}</p>
                  </div>
                )}

                <div className="assignment-details">
                  <div className="detail-item">
                    <span className="detail-label">Assignment File:</span>
                    <span className="detail-value">
                      📄 {assignment.title}.pdf ({formatFileSize(assignment.file_size)})
                    </span>
                  </div>
                  
                  {assignment.submission_id && (
                    <div className="detail-item">
                      <span className="detail-label">Your Submission:</span>
                      <span className="detail-value">
                        <Icon name="attach" size={16} style={{ marginRight: '4px' }} />{assignment.title}_submission.pdf ({formatFileSize(assignment.submission_file_size)})
                      </span>
                    </div>
                  )}

                  {assignment.submitted_at && (
                    <div className="detail-item">
                      <span className="detail-label">Submitted:</span>
                      <span className="detail-value">
                        {new Date(assignment.submitted_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="assignment-actions">
                  <Link
                    to={`/assignment/${assignment.id}`}
                    className="btn btn-outline"
                  >
                    View Details
                  </Link>
                  
                  {!assignment.submission_id && (
                    <div className="submission-section">
                      <div className="file-upload-area">
                        <input
                          type="file"
                          id={`file-${assignment.id}`}
                          accept=".pdf"
                          onChange={(e) => handleFileSelect(assignment.id, e)}
                          className="file-input"
                        />
                        <label htmlFor={`file-${assignment.id}`} className="file-upload-label">
                          {selectedFile[assignment.id] ? (
                            <span className="file-selected">
                              <Icon name="attach" size={16} style={{ marginRight: '4px' }} />{selectedFile[assignment.id].name} ({formatFileSize(selectedFile[assignment.id].size)})
                            </span>
                          ) : (
                            <span className="file-upload-text">
                              <Icon name="attach" size={16} style={{ marginRight: '4px' }} />Choose PDF file (max 500MB)
                            </span>
                          )}
                        </label>
                      </div>
                      
                      <button
                        onClick={() => handleSubmitAssignment(assignment.id)}
                        disabled={!selectedFile[assignment.id] || uploading[assignment.id]}
                        className="btn btn-primary"
                      >
                        {uploading[assignment.id] ? 'Uploading...' : 'Submit Assignment'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentAssignments;

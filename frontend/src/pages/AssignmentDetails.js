import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { assignmentsAPI } from '../services/api';
import { toast } from 'react-toastify';
import { Icon } from '../components/Icons';

const AssignmentDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssignment();
  }, [id]);

  const loadAssignment = async () => {
    try {
      setLoading(true);
      const response = await assignmentsAPI.getAssignment(id);
      setAssignment(response.data.assignment);

      if (user.role === 'teacher') {
        const submissionsResponse = await assignmentsAPI.getSubmissions(id);
        setSubmissions(submissionsResponse.data.submissions);
      }
    } catch (error) {
      console.error('Failed to load assignment:', error);
      toast.error('Failed to load assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (assignment?.downloadUrl) {
      console.log('Downloading assignment:', assignment.downloadUrl);
      // Create a temporary link element to trigger download without opening new tab
      const link = document.createElement('a');
      link.href = assignment.downloadUrl;
      link.download = `${assignment.title}.pdf`;
      link.target = '_self';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.error('No download URL available for assignment:', assignment);
      toast.error('Download URL not available');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="container">
        <div className="alert alert-error">
          Assignment not found or access denied
        </div>
      </div>
    );
  }

  return (
    <div className="assignment-details">
      <div className="container">
        <div className="assignment-header">
          <h1 className="assignment-title">{assignment.title}</h1>
          <div className="assignment-meta">
            <span>Class: {assignment.class_name}</span>
            <span>Teacher: {assignment.teacher_first_name} {assignment.teacher_last_name}</span>
            {assignment.due_date && (
              <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        <div className="assignment-content">
          <div className="assignment-description">
            <h2>Description</h2>
            <p>{assignment.description}</p>
          </div>

          {assignment.file_key && (
            <div className="assignment-file">
              <h2>Assignment File</h2>
              <div className="file-info">
                <span>📄 {assignment.title}.pdf</span>
                <span>{(assignment.file_size / (1024 * 1024)).toFixed(1)} MB</span>
              </div>
              {assignment.downloadUrl ? (
                <button onClick={handleDownload} className="btn btn-primary">
                  Download Assignment
                </button>
              ) : (
                <button className="btn btn-primary" disabled>
                  File Not Available
                </button>
              )}
            </div>
          )}

          {user.role === 'student' && (
            <div className="assignment-submission">
              <h2>Submit Your Work</h2>
              <div className="submission-area">
                <div className="file-upload">
                  <div className="file-upload-icon"><Icon name="attach" size={20} /></div>
                  <div className="file-upload-text">
                    Drag and drop your PDF here, or click to browse
                  </div>
                  <div className="file-upload-hint">
                    Maximum file size: 500MB
                  </div>
                </div>
                <button className="btn btn-primary">
                  Upload Submission
                </button>
              </div>
            </div>
          )}

          {user.role === 'teacher' && submissions.length > 0 && (
            <div className="assignment-submissions">
              <h2>Student Submissions ({submissions.length})</h2>
              <div className="submissions-table">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Submitted</th>
                      <th>File Size</th>
                      <th>Grade</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map(submission => (
                      <tr key={submission.id}>
                        <td>
                          {submission.first_name} {submission.last_name}
                          <br />
                          <small>{submission.email}</small>
                        </td>
                        <td>
                          {submission.submitted_at 
                            ? new Date(submission.submitted_at).toLocaleDateString()
                            : 'Not submitted'
                          }
                        </td>
                        <td>
                          {submission.file_size 
                            ? `${(submission.file_size / (1024 * 1024)).toFixed(1)} MB`
                            : '-'
                          }
                        </td>
                        <td>
                          {submission.grade !== null ? submission.grade : '-'}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button className="btn btn-outline">
                              Download
                            </button>
                            <button className="btn btn-primary">
                              Grade
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
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetails;

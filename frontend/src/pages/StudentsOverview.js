import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI, assignmentsAPI } from '../services/api';
import './StudentsOverview.css';

const StudentsOverview = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentAssignments, setStudentAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getStudents();
      setStudents(response.data.students);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentAssignments = async (studentId) => {
    try {
      setAssignmentsLoading(true);
      const response = await assignmentsAPI.getStudentSubmissions(studentId);
      setStudentAssignments(response.data.submissions);
    } catch (error) {
      console.error('Error fetching student assignments:', error);
      setError('Failed to fetch student assignments');
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    fetchStudentAssignments(student.id);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'approved': 'status-approved',
      'pending': 'status-pending',
      'rejected': 'status-rejected'
    };
    return (
      <span className={`status-badge ${statusClasses[status] || 'status-pending'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getSubmissionStatus = (submission) => {
    if (!submission) return 'Not submitted';
    if (submission.status === 'submitted') return 'Submitted';
    if (submission.status === 'graded') return 'Graded';
    return 'Pending';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading students...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={fetchStudents} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="students-overview">
      <div className="page-header">
        <h1>Students Overview</h1>
        <p>View all students and their assignment submissions</p>
      </div>

      <div className="students-layout">
        {/* Students List */}
        <div className="students-list">
          <div className="section-header">
            <h2>All Students ({students.length})</h2>
          </div>
          
          {students.length === 0 ? (
            <div className="empty-state">
              <p>No students found</p>
            </div>
          ) : (
            <div className="students-grid">
              {students.map((student) => (
                <div
                  key={student.id}
                  className={`student-card ${selectedStudent?.id === student.id ? 'selected' : ''}`}
                  onClick={() => handleStudentClick(student)}
                >
                  <div className="student-avatar">
                    {student.first_name?.charAt(0) || ''}{student.last_name?.charAt(0) || ''}
                  </div>
                  <div className="student-info">
                    <h3>{student.first_name} {student.last_name}</h3>
                    <p className="student-email">{student.email}</p>
                    <div className="student-meta">
                      {getStatusBadge(student.status)}
                      <span className="join-date">
                        Joined: {formatDate(student.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Student Details & Assignments */}
        <div className="student-details">
          {selectedStudent ? (
            <div className="student-detail-content">
              <div className="student-header">
                <div className="student-avatar large">
                  {selectedStudent.first_name?.charAt(0) || ''}{selectedStudent.last_name?.charAt(0) || ''}
                </div>
                <div className="student-info">
                  <h2>{selectedStudent.first_name} {selectedStudent.last_name}</h2>
                  <p className="student-email">{selectedStudent.email}</p>
                  <div className="student-meta">
                    {getStatusBadge(selectedStudent.status)}
                    <span className="join-date">
                      Joined: {formatDate(selectedStudent.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="assignments-section">
                <h3>Assignment Submissions</h3>
                {assignmentsLoading ? (
                  <div className="loading-assignments">
                    <div className="spinner small"></div>
                    <p>Loading assignments...</p>
                  </div>
                ) : studentAssignments.length === 0 ? (
                  <div className="empty-assignments">
                    <p>No assignment submissions found</p>
                  </div>
                ) : (
                  <div className="assignments-list">
                    {studentAssignments.map((submission) => (
                      <div key={submission.id} className="assignment-item">
                        <div className="assignment-header">
                          <h4>{submission.assignment_title}</h4>
                          <span className={`submission-status ${submission.status}`}>
                            {getSubmissionStatus(submission)}
                          </span>
                        </div>
                        <div className="assignment-meta">
                          <p className="class-name">Class: {submission.class_name}</p>
                          <p className="due-date">
                            Due: {submission.due_date ? formatDate(submission.due_date) : 'No due date'}
                          </p>
                          <p className="submitted-date">
                            Submitted: {submission.submitted_at ? formatDate(submission.submitted_at) : 'Not submitted'}
                          </p>
                        </div>
                        {submission.feedback && (
                          <div className="assignment-feedback">
                            <strong>Feedback:</strong> {submission.feedback}
                          </div>
                        )}
                        {submission.grade && (
                          <div className="assignment-grade">
                            <strong>Grade:</strong> {submission.grade}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="no-student-selected">
              <div className="empty-state">
                <h3>Select a Student</h3>
                <p>Click on a student from the list to view their details and assignments</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentsOverview;

import React, { useState, useEffect } from 'react';
import { usersAPI, classesAPI } from '../../services/api';
import { toast } from 'react-toastify';
import './Modal.css';

const AddStudentModal = ({ isOpen, onClose, onSuccess, classId }) => {
  const [students, setStudents] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadStudents();
      loadEnrolledStudents();
    }
  }, [isOpen, classId]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getStudents({ limit: 100 });
      setStudents(response.data.students);
    } catch (error) {
      console.error('Failed to load students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const loadEnrolledStudents = async () => {
    try {
      const response = await classesAPI.getStudents(classId);
      setEnrolledStudents(response.data.students);
    } catch (error) {
      console.error('Failed to load enrolled students:', error);
    }
  };

  const filteredStudents = students.filter(student => {
    const isNotEnrolled = !enrolledStudents.some(enrolled => enrolled.id === student.id);
    const matchesSearch = student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    return isNotEnrolled && matchesSearch;
  });

  const handleStudentSelect = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleEnrollStudents = async () => {
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    try {
      setLoading(true);
      
      // Enroll each selected student
      for (const studentId of selectedStudents) {
        await classesAPI.enrollStudent(classId, studentId);
      }

      toast.success(`${selectedStudents.length} student(s) enrolled successfully`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to enroll students:', error);
      toast.error('Failed to enroll students');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Add Students to Class</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Search Students</label>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="students-list">
            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="empty-state">
                <p>No available students found</p>
              </div>
            ) : (
              filteredStudents.map(student => (
                <div
                  key={student.id}
                  className={`student-item ${selectedStudents.includes(student.id) ? 'selected' : ''}`}
                  onClick={() => handleStudentSelect(student.id)}
                >
                  <div className="student-info">
                    <div className="student-name">
                      {student.first_name} {student.last_name}
                    </div>
                    <div className="student-email">{student.email}</div>
                  </div>
                  <div className="student-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => handleStudentSelect(student.id)}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {selectedStudents.length > 0 && (
            <div className="selected-count">
              {selectedStudents.length} student(s) selected
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleEnrollStudents}
            disabled={loading || selectedStudents.length === 0}
          >
            {loading ? 'Enrolling...' : `Enroll ${selectedStudents.length} Student(s)`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddStudentModal;

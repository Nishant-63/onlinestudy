import React, { useState, useEffect } from 'react';
import { classesAPI, attendanceAPI } from '../../services/api';
import { toast } from 'react-toastify';

const MarkAttendanceModal = ({ isOpen, onClose, onSuccess }) => {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    classId: '',
    date: new Date().toISOString().split('T')[0],
    attendance: {}
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadClasses();
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.classId) {
      loadStudents(formData.classId);
    }
  }, [formData.classId]);

  const loadClasses = async () => {
    try {
      const response = await classesAPI.getTeacherClasses({ limit: 100 });
      setClasses(response.data.classes);
    } catch (error) {
      console.error('Failed to load classes:', error);
      toast.error('Failed to load classes');
    }
  };

  const loadStudents = async (classId) => {
    try {
      const response = await classesAPI.getStudents(classId);
      setStudents(response.data.students);
      
      // Initialize attendance for all students
      const initialAttendance = {};
      response.data.students.forEach(student => {
        initialAttendance[student.id] = 'present';
      });
      setFormData(prev => ({
        ...prev,
        attendance: initialAttendance
      }));
    } catch (error) {
      console.error('Failed to load students:', error);
      toast.error('Failed to load students');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.classId) {
      toast.error('Please select a class');
      return;
    }

    try {
      setLoading(true);
      
      // Convert attendance object to array format expected by backend
      const attendanceArray = Object.entries(formData.attendance).map(([studentId, status]) => ({
        studentId,
        status
      }));
      
      // Send single request with all attendance data
      await attendanceAPI.mark({
        classId: formData.classId,
        date: formData.date,
        attendance: attendanceArray
      });
      
      toast.success('Attendance marked successfully!');
      onSuccess();
      onClose();
      setFormData({ classId: '', date: new Date().toISOString().split('T')[0], attendance: {} });
    } catch (error) {
      console.error('Failed to mark attendance:', error);
      toast.error('Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    if (e.target.name === 'classId') {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
        attendance: {}
      });
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setFormData(prev => ({
      ...prev,
      attendance: {
        ...prev.attendance,
        [studentId]: status
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal modal-large">
        <div className="modal-header">
          <h2>Mark Attendance</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="classId">Select Class *</label>
            <select
              id="classId"
              name="classId"
              value={formData.classId}
              onChange={handleChange}
              required
            >
              <option value="">Choose a class...</option>
              {classes.map(classItem => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="date">Date *</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>
          
          {students.length > 0 && (
            <div className="form-group">
              <label>Student Attendance</label>
              <div className="attendance-list">
                {students.map(student => (
                  <div key={student.id} className="attendance-item">
                    <span className="student-name">
                      {student.first_name} {student.last_name}
                    </span>
                    <div className="attendance-options">
                      <label className="attendance-option">
                        <input
                          type="radio"
                          name={`attendance_${student.id}`}
                          value="present"
                          checked={formData.attendance[student.id] === 'present'}
                          onChange={() => handleAttendanceChange(student.id, 'present')}
                        />
                        <span className="status-present">Present</span>
                      </label>
                      <label className="attendance-option">
                        <input
                          type="radio"
                          name={`attendance_${student.id}`}
                          value="absent"
                          checked={formData.attendance[student.id] === 'absent'}
                          onChange={() => handleAttendanceChange(student.id, 'absent')}
                        />
                        <span className="status-absent">Absent</span>
                      </label>
                      <label className="attendance-option">
                        <input
                          type="radio"
                          name={`attendance_${student.id}`}
                          value="late"
                          checked={formData.attendance[student.id] === 'late'}
                          onChange={() => handleAttendanceChange(student.id, 'late')}
                        />
                        <span className="status-late">Late</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || students.length === 0}>
              {loading ? 'Marking...' : 'Mark Attendance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MarkAttendanceModal;

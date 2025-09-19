import React, { useState, useEffect } from 'react';
import { classesAPI, assignmentsAPI } from '../../services/api';
import { toast } from 'react-toastify';

const CreateAssignmentModal = ({ isOpen, onClose, onSuccess }) => {
  const [classes, setClasses] = useState([]);
  const [formData, setFormData] = useState({
    classId: '',
    title: '',
    description: '',
    dueDate: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadClasses();
    }
  }, [isOpen]);

  const loadClasses = async () => {
    try {
      const response = await classesAPI.getTeacherClasses({ limit: 100 });
      setClasses(response.data.classes);
    } catch (error) {
      console.error('Failed to load classes:', error);
      toast.error('Failed to load classes');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.classId || !formData.title.trim()) {
      toast.error('Class and title are required');
      return;
    }

    try {
      setLoading(true);
      
      // Create assignment
      const response = await assignmentsAPI.upload({
        classId: formData.classId,
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate && formData.dueDate.trim() !== '' ? formData.dueDate : null
      });
      
      toast.success('Assignment created successfully!');
      onSuccess();
      onClose();
      setFormData({ classId: '', title: '', description: '', dueDate: '' });
    } catch (error) {
      console.error('Failed to create assignment:', error);
      toast.error('Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Create Assignment</h2>
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
            <label htmlFor="title">Assignment Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Algebra Homework 1"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Assignment instructions and requirements"
              rows="3"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="dueDate">Due Date</label>
            <input
              type="datetime-local"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="assignmentFile">Assignment File</label>
            <input
              type="file"
              id="assignmentFile"
              name="assignmentFile"
              accept=".pdf,.doc,.docx"
              disabled
            />
            <small className="text-gray-500">
              File upload will be implemented in the next phase
            </small>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAssignmentModal;

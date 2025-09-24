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
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        return;
      }
      
      // Check file size (50MB = 50 * 1024 * 1024 bytes)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('File size must be less than 50MB');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const uploadFileToS3 = async (uploadUrl, file) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(percentComplete);
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          resolve();
        } else {
          reject(new Error('Upload failed'));
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });
      
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', 'application/pdf');
      xhr.send(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.classId || !formData.title.trim()) {
      toast.error('Class and title are required');
      return;
    }

    try {
      setLoading(true);
      setUploadProgress(0);
      
      // Create assignment and get upload URL
      const response = await assignmentsAPI.upload({
        classId: formData.classId,
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate && formData.dueDate.trim() !== '' ? formData.dueDate : null
      });
      
      // If file is selected, upload it
      if (selectedFile) {
        await uploadFileToS3(response.data.uploadUrl, selectedFile);
        
        // Complete the upload
        await assignmentsAPI.completeUpload(response.data.assignmentId, {
          fileSize: selectedFile.size,
          fileName: selectedFile.name
        });
      }
      
      toast.success('Assignment created successfully!');
      onSuccess();
      onClose();
      setFormData({ classId: '', title: '', description: '', dueDate: '' });
      setSelectedFile(null);
      setUploadProgress(0);
    } catch (error) {
      console.error('Failed to create assignment:', error);
      toast.error('Failed to create assignment');
    } finally {
      setLoading(false);
      setUploadProgress(0);
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
            <label htmlFor="assignmentFile">Assignment File (PDF, up to 50MB)</label>
            <input
              type="file"
              id="assignmentFile"
              name="assignmentFile"
              accept=".pdf"
              onChange={handleFileChange}
            />
            {selectedFile && (
              <div className="file-info">
                <small className="text-green-600">
                  ✓ Selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                </small>
              </div>
            )}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <small className="text-blue-600">
                  Uploading... {uploadProgress.toFixed(1)}%
                </small>
              </div>
            )}
            <small className="text-gray-500">
              Optional: Upload a PDF file (maximum 50MB)
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

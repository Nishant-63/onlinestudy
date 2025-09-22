import React, { useState, useEffect } from 'react';
import { classesAPI, videosAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { Icon } from '../Icons';

const UploadVideoModal = ({ isOpen, onClose, onSuccess }) => {
  const [classes, setClasses] = useState([]);
  const [formData, setFormData] = useState({
    classId: '',
    title: '',
    description: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, completed, error
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

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('video/')) {
        toast.error('Please select a valid video file');
        return;
      }
      
      // Check file size (10GB = 10 * 1024 * 1024 * 1024 bytes)
      const maxSize = 10 * 1024 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('File size must be less than 10GB');
        return;
      }

      setSelectedFile(file);
      setUploadStatus('idle');
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const uploadVideoDirectly = async (file, videoId) => {
    console.log('🎥 Starting video upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      videoId: videoId
    });

    const formData = new FormData();
    formData.append('video', file);
    formData.append('fileKey', `videos/${videoId}/${file.name}`);

    console.log('📤 Sending upload request to /api/videos/upload-file');

    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/videos/upload-file`, {
      method: 'POST',
      body: formData,
    });

    console.log('📥 Upload response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Upload failed:', errorText);
      throw new Error(`Failed to upload video file: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Upload successful:', result);
    return result;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.classId || !formData.title.trim()) {
      toast.error('Class and title are required');
      return;
    }

    if (!selectedFile) {
      toast.error('Please select a video file');
      return;
    }

    try {
      setLoading(true);
      setUploadStatus('uploading');
      setUploadProgress(0);
      
      // Generate video record first
      console.log('🎬 Creating video record...');
      const response = await videosAPI.generateUploadUrl({
        classId: formData.classId,
        title: formData.title,
        description: formData.description
      });
      
      const { videoId } = response.data;
      console.log('✅ Video record created:', videoId);
      
      // Upload video directly
      setUploadProgress(25);
      console.log('📤 Starting file upload...');
      const uploadResult = await uploadVideoDirectly(selectedFile, videoId);
      
      setUploadProgress(75);
      console.log('✅ File upload completed:', uploadResult);
      
      // Update video record with file size (using the new approach)
      console.log('💾 Updating video record with file size...');
      await videosAPI.completeUpload(videoId, {
        fileSize: uploadResult.size,
        fileUrl: uploadResult.fileUrl
      });
      
      setUploadStatus('completed');
      setUploadProgress(100);
      console.log('🎉 Video upload process completed successfully!');
      toast.success('Video uploaded successfully! Processing will begin shortly.');
      
      // Reset form and close modal after a short delay
      setTimeout(() => {
        onSuccess();
        onClose();
        setFormData({ classId: '', title: '', description: '' });
        setSelectedFile(null);
        setUploadProgress(0);
        setUploadStatus('idle');
      }, 2000);
      
    } catch (error) {
      console.error('❌ Failed to upload video:', error);
      setUploadStatus('error');
      toast.error('Failed to upload video. Please try again.');
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
          <h2>Upload Video Lecture</h2>
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
            <label htmlFor="title">Video Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Introduction to Algebra"
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
              placeholder="Brief description of the video content"
              rows="3"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="videoFile">Video File *</label>
            <div className="file-upload-area">
              <input
                type="file"
                id="videoFile"
                name="videoFile"
                accept="video/*"
                onChange={handleFileSelect}
                className="file-input"
              />
              <label htmlFor="videoFile" className="file-upload-label">
                {selectedFile ? (
                  <div className="file-selected">
                    <div className="file-icon"><Icon name="video" size={24} /></div>
                    <div className="file-info">
                      <div className="file-name">{selectedFile.name}</div>
                      <div className="file-size">{formatFileSize(selectedFile.size)}</div>
                    </div>
                  </div>
                ) : (
                  <div className="file-upload-text">
                    <div className="upload-icon"><Icon name="folder" size={24} /></div>
                    <div className="upload-text">Choose video file (max 10GB)</div>
                    <div className="upload-hint">Supports MP4, AVI, MOV, and other video formats</div>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Upload Progress */}
          {uploadStatus === 'uploading' && (
            <div className="upload-progress-section">
              <div className="progress-header">
                <span>Uploading video...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <div className="progress-text">
                Please don't close this window during upload
              </div>
            </div>
          )}

          {/* Upload Status */}
          {uploadStatus === 'completed' && (
            <div className="upload-status success">
              <div className="status-icon"><Icon name="present" size={20} /></div>
              <div className="status-text">Video uploaded successfully!</div>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className="upload-status error">
              <div className="status-icon"><Icon name="absent" size={20} /></div>
              <div className="status-text">Upload failed. Please try again.</div>
            </div>
          )}
          
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading || !selectedFile || uploadStatus === 'uploading'}
            >
              {uploadStatus === 'uploading' ? 'Uploading...' : 
               uploadStatus === 'completed' ? 'Upload Complete' :
               loading ? 'Preparing...' : 'Upload Video'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadVideoModal;

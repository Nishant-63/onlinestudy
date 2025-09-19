import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { videosAPI } from '../services/api';
import { toast } from 'react-toastify';

const VideoPlayer = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);
  const lastTrackedTime = useRef(0);

  useEffect(() => {
    loadVideo();
  }, [id]);

  useEffect(() => {
    // Track video view when component mounts
    if (video && user.role === 'student') {
      trackVideoView('start');
    }

    // Track video view when component unmounts
    return () => {
      if (video && user.role === 'student') {
        trackVideoView('complete');
      }
    };
  }, [video, user.role]);

  const loadVideo = async () => {
    try {
      setLoading(true);
      const response = await videosAPI.getVideo(id);
      setVideo(response.data.video);
    } catch (error) {
      console.error('Failed to load video:', error);
      toast.error('Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  const trackVideoView = async (action) => {
    if (user.role !== 'student') return;

    try {
      const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
      await videosAPI.trackView(id, {
        action,
        progress: Math.floor(progress),
        duration: Math.floor(duration)
      });
    } catch (error) {
      console.error('Failed to track video view:', error);
    }
  };

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
      trackVideoView('play');
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
      trackVideoView('pause');
    }
  };

  const handleSeek = (e) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = (clickX / rect.width) * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      trackVideoView('seek');
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      setProgress((time / duration) * 100);

      // Track progress every 10 seconds
      if (Math.floor(time) - Math.floor(lastTrackedTime.current) >= 10) {
        lastTrackedTime.current = time;
        trackVideoView('progress');
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="container">
        <div className="alert alert-error">
          Video not found or access denied
        </div>
      </div>
    );
  }

  return (
    <div className="video-player-container">
      <div className="video-player">
        <video
          ref={videoRef}
          src={video.videoUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={handlePlay}
          onPause={handlePause}
          controls
          className="video-element"
        />
      </div>

      <div className="video-info">
        <h1 className="video-title">{video.title}</h1>
        <p className="video-description">{video.description}</p>
        
        <div className="video-meta">
          <div className="video-stats">
            <span>Duration: {formatTime(duration)}</span>
            <span>File Size: {(video.file_size / (1024 * 1024)).toFixed(1)} MB</span>
            <span>Uploaded: {new Date(video.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {user.role === 'teacher' && (
          <div className="video-actions">
            <button className="btn btn-outline">
              View Analytics
            </button>
            <button className="btn btn-danger">
              Delete Video
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;

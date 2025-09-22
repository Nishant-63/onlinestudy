import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Icon } from './Icons';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  if (!user) {
    return (
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-brand">
            <div className="navbar-logo">OS</div>
            OnlineStudy
          </Link>
          <div className="navbar-nav">
            <Link to="/login" className="btn btn-outline">
              Login
            </Link>
            <Link to="/register" className="btn btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <div className="navbar-logo">OS</div>
          OnlineStudy
        </Link>
        
        <ul className="navbar-nav">
          {user.role === 'teacher' ? (
            <>
              <li>
                <Link to="/" className="nav-link">
                  <Icon name="dashboard" size={18} style={{ marginRight: '8px' }} />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/teacher/classes" className="nav-link">
                  <Icon name="classes" size={18} style={{ marginRight: '8px' }} />
                  Classes
                </Link>
              </li>
              <li>
                <Link to="/teacher/students" className="nav-link">
                  <Icon name="students" size={18} style={{ marginRight: '8px' }} />
                  Students
                </Link>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/student/classes" className="nav-link">
                  <Icon name="classes" size={18} style={{ marginRight: '8px' }} />
                  My Classes
                </Link>
              </li>
              <li>
                <Link to="/student/assignments" className="nav-link">
                  <Icon name="assignments" size={18} style={{ marginRight: '8px' }} />
                  Assignments
                </Link>
              </li>
              <li>
                <Link to="/student/attendance" className="nav-link">
                  <Icon name="attendance" size={18} style={{ marginRight: '8px' }} />
                  Attendance
                </Link>
              </li>
            </>
          )}
        </ul>

        <div className="navbar-user">
          <div className="user-info">
            <div className="user-avatar">
              {getInitials(user.firstName, user.lastName)}
            </div>
            <div className="user-details">
              <div className="user-name">
                {user.firstName} {user.lastName}
              </div>
              <div className="user-role">
                {user.role === 'teacher' ? 'Teacher' : 'Student'}
              </div>
            </div>
          </div>
          
          <div className="user-menu">
            <button
              className="btn btn-outline"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <Icon name="menu" size={16} style={{ marginRight: '6px' }} />
              Menu
            </button>
            
            {showUserMenu && (
              <div className="user-dropdown">
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setShowUserMenu(false);
                    // Add profile/settings functionality
                  }}
                >
                  <Icon name="profile" size={16} style={{ marginRight: '6px' }} />
                  Profile
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setShowUserMenu(false);
                    handleLogout();
                  }}
                >
                  <Icon name="logout" size={16} style={{ marginRight: '6px' }} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

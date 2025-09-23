import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const Login = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleDemoAccountClick = (email, password) => {
    setFormData({
      email,
      password
    });
    setShowDemoAccounts(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        toast.success('Login successful!');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <div className="card">
        <h1 className="form-title">Login to OnlineStudy</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              required
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="form-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register">Register here</Link>
          </p>
        </div>

        {/* Demo Accounts Section */}
        <div className="demo-accounts-section">
          <button
            type="button"
            className="demo-toggle-btn"
            onClick={() => setShowDemoAccounts(!showDemoAccounts)}
          >
            {showDemoAccounts ? 'Hide' : 'Show'} Demo Accounts
          </button>
          
          {showDemoAccounts && (
            <div className="demo-accounts">
              <h3>Demo Account Credentials</h3>
              
              <div className="demo-section">
                <h4>👨‍🏫 Teachers (Password: teacher123)</h4>
                <div className="demo-account-list">
                  <button
                    type="button"
                    className="demo-account-btn"
                    onClick={() => handleDemoAccountClick('teacher@onlinestudy.com', 'teacher123')}
                  >
                    John Doe (Teacher)
                  </button>
                </div>
              </div>

              <div className="demo-section">
                <h4>👨‍🎓 Students (Password: student123)</h4>
                <div className="demo-account-list">
                  <button
                    type="button"
                    className="demo-account-btn"
                    onClick={() => handleDemoAccountClick('student1@onlinestudy.com', 'student123')}
                  >
                    Student 1
                  </button>
                  <button
                    type="button"
                    className="demo-account-btn"
                    onClick={() => handleDemoAccountClick('student2@onlinestudy.com', 'student123')}
                  >
                    Student 2
                  </button>
                  <button
                    type="button"
                    className="demo-account-btn"
                    onClick={() => handleDemoAccountClick('student3@onlinestudy.com', 'student123')}
                  >
                    Student 3
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;

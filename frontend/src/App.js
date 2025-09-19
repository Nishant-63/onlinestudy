import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ClassesOverview from './pages/ClassesOverview';
import StudentsOverview from './pages/StudentsOverview';
import ClassDetails from './pages/ClassDetails';
import VideoPlayer from './pages/VideoPlayer';
import AssignmentDetails from './pages/AssignmentDetails';
import StudentAssignments from './pages/StudentAssignments';
import StudentAttendance from './pages/StudentAttendance';
import './App.css';

// Protected Route component
const ProtectedRoute = ({ children, requireRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole && user.role !== requireRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Main App component
const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="App">
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={user ? <Navigate to="/" replace /> : <Login />} 
          />
          <Route 
            path="/register" 
            element={user ? <Navigate to="/" replace /> : <Register />} 
          />

          {/* Protected routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                {user?.role === 'teacher' ? (
                  <TeacherDashboard />
                ) : (
                  <StudentDashboard />
                )}
              </ProtectedRoute>
            } 
          />

          {/* Teacher routes */}
          <Route 
            path="/teacher/classes" 
            element={
              <ProtectedRoute requireRole="teacher">
                <ClassesOverview />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teacher/classes/:id" 
            element={
              <ProtectedRoute requireRole="teacher">
                <ClassDetails />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teacher/students" 
            element={
              <ProtectedRoute requireRole="teacher">
                <StudentsOverview />
              </ProtectedRoute>
            } 
          />

          {/* Student routes */}
          <Route 
            path="/student/classes" 
            element={
              <ProtectedRoute requireRole="student">
                <ClassesOverview />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/classes/:id" 
            element={
              <ProtectedRoute requireRole="student">
                <ClassDetails />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/assignments" 
            element={
              <ProtectedRoute requireRole="student">
                <StudentAssignments />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/attendance" 
            element={
              <ProtectedRoute requireRole="student">
                <StudentAttendance />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/remarks" 
            element={
              <ProtectedRoute requireRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Video player */}
          <Route 
            path="/video/:id" 
            element={
              <ProtectedRoute>
                <VideoPlayer />
              </ProtectedRoute>
            } 
          />

          {/* Assignment details */}
          <Route 
            path="/assignment/:id" 
            element={
              <ProtectedRoute>
                <AssignmentDetails />
              </ProtectedRoute>
            } 
          />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

// App with AuthProvider
const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;

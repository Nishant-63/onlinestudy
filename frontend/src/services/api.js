import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post('/api/auth/refresh', {
            refreshToken
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const usersAPI = {
  getPending: (params) => api.get('/users/pending', { params }),
  updateStatus: (id, status) => api.patch(`/users/${id}/status`, { status }),
  getStudents: (params) => api.get('/users/students', { params }),
  getStudent: (id) => api.get(`/users/students/${id}`),
  getTeachers: (params) => api.get('/users/teachers', { params }),
};

export const classesAPI = {
  create: (classData) => api.post('/classes', classData),
  getTeacherClasses: (params) => api.get('/classes/teacher', { params }),
  getStudentClasses: (params) => api.get('/classes/student', { params }),
  getClass: (id) => api.get(`/classes/${id}`),
  enrollStudent: (id, studentId) => api.post(`/classes/${id}/enroll`, { studentId }),
  getStudents: (id, params) => api.get(`/classes/${id}/students`, { params }),
  removeStudent: (id, studentId) => api.delete(`/classes/${id}/students/${studentId}`),
  update: (id, classData) => api.put(`/classes/${id}`, classData),
  delete: (id) => api.delete(`/classes/${id}`),
};

export const videosAPI = {
  generateUploadUrl: (videoData) => api.post('/videos/upload-url', videoData),
  generatePartUrl: (data) => api.post('/videos/upload-part-url', data),
  completeUpload: (id, data) => api.post('/videos/complete-upload', { videoId: id, ...data }),
  getClassVideos: (classId, params) => api.get(`/videos/class/${classId}`, { params }),
  getVideo: (id) => api.get(`/videos/${id}`),
  trackView: (id, data) => api.post(`/videos/${id}/view`, data),
  getViews: (id) => api.get(`/videos/${id}/views`),
  delete: (id) => api.delete(`/videos/${id}`),
};

export const assignmentsAPI = {
  upload: (assignmentData) => api.post('/assignments/upload', assignmentData),
  completeUpload: (id, data) => api.post(`/assignments/${id}/complete-upload`, data),
  getClassAssignments: (classId, params) => api.get(`/assignments/class/${classId}`, { params }),
  getStudentAssignments: (params) => api.get('/assignments/student', { params }),
  getAssignment: (id) => api.get(`/assignments/${id}`),
  submit: (id, data) => api.post(`/assignments/${id}/submit`, data),
  completeSubmission: (id, data) => api.post(`/assignments/${id}/complete-submission`, data),
  getSubmissions: (id, params) => api.get(`/assignments/${id}/submissions`, { params }),
  gradeSubmission: (submissionId, data) => api.patch(`/assignments/submissions/${submissionId}/grade`, data),
  getStudentSubmissions: (studentId, params) => api.get(`/assignments/student/${studentId}`, { params }),
  getMySubmissions: (params) => api.get('/assignments/student/submissions', { params }),
  delete: (id) => api.delete(`/assignments/${id}`),
};

export const attendanceAPI = {
  mark: (attendanceData) => api.post('/attendance/mark', attendanceData),
  uploadCSV: (data) => api.post('/attendance/upload-csv', data),
  getClassAttendance: (classId, params) => api.get(`/attendance/class/${classId}`, { params }),
  getAttendanceByDate: (classId, date) => api.get(`/attendance/class/${classId}/date/${date}`),
  getStudentAttendance: (params) => api.get('/attendance/student', { params }),
  getSummary: (classId) => api.get(`/attendance/class/${classId}/summary`),
  update: (id, data) => api.patch(`/attendance/${id}`, data),
  delete: (id) => api.delete(`/attendance/${id}`),
};

export const remarksAPI = {
  create: (remarkData) => api.post('/remarks', remarkData),
  getClassRemarks: (classId, params) => api.get(`/remarks/class/${classId}`, { params }),
  getStudentRemarks: (studentId, params) => api.get(`/remarks/student/${studentId}`, { params }),
  getMyRemarks: (params) => api.get('/remarks/my-remarks', { params }),
  getRemark: (id) => api.get(`/remarks/${id}`),
  update: (id, data) => api.put(`/remarks/${id}`, data),
  delete: (id) => api.delete(`/remarks/${id}`),
  getTeacherRemarks: (params) => api.get('/remarks/teacher/all', { params }),
};

export default api;

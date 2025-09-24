# OnlineStudy - Teacher-led E-learning Platform

A comprehensive full-stack web application for teacher-led online education with video lectures, assignments, attendance tracking, and student management.

## 🚀 Features

### For Teachers (Admins)
- **User Management**: Approve/reject student registrations
- **Class Management**: Create and manage classes, enroll students
- **Video Lectures**: Upload videos up to 20GB with HLS streaming support
- **Assignments**: Upload PDF notes and assignments with due dates
- **Attendance Tracking**: Mark attendance manually or upload CSV files
- **Student Monitoring**: Track video views and student progress
- **Remarks System**: Add feedback and comments for students

### For Students
- **Content Access**: View approved video lectures and assignments
- **Assignment Submission**: Upload PDF submissions (up to 500MB)
- **Progress Tracking**: View attendance records and teacher remarks
- **Video Analytics**: Track viewing progress and completion

### Technical Features
- **Direct S3 Upload**: Resumable multipart uploads for large files
- **Video Processing**: Automatic HLS generation and thumbnail creation
- **Real-time Tracking**: Video view monitoring and progress tracking
- **Role-based Access**: Secure teacher/student permissions
- **Responsive Design**: Mobile-friendly interface

## 🛠 Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **JWT** authentication with refresh tokens
- **S3-compatible storage** (AWS S3, DigitalOcean Spaces, MinIO)
- **Redis** with BullMQ for job processing
- **FFmpeg** for video processing
- **Docker** containerization

### Frontend
- **React 18** with functional components
- **React Router** for navigation
- **Axios** for API communication
- **Styled Components** for styling
- **React Player** for video playback
- **React Dropzone** for file uploads

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- Redis 7+
- Docker and Docker Compose (optional)
- FFmpeg (for video processing)

## 🚀 Quick Start

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd onlinestudy
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Initialize the database**
   ```bash
   # Run migrations
   docker-compose exec backend npm run migrate
   
   # Seed with sample data
   docker-compose exec backend npm run seed
   ```

4. **Access the application**
   - Frontend: https://onlinestudy-frontend.onrender.com (deployed)
   - Backend API: https://onlinestudy-backend-4u8y.onrender.com (deployed)
   - Local Development: http://localhost:3000 (frontend) / http://localhost:5000 (backend)
   - MinIO Console: http://localhost:9001 (minioadmin/minioadmin123)

### Manual Setup

1. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Copy environment file
   cp env.example .env
   
   # Update .env with your configuration
   # Start PostgreSQL and Redis
   
   # Run migrations
   npm run migrate
   
   # Seed database
   npm run seed
   
   # Start development server
   npm run dev
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   
   # Start development server
   npm start
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=onlinestudy
DB_USER=postgres
DB_PASSWORD=password

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# S3 Storage
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
S3_BUCKET=onlinestudy-files
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_REGION=nyc3

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Server
PORT=5000
NODE_ENV=development
```

### S3 Storage Setup

The application supports any S3-compatible storage:
- **AWS S3**
- **DigitalOcean Spaces**
- **MinIO** (included in Docker setup)

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user info

### Classes
- `GET /api/classes/teacher` - Get teacher's classes
- `GET /api/classes/student` - Get student's enrolled classes
- `POST /api/classes` - Create new class
- `GET /api/classes/:id` - Get class details
- `POST /api/classes/:id/enroll` - Enroll student in class

### Videos
- `POST /api/videos/upload-url` - Generate upload URL
- `POST /api/videos/complete-upload` - Complete video upload
- `GET /api/videos/class/:classId` - Get class videos
- `GET /api/videos/:id` - Get video details
- `POST /api/videos/:id/view` - Track video view

### Assignments
- `POST /api/assignments/upload` - Create assignment
- `GET /api/assignments/class/:classId` - Get class assignments
- `POST /api/assignments/:id/submit` - Submit assignment
- `GET /api/assignments/:id/submissions` - Get submissions (teacher)

## 🗄 Database Schema

### Core Tables
- `users` - Teachers and students
- `classes` - Class information
- `class_enrollments` - Student enrollments
- `videos` - Video lectures with metadata
- `video_views` - Video viewing tracking
- `assignments` - PDF assignments
- `assignment_submissions` - Student submissions
- `attendance` - Attendance records
- `remarks` - Teacher feedback

## 🎥 Video Processing

The application automatically processes uploaded videos:
1. **HLS Generation**: Converts videos to HTTP Live Streaming format
2. **Thumbnail Creation**: Generates preview thumbnails
3. **Background Processing**: Uses Redis job queue for scalability

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Role-based Access Control**: Teacher/student permissions
- **File Validation**: Server-side file type and size validation
- **Signed URLs**: Secure direct-to-S3 uploads
- **Rate Limiting**: API request throttling
- **Input Sanitization**: XSS and injection protection

## 📱 Responsive Design

The frontend is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🚀 Deployment

### Production with Docker

1. **Update environment variables** for production
2. **Build and deploy**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Manual Production Deployment

1. **Build frontend**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Start backend**:
   ```bash
   cd backend
   npm start
   ```

3. **Configure reverse proxy** (nginx/Apache)

## 📊 Monitoring

- **Video Processing**: Monitor job queue status
- **File Storage**: Track S3 usage and costs
- **Database**: Monitor query performance
- **Application**: Log errors and metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## 🔄 Version History

- **v1.0.0** - Initial release with core features
  - Teacher and student dashboards
  - Video upload and streaming
  - Assignment management
  - Attendance tracking
  - Student approval system

---

**Built with ❤️ for online education**

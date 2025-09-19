# 🎓 OnlineStudy Demo Accounts

This document contains all the demo account credentials and sample data for testing the OnlineStudy platform.

## 🔐 Demo Account Credentials

### 👨‍🏫 **TEACHER ACCOUNTS**
All teachers have the password: `teacher123`

| Email | Name | Role | Status |
|-------|------|------|--------|
| `john.doe@onlinestudy.com` | John Doe | Teacher | Approved |
| `sarah.smith@onlinestudy.com` | Sarah Smith | Teacher | Approved |
| `mike.johnson@onlinestudy.com` | Mike Johnson | Teacher | Approved |

### 👨‍🎓 **STUDENT ACCOUNTS (Approved)**
All approved students have the password: `student123`

| Email | Name | Role | Status |
|-------|------|------|--------|
| `alice.student@onlinestudy.com` | Alice Williams | Student | Approved |
| `bob.student@onlinestudy.com` | Bob Brown | Student | Approved |
| `carol.student@onlinestudy.com` | Carol Davis | Student | Approved |
| `david.student@onlinestudy.com` | David Miller | Student | Approved |
| `emma.student@onlinestudy.com` | Emma Wilson | Student | Approved |

### ⏳ **STUDENT ACCOUNTS (Pending Approval)**
These students need teacher approval to access the platform. Password: `student123`

| Email | Name | Role | Status |
|-------|------|------|--------|
| `frank.student@onlinestudy.com` | Frank Moore | Student | Pending |
| `grace.student@onlinestudy.com` | Grace Taylor | Student | Pending |

## 📚 **Sample Data Created**

### **Classes (5 total)**
1. **Mathematics 101** - Introduction to Algebra and Geometry (John Doe)
2. **Physics 201** - Advanced Physics Concepts and Applications (John Doe)
3. **English Literature** - Classic and Modern English Literature (Sarah Smith)
4. **Computer Science 301** - Data Structures and Algorithms (Mike Johnson)
5. **Chemistry Lab** - Practical Chemistry Experiments (Sarah Smith)

### **Assignments (3 total)**
1. **Algebra Homework 1** - Complete exercises 1-10 from chapter 3 (Due: 7 days)
2. **Physics Lab Report** - Write a report on the pendulum experiment (Due: 14 days)
3. **Essay Assignment** - Write a 1000-word essay on Shakespeare's Hamlet (Due: 10 days)

### **Video Lectures (4 total)**
1. **Introduction to Algebra** - Basic concepts of algebra and variables (30 min)
2. **Solving Linear Equations** - Step-by-step guide to solving linear equations (35 min)
3. **Newton's Laws of Motion** - Understanding the fundamental laws of physics (40 min)
4. **Shakespeare's Life and Works** - Introduction to William Shakespeare and his major works (32 min)

### **Attendance Records**
- Multiple attendance records for the first 3 classes
- Various attendance statuses: Present, Absent, Late
- Records for different dates (1 week ago, 3 days ago, 1 day ago)

### **Student Remarks**
- Personalized feedback from teachers to students
- Comments on homework performance and progress
- Encouragement and improvement suggestions

## 🚀 **How to Test**

### **1. Access the Platform**
- **URL**: http://localhost:3000
- **Frontend**: React application with modern UI
- **Backend**: Node.js/Express API at http://localhost:5001

### **2. Test Teacher Features**
1. **Login** as any teacher account
2. **View Dashboard** - See classes, students, and statistics
3. **Quick Actions** - Test the functional modal buttons:
   - Create Class
   - Upload Video (demo mode)
   - Create Assignment (demo mode)
   - Mark Attendance
4. **Approve Students** - Approve pending student registrations
5. **View Classes** - See detailed class information

### **3. Test Student Features**
1. **Login** as any approved student account
2. **View Dashboard** - See enrolled classes and assignments
3. **Browse Content** - View videos and assignments
4. **Submit Assignments** - Test assignment submission (demo mode)

### **4. Test Pending Students**
1. **Login** as pending student account
2. **Verify** that access is restricted until teacher approval
3. **Switch** to teacher account to approve the student

## 🔧 **Technical Details**

### **Database Schema**
- **Users**: Teachers and students with role-based access
- **Classes**: Course information and teacher assignments
- **Class Enrollments**: Student-class relationships
- **Videos**: Video lecture metadata and file references
- **Assignments**: Assignment details and due dates
- **Attendance**: Student attendance tracking
- **Remarks**: Teacher feedback for students
- **Video Views**: Student video consumption tracking

### **Authentication**
- **JWT Tokens**: Secure authentication with refresh tokens
- **Role-Based Access**: Different permissions for teachers vs students
- **Password Hashing**: bcryptjs for secure password storage

### **File Storage**
- **MinIO**: S3-compatible object storage for files
- **Signed URLs**: Secure file upload and download
- **File Types**: Support for videos (MP4) and documents (PDF)

## 📊 **Testing Scenarios**

### **Teacher Testing**
1. **Create New Class** → Verify it appears in dashboard
2. **Mark Attendance** → Check attendance records are saved
3. **Approve Students** → Verify pending students become approved
4. **View Analytics** → Check class statistics and student progress

### **Student Testing**
1. **View Classes** → Verify enrolled classes are visible
2. **Access Content** → Check videos and assignments are accessible
3. **Submit Work** → Test assignment submission workflow
4. **View Feedback** → Check teacher remarks are visible

### **Admin Testing**
1. **User Management** → Test user approval/rejection workflow
2. **Content Management** → Verify content creation and editing
3. **Analytics** → Check reporting and statistics features

## 🎯 **Quick Start Commands**

```bash
# Start the platform
cd /Users/nishantpuri/Desktop/onlinestudy
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs backend
docker-compose logs frontend

# Stop platform
docker-compose down
```

## 📝 **Notes**

- All demo accounts use simple passwords for easy testing
- File uploads are in demo mode (forms work, but files aren't actually uploaded)
- The platform is fully functional with real database operations
- All sample data is realistic and representative of a real e-learning platform
- The system supports both teacher and student workflows

---

**Happy Testing! 🎉**

For any issues or questions, check the Docker logs or refer to the main README.md file.

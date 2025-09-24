const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database file in the backend directory
const dbPath = path.join(__dirname, '../../onlinestudy.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Create tables
const createTables = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Classes table
      db.run(`
        CREATE TABLE IF NOT EXISTS classes (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          teacher_id TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (teacher_id) REFERENCES users (id)
        )
      `);

      // Class enrollments table
      db.run(`
        CREATE TABLE IF NOT EXISTS class_enrollments (
          id TEXT PRIMARY KEY,
          class_id TEXT NOT NULL,
          student_id TEXT NOT NULL,
          enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (class_id) REFERENCES classes (id),
          FOREIGN KEY (student_id) REFERENCES users (id),
          UNIQUE(class_id, student_id)
        )
      `);

      // Videos table
      db.run(`
        CREATE TABLE IF NOT EXISTS videos (
          id TEXT PRIMARY KEY,
          class_id TEXT NOT NULL,
          teacher_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          file_key TEXT,
          file_size INTEGER,
          duration INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (class_id) REFERENCES classes (id),
          FOREIGN KEY (teacher_id) REFERENCES users (id)
        )
      `);

      // Assignments table
      db.run(`
        CREATE TABLE IF NOT EXISTS assignments (
          id TEXT PRIMARY KEY,
          class_id TEXT NOT NULL,
          teacher_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          file_key TEXT,
          file_size INTEGER,
          due_date DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (class_id) REFERENCES classes (id),
          FOREIGN KEY (teacher_id) REFERENCES users (id)
        )
      `);

      // Assignment submissions table
      db.run(`
        CREATE TABLE IF NOT EXISTS assignment_submissions (
          id TEXT PRIMARY KEY,
          assignment_id TEXT NOT NULL,
          student_id TEXT NOT NULL,
          file_key TEXT,
          file_size INTEGER,
          grade INTEGER,
          feedback TEXT,
          submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          graded_at DATETIME,
          FOREIGN KEY (assignment_id) REFERENCES assignments (id),
          FOREIGN KEY (student_id) REFERENCES users (id),
          UNIQUE(assignment_id, student_id)
        )
      `);

      // Attendance table
      db.run(`
        CREATE TABLE IF NOT EXISTS attendance (
          id TEXT PRIMARY KEY,
          class_id TEXT NOT NULL,
          student_id TEXT NOT NULL,
          date DATE NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
          marked_by TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (class_id) REFERENCES classes (id),
          FOREIGN KEY (student_id) REFERENCES users (id),
          FOREIGN KEY (marked_by) REFERENCES users (id),
          UNIQUE(class_id, student_id, date)
        )
      `);

      // Remarks table
      db.run(`
        CREATE TABLE IF NOT EXISTS remarks (
          id TEXT PRIMARY KEY,
          class_id TEXT NOT NULL,
          student_id TEXT NOT NULL,
          teacher_id TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (class_id) REFERENCES classes (id),
          FOREIGN KEY (student_id) REFERENCES users (id),
          FOREIGN KEY (teacher_id) REFERENCES users (id)
        )
      `);

      // Video views table
      db.run(`
        CREATE TABLE IF NOT EXISTS video_views (
          id TEXT PRIMARY KEY,
          video_id TEXT NOT NULL,
          student_id TEXT NOT NULL,
          watched_duration INTEGER DEFAULT 0,
          total_duration INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (video_id) REFERENCES videos (id),
          FOREIGN KEY (student_id) REFERENCES users (id),
          UNIQUE(video_id, student_id)
        )
      `);

      console.log('Database tables created successfully');
      resolve();
    });
  });
};

// Initialize database
createTables().catch(console.error);

module.exports = db;

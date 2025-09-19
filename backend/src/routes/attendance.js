const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { authenticateToken, requireTeacher, requireStudent } = require('../middleware/auth');
const { validateAttendance, validateUUID, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Mark attendance (teacher only)
router.post('/mark', authenticateToken, requireTeacher, validateAttendance, async (req, res) => {
  try {
    const { classId, date, attendance } = req.body;
    const { id: teacherId } = req.user;

    // Verify class belongs to teacher
    const classResult = await pool.query(
      'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2',
      [classId, teacherId]
    );

    if (classResult.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found or access denied' });
    }

    // Process attendance records
    const attendanceRecords = [];
    for (const record of attendance) {
      const { studentId, status } = record;

      // Verify student is enrolled in class
      const enrollmentResult = await pool.query(
        'SELECT id FROM class_enrollments WHERE class_id = $1 AND student_id = $2',
        [classId, studentId]
      );

      if (enrollmentResult.rows.length === 0) {
        return res.status(400).json({ 
          error: `Student ${studentId} is not enrolled in this class` 
        });
      }

      // Insert or update attendance record
      const attendanceId = uuidv4();
      await pool.query(
        `INSERT INTO attendance (id, class_id, student_id, date, status, marked_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (class_id, student_id, date)
         DO UPDATE SET status = $5, marked_by = $6`,
        [attendanceId, classId, studentId, date, status, teacherId]
      );

      attendanceRecords.push({ studentId, status });
    }

    res.json({
      message: 'Attendance marked successfully',
      records: attendanceRecords
    });

  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// Upload attendance CSV (teacher only)
router.post('/upload-csv', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const { classId, date, csvData } = req.body;
    const { id: teacherId } = req.user;

    // Verify class belongs to teacher
    const classResult = await pool.query(
      'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2',
      [classId, teacherId]
    );

    if (classResult.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found or access denied' });
    }

    // Parse CSV data (assuming it's already parsed on frontend)
    if (!Array.isArray(csvData)) {
      return res.status(400).json({ error: 'Invalid CSV data format' });
    }

    const attendanceRecords = [];
    for (const row of csvData) {
      const { studentId, status } = row;

      if (!studentId || !['present', 'absent', 'late'].includes(status)) {
        continue; // Skip invalid rows
      }

      // Verify student is enrolled in class
      const enrollmentResult = await pool.query(
        'SELECT id FROM class_enrollments WHERE class_id = $1 AND student_id = $2',
        [classId, studentId]
      );

      if (enrollmentResult.rows.length === 0) {
        continue; // Skip students not enrolled
      }

      // Insert or update attendance record
      const attendanceId = uuidv4();
      await pool.query(
        `INSERT INTO attendance (id, class_id, student_id, date, status, marked_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (class_id, student_id, date)
         DO UPDATE SET status = $5, marked_by = $6`,
        [attendanceId, classId, studentId, date, status, teacherId]
      );

      attendanceRecords.push({ studentId, status });
    }

    res.json({
      message: 'Attendance uploaded successfully',
      records: attendanceRecords
    });

  } catch (error) {
    console.error('Upload attendance CSV error:', error);
    res.status(500).json({ error: 'Failed to upload attendance CSV' });
  }
});

// Get attendance for class (teacher only)
router.get('/class/:classId', authenticateToken, requireTeacher, validateUUID('classId'), validatePagination, async (req, res) => {
  try {
    const { classId } = req.params;
    const { id: teacherId } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Verify class belongs to teacher
    const classResult = await pool.query(
      'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2',
      [classId, teacherId]
    );

    if (classResult.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found or access denied' });
    }

    // Get attendance records
    const result = await pool.query(
      `SELECT a.*, u.first_name, u.last_name, u.email
       FROM attendance a
       JOIN users u ON a.student_id = u.id
       WHERE a.class_id = $1
       ORDER BY a.date DESC, u.last_name, u.first_name
       LIMIT $2 OFFSET $3`,
      [classId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM attendance WHERE class_id = $1',
      [classId]
    );

    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      attendance: result.rows,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get class attendance error:', error);
    res.status(500).json({ error: 'Failed to get class attendance' });
  }
});

// Get attendance for specific date (teacher only)
router.get('/class/:classId/date/:date', authenticateToken, requireTeacher, validateUUID('classId'), async (req, res) => {
  try {
    const { classId, date } = req.params;
    const { id: teacherId } = req.user;

    // Verify class belongs to teacher
    const classResult = await pool.query(
      'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2',
      [classId, teacherId]
    );

    if (classResult.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found or access denied' });
    }

    // Get attendance for specific date
    const result = await pool.query(
      `SELECT a.*, u.first_name, u.last_name, u.email
       FROM attendance a
       JOIN users u ON a.student_id = u.id
       WHERE a.class_id = $1 AND a.date = $2
       ORDER BY u.last_name, u.first_name`,
      [classId, date]
    );

    res.json({ attendance: result.rows });

  } catch (error) {
    console.error('Get attendance by date error:', error);
    res.status(500).json({ error: 'Failed to get attendance by date' });
  }
});

// Get student's attendance (student only)
router.get('/student', authenticateToken, requireStudent, validatePagination, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT a.*, c.name as class_name, u.first_name as teacher_first_name, 
              u.last_name as teacher_last_name
       FROM attendance a
       JOIN classes c ON a.class_id = c.id
       JOIN users u ON a.marked_by = u.id
       WHERE a.student_id = $1
       ORDER BY a.date DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM attendance WHERE student_id = $1',
      [userId]
    );

    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      attendance: result.rows,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({ error: 'Failed to get student attendance' });
  }
});

// Get attendance summary for class (teacher only)
router.get('/class/:classId/summary', authenticateToken, requireTeacher, validateUUID('classId'), async (req, res) => {
  try {
    const { classId } = req.params;
    const { id: teacherId } = req.user;

    // Verify class belongs to teacher
    const classResult = await pool.query(
      'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2',
      [classId, teacherId]
    );

    if (classResult.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found or access denied' });
    }

    // Get attendance summary
    const summaryResult = await pool.query(
      `SELECT 
         u.id as student_id,
         u.first_name,
         u.last_name,
         u.email,
         COUNT(a.id) as total_days,
         COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
         COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
         COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days,
         ROUND(
           COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / 
           NULLIF(COUNT(a.id), 0), 2
         ) as attendance_percentage
       FROM users u
       JOIN class_enrollments ce ON u.id = ce.student_id
       LEFT JOIN attendance a ON u.id = a.student_id AND a.class_id = $1
       WHERE ce.class_id = $1
       GROUP BY u.id, u.first_name, u.last_name, u.email
       ORDER BY u.last_name, u.first_name`,
      [classId]
    );

    res.json({ summary: summaryResult.rows });

  } catch (error) {
    console.error('Get attendance summary error:', error);
    res.status(500).json({ error: 'Failed to get attendance summary' });
  }
});

// Update attendance record (teacher only)
router.patch('/:id', authenticateToken, requireTeacher, validateUUID('id'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { id: teacherId } = req.user;

    if (!['present', 'absent', 'late'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Verify attendance record exists and teacher has access
    const attendanceResult = await pool.query(
      `SELECT a.id FROM attendance a
       JOIN classes c ON a.class_id = c.id
       WHERE a.id = $1 AND c.teacher_id = $2`,
      [id, teacherId]
    );

    if (attendanceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Attendance record not found or access denied' });
    }

    // Update attendance record
    const result = await pool.query(
      'UPDATE attendance SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    res.json({
      message: 'Attendance updated successfully',
      attendance: result.rows[0]
    });

  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ error: 'Failed to update attendance' });
  }
});

// Delete attendance record (teacher only)
router.delete('/:id', authenticateToken, requireTeacher, validateUUID('id'), async (req, res) => {
  try {
    const { id } = req.params;
    const { id: teacherId } = req.user;

    // Verify attendance record exists and teacher has access
    const attendanceResult = await pool.query(
      `SELECT a.id FROM attendance a
       JOIN classes c ON a.class_id = c.id
       WHERE a.id = $1 AND c.teacher_id = $2`,
      [id, teacherId]
    );

    if (attendanceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Attendance record not found or access denied' });
    }

    // Delete attendance record
    await pool.query('DELETE FROM attendance WHERE id = $1', [id]);

    res.json({ message: 'Attendance record deleted successfully' });

  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({ error: 'Failed to delete attendance record' });
  }
});

module.exports = router;

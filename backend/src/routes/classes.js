const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { authenticateToken, requireTeacher, requireStudent } = require('../middleware/auth');
const { validateClassCreation, validateUUID, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Create new class (teacher only)
router.post('/', authenticateToken, requireTeacher, validateClassCreation, async (req, res) => {
  try {
    const { name, description } = req.body;
    const { id: teacherId } = req.user;

    const classId = uuidv4();
    const result = await pool.query(
      `INSERT INTO classes (id, name, description, teacher_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [classId, name, description, teacherId]
    );

    res.status(201).json({
      message: 'Class created successfully',
      class: result.rows[0]
    });

  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

// Get all classes for teacher
router.get('/teacher', authenticateToken, requireTeacher, validatePagination, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    

    const result = await pool.query(
      `SELECT c.*, 
              COUNT(DISTINCT ce.student_id) as student_count,
              COUNT(DISTINCT v.id) as video_count,
              COUNT(DISTINCT a.id) as assignment_count
       FROM classes c
       LEFT JOIN class_enrollments ce ON c.id = ce.class_id
       LEFT JOIN videos v ON c.id = v.class_id
       LEFT JOIN assignments a ON c.id = a.class_id
       WHERE c.teacher_id = $1
       GROUP BY c.id
       ORDER BY c.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM classes WHERE teacher_id = $1',
      [userId]
    );

    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      classes: result.rows,
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
    console.error('Get teacher classes error:', error);
    res.status(500).json({ error: 'Failed to get classes' });
  }
});

// Get all classes for student
router.get('/student', authenticateToken, requireStudent, validatePagination, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT c.*, u.first_name as teacher_first_name, u.last_name as teacher_last_name,
              COUNT(DISTINCT v.id) as video_count,
              COUNT(DISTINCT a.id) as assignment_count,
              ce.enrolled_at
       FROM classes c
       JOIN class_enrollments ce ON c.id = ce.class_id
       JOIN users u ON c.teacher_id = u.id
       LEFT JOIN videos v ON c.id = v.class_id
       LEFT JOIN assignments a ON c.id = a.class_id
       WHERE ce.student_id = $1
       GROUP BY c.id, u.first_name, u.last_name, ce.enrolled_at
       ORDER BY ce.enrolled_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM classes c
       JOIN class_enrollments ce ON c.id = ce.class_id
       WHERE ce.student_id = $1`,
      [userId]
    );

    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      classes: result.rows,
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
    console.error('Get student classes error:', error);
    res.status(500).json({ error: 'Failed to get classes' });
  }
});

// Get class details
router.get('/:id', authenticateToken, validateUUID('id'), async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    // Check access permissions
    let accessQuery;
    if (role === 'teacher') {
      accessQuery = 'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2';
    } else {
      accessQuery = `
        SELECT c.id FROM classes c
        JOIN class_enrollments ce ON c.id = ce.class_id
        WHERE c.id = $1 AND ce.student_id = $2
      `;
    }

    const accessResult = await pool.query(accessQuery, [id, userId]);

    if (accessResult.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this class' });
    }

    // Get class details
    const classResult = await pool.query(
      `SELECT c.*, u.first_name as teacher_first_name, u.last_name as teacher_last_name
       FROM classes c
       JOIN users u ON c.teacher_id = u.id
       WHERE c.id = $1`,
      [id]
    );

    if (classResult.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    res.json({ class: classResult.rows[0] });

  } catch (error) {
    console.error('Get class details error:', error);
    res.status(500).json({ error: 'Failed to get class details' });
  }
});

// Enroll student in class (teacher only)
router.post('/:id/enroll', authenticateToken, requireTeacher, validateUUID('id'), async (req, res) => {
  try {
    const { id: classId } = req.params;
    const { studentId } = req.body;
    const { id: teacherId } = req.user;

    // Verify class belongs to teacher
    const classResult = await pool.query(
      'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2',
      [classId, teacherId]
    );

    if (classResult.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found or access denied' });
    }

    // Verify student exists and is approved
    const studentResult = await pool.query(
      'SELECT id, status FROM users WHERE id = $1 AND role = \'student\'',
      [studentId]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (studentResult.rows[0].status !== 'approved') {
      return res.status(400).json({ error: 'Student account not approved' });
    }

    // Check if already enrolled
    const enrollmentResult = await pool.query(
      'SELECT id FROM class_enrollments WHERE class_id = $1 AND student_id = $2',
      [classId, studentId]
    );

    if (enrollmentResult.rows.length > 0) {
      return res.status(400).json({ error: 'Student already enrolled in this class' });
    }

    // Enroll student
    const enrollmentId = uuidv4();
    await pool.query(
      'INSERT INTO class_enrollments (id, class_id, student_id) VALUES ($1, $2, $3)',
      [enrollmentId, classId, studentId]
    );

    res.status(201).json({ message: 'Student enrolled successfully' });

  } catch (error) {
    console.error('Enroll student error:', error);
    res.status(500).json({ error: 'Failed to enroll student' });
  }
});

// Get class students (teacher only)
router.get('/:id/students', authenticateToken, requireTeacher, validateUUID('id'), validatePagination, async (req, res) => {
  try {
    const { id: classId } = req.params;
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

    // Get enrolled students
    const result = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.status, ce.enrolled_at
       FROM users u
       JOIN class_enrollments ce ON u.id = ce.student_id
       WHERE ce.class_id = $1
       ORDER BY ce.enrolled_at DESC
       LIMIT $2 OFFSET $3`,
      [classId, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM class_enrollments ce
       JOIN users u ON ce.student_id = u.id
       WHERE ce.class_id = $1`,
      [classId]
    );

    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      students: result.rows,
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
    console.error('Get class students error:', error);
    res.status(500).json({ error: 'Failed to get class students' });
  }
});

// Remove student from class (teacher only)
router.delete('/:id/students/:studentId', authenticateToken, requireTeacher, validateUUID('id'), validateUUID('studentId'), async (req, res) => {
  try {
    const { id: classId, studentId } = req.params;
    const { id: teacherId } = req.user;

    // Verify class belongs to teacher
    const classResult = await pool.query(
      'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2',
      [classId, teacherId]
    );

    if (classResult.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found or access denied' });
    }

    // Remove enrollment
    const result = await pool.query(
      'DELETE FROM class_enrollments WHERE class_id = $1 AND student_id = $2',
      [classId, studentId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Student not enrolled in this class' });
    }

    res.json({ message: 'Student removed from class successfully' });

  } catch (error) {
    console.error('Remove student error:', error);
    res.status(500).json({ error: 'Failed to remove student' });
  }
});

// Update class (teacher only)
router.put('/:id', authenticateToken, requireTeacher, validateUUID('id'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const { id: teacherId } = req.user;

    // Verify class belongs to teacher
    const classResult = await pool.query(
      'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2',
      [id, teacherId]
    );

    if (classResult.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found or access denied' });
    }

    // Update class
    const result = await pool.query(
      'UPDATE classes SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description, id]
    );

    res.json({
      message: 'Class updated successfully',
      class: result.rows[0]
    });

  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ error: 'Failed to update class' });
  }
});

// Delete class (teacher only)
router.delete('/:id', authenticateToken, requireTeacher, validateUUID('id'), async (req, res) => {
  try {
    const { id } = req.params;
    const { id: teacherId } = req.user;

    // Verify class belongs to teacher
    const classResult = await pool.query(
      'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2',
      [id, teacherId]
    );

    if (classResult.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found or access denied' });
    }

    // Delete class (cascade will handle related records)
    await pool.query('DELETE FROM classes WHERE id = $1', [id]);

    res.json({ message: 'Class deleted successfully' });

  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ error: 'Failed to delete class' });
  }
});

module.exports = router;

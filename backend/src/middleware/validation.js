const { body, param, query, validationResult } = require('express-validator');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// User registration validation
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name is required and must be less than 100 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name is required and must be less than 100 characters'),
  body('role')
    .isIn(['teacher', 'student'])
    .withMessage('Role must be either teacher or student'),
  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Video upload validation
const validateVideoUpload = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 300 })
    .withMessage('Title is required and must be less than 300 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('classId')
    .isUUID()
    .withMessage('Valid class ID is required'),
  handleValidationErrors
];

// Assignment upload validation
const validateAssignmentUpload = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 300 })
    .withMessage('Title is required and must be less than 300 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('classId')
    .isUUID()
    .withMessage('Valid class ID is required'),
  body('dueDate')
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Allow null, undefined, or empty string
      }
      // Check if it's a valid ISO 8601 date
      const date = new Date(value);
      return !isNaN(date.getTime()) && value.includes('T');
    })
    .withMessage('Due date must be a valid ISO 8601 date'),
  handleValidationErrors
];

// Class creation validation
const validateClassCreation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Class name is required and must be less than 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  handleValidationErrors
];

// Attendance validation
const validateAttendance = [
  body('classId')
    .isUUID()
    .withMessage('Valid class ID is required'),
  body('date')
    .isISO8601()
    .withMessage('Valid date is required'),
  body('attendance')
    .isArray({ min: 1 })
    .withMessage('Attendance data is required'),
  body('attendance.*.studentId')
    .isUUID()
    .withMessage('Valid student ID is required'),
  body('attendance.*.status')
    .isIn(['present', 'absent', 'late'])
    .withMessage('Status must be present, absent, or late'),
  handleValidationErrors
];

// Remark validation
const validateRemark = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Remark content is required and must be less than 1000 characters'),
  body('classId')
    .optional()
    .isUUID()
    .withMessage('Valid class ID is required'),
  body('studentId')
    .optional()
    .isUUID()
    .withMessage('Valid student ID is required'),
  handleValidationErrors
];

// UUID parameter validation
const validateUUID = (paramName) => [
  param(paramName)
    .isUUID()
    .withMessage(`Valid ${paramName} is required`),
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateVideoUpload,
  validateAssignmentUpload,
  validateClassCreation,
  validateAttendance,
  validateRemark,
  validateUUID,
  validatePagination,
};

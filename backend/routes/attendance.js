const express = require('express');
const router = express.Router();

const authMiddleware = require('../utils/auth_middleware');
const requireRoles   = require('../utils/role_middleware');
const ctrl = require('../controllers/attendance_controller');

// POST /api/attendance/check-in — all authenticated
router.post('/check-in', authMiddleware, ctrl.checkIn);

// POST /api/attendance/check-out — all authenticated
router.post('/check-out', authMiddleware, ctrl.checkOut);

// GET /api/attendance/me — all authenticated (own records)
router.get('/me', authMiddleware, ctrl.getMe);

// GET /api/attendance — admin, manager
router.get('/', authMiddleware, requireRoles('admin', 'manager'), ctrl.list);

module.exports = router;

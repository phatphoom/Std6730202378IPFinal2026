const express = require('express');
const router = express.Router();

const authMiddleware = require('../utils/auth_middleware');
const requireRoles   = require('../utils/role_middleware');
const ctrl = require('../controllers/leave_request_controller');

// GET /api/leave-requests/me — all authenticated (own leaves)
router.get('/me', authMiddleware, ctrl.getMe);

// POST /api/leave-requests — all authenticated
router.post('/', authMiddleware, ctrl.create);

// GET /api/leave-requests — admin, manager
router.get('/', authMiddleware, requireRoles('admin', 'manager'), ctrl.list);

// GET /api/leave-requests/:leaveId — admin, manager, or owner
router.get('/:leaveId', authMiddleware, ctrl.getById);

// PUT /api/leave-requests/:leaveId — owner only (pending only)
router.put('/:leaveId', authMiddleware, ctrl.update);

// PATCH /api/leave-requests/:leaveId/cancel — owner only
router.patch('/:leaveId/cancel', authMiddleware, ctrl.cancel);

// PATCH /api/leave-requests/:leaveId/decision — admin, manager
router.patch('/:leaveId/decision', authMiddleware, requireRoles('admin', 'manager'), ctrl.decide);

module.exports = router;

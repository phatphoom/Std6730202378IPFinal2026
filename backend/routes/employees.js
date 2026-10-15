const express = require('express');
const router = express.Router();

const authMiddleware = require('../utils/auth_middleware');
const requireRoles   = require('../utils/role_middleware');
const ctrl = require('../controllers/employee_controller');

// GET /api/employees — admin, manager
router.get('/', authMiddleware, requireRoles('admin', 'manager'), ctrl.list);

// POST /api/employees — admin only
router.post('/', authMiddleware, requireRoles('admin'), ctrl.create);

// GET /api/employees/salary-clusters — K-Means 1D analysis (must declare BEFORE /:employeeId)
router.get('/salary-clusters', ctrl.getSalaryClusters);

// GET /api/employees/:employeeId — admin, manager, owner (ownership check inside controller)
router.get('/:employeeId', authMiddleware, ctrl.getById);

// PUT /api/employees/:employeeId — admin or owner
router.put('/:employeeId', authMiddleware, ctrl.update);

// PATCH /api/employees/:employeeId/status — admin only
router.patch('/:employeeId/status', authMiddleware, requireRoles('admin'), ctrl.updateStatus);

module.exports = router;

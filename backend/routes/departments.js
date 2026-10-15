const express = require('express');
const router = express.Router();

const authMiddleware = require('../utils/auth_middleware');
const requireRoles   = require('../utils/role_middleware');
const ctrl = require('../controllers/department_controller');

// GET /api/departments — authenticated
router.get('/', authMiddleware, ctrl.list);

// POST /api/departments — admin only
router.post('/', authMiddleware, requireRoles('admin'), ctrl.create);

// PUT /api/departments/:departmentId — admin only
router.put('/:departmentId', authMiddleware, requireRoles('admin'), ctrl.update);

// DELETE /api/departments/:departmentId — admin only
router.delete('/:departmentId', authMiddleware, requireRoles('admin'), ctrl.remove);

module.exports = router;

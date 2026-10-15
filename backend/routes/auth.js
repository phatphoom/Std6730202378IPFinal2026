const express = require('express');
const router = express.Router();

const authMiddleware = require('../utils/auth_middleware');
const ctrl = require('../controllers/auth_controller');

// POST /api/auth/login — public
router.post('/login', ctrl.login);

// GET /api/auth/me — authenticated
router.get('/me', authMiddleware, ctrl.getMe);

// PUT /api/auth/change-password — authenticated
router.put('/change-password', authMiddleware, ctrl.changePassword);

module.exports = router;

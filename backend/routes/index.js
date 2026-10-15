const express = require('express');
const router = express.Router();

const healthRouter       = require('./health');
const authRouter         = require('./auth');
const departmentsRouter  = require('./departments');
const employeesRouter    = require('./employees');
const attendanceRouter   = require('./attendance');
const leaveRequestsRouter = require('./leave_requests');

router.use('/health',         healthRouter);
router.use('/auth',           authRouter);
router.use('/departments',    departmentsRouter);
router.use('/employees',      employeesRouter);
router.use('/attendance',     attendanceRouter);
router.use('/leave-requests', leaveRequestsRouter);

module.exports = router;

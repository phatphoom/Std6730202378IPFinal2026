const lvService = require('../services/leave_request_service');

const getMe = async (req, res) => {
  try {
    const data = await lvService.getMyLeaveRequests(req.user.employee_id, req.query);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

const list = async (req, res) => {
  try {
    const data = await lvService.listLeaveRequests(req.user, req.query);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const leave = await lvService.getLeaveById(leaveId);

    const caller = req.user;
    // Owner, admin, or manager can view
    if (caller.role === 'employee' && leave.employee_id !== caller.employee_id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    return res.status(200).json({ success: true, data: leave });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const body = req.body || {};
    const errors = {};
    if (!body.leave_type?.trim()) errors.leave_type = 'leave_type is required';
    if (!body.start_date) errors.start_date = 'start_date is required';
    if (!body.end_date) errors.end_date = 'end_date is required';
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const data = await lvService.createLeaveRequest(req.user.employee_id, body);
    return res.status(201).json({ success: true, message: 'Leave request created', data });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const data = await lvService.updateLeaveRequest(leaveId, req.user.employee_id, req.body || {});
    return res.status(200).json({ success: true, message: 'Leave request updated', data });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

const cancel = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const data = await lvService.cancelLeaveRequest(leaveId, req.user.employee_id);
    return res.status(200).json({ success: true, message: 'Leave request cancelled', data });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

const decide = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const body = req.body || {};
    if (!body.status) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: { status: 'status is required' } });
    }
    const data = await lvService.decideLeaveRequest(leaveId, req.user.employee_id, body);
    return res.status(200).json({ success: true, message: `Leave request ${body.status}`, data });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

module.exports = { getMe, list, getById, create, update, cancel, decide };

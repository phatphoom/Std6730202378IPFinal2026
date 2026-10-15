const empService = require('../services/employee_service');

const list = async (req, res) => {
  try {
    const data = await empService.listEmployees(req.user, req.query);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const caller = req.user;

    // Access: admin/manager unrestricted; employee must be owner
    if (caller.role === 'employee' && caller.employee_id !== employeeId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const data = await empService.getEmployeeById(employeeId);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const body = req.body || {};
    const errors = {};
    if (!body.first_name?.trim()) errors.first_name = 'first_name is required';
    if (!body.last_name?.trim()) errors.last_name = 'last_name is required';
    if (!body.email?.trim()) errors.email = 'email is required';
    if (!body.password || body.password.length < 6) errors.password = 'password must be at least 6 characters';
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const data = await empService.createEmployee(body);
    return res.status(201).json({ success: true, message: 'Employee created', data });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const caller = req.user;

    // Owner or admin only
    if (caller.role === 'employee' && caller.employee_id !== employeeId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    if (caller.role === 'manager' && caller.employee_id !== employeeId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const data = await empService.updateEmployee(employeeId, req.body || {}, caller.role);
    return res.status(200).json({ success: true, message: 'Employee updated', data });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { status } = req.body || {};
    if (!status) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: { status: 'status is required' } });
    }
    const data = await empService.updateEmployeeStatus(employeeId, status);
    return res.status(200).json({ success: true, message: 'Employee status updated', data });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

const getSalaryClusters = async (req, res) => {
  try {
    const clusters = await empService.getSalaryClusters();
    return res.status(200).json({ success: true, clusters, data: { clusters } });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

module.exports = { list, getById, create, update, updateStatus, getSalaryClusters };

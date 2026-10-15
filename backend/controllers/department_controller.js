const deptService = require('../services/department_service');

const list = async (req, res) => {
  try {
    const data = await deptService.listDepartments();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { name, code, manager_employee_id } = req.body || {};
    const errors = {};
    if (!name || !name.trim()) errors.name = 'name is required';
    if (!code || !code.trim()) errors.code = 'code is required';
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const data = await deptService.createDepartment({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      manager_employee_id: manager_employee_id || null,
    });
    return res.status(201).json({ success: true, message: 'Department created', data });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { name, code, manager_employee_id } = req.body || {};
    const errors = {};
    if (!name || !name.trim()) errors.name = 'name is required';
    if (!code || !code.trim()) errors.code = 'code is required';
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const data = await deptService.updateDepartment(departmentId, {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      manager_employee_id: manager_employee_id || null,
    });
    return res.status(200).json({ success: true, message: 'Department updated', data });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const { departmentId } = req.params;
    await deptService.deleteDepartment(departmentId);
    return res.status(200).json({ success: true, message: 'Department deleted' });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

module.exports = { list, create, update, remove };

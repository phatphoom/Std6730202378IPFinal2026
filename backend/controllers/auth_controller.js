const authService = require('../services/auth_service');

const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const errors = {};
    if (!email || typeof email !== 'string' || !email.trim()) errors.email = 'email is required';
    if (!password || typeof password !== 'string' || !password.trim()) errors.password = 'password is required';
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const result = await authService.login(email.trim(), password);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
};

const getMe = async (req, res) => {
  try {
    const data = await authService.getMe(req.user.employee_id);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body || {};
    const errors = {};
    if (!current_password) errors.current_password = 'current_password is required';
    if (!new_password || new_password.length < 6) errors.new_password = 'new_password must be at least 6 characters';
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    await authService.changePassword(req.user.employee_id, current_password, new_password);
    return res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
};

module.exports = { login, getMe, changePassword };

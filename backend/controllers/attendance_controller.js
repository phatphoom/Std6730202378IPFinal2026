const attService = require('../services/attendance_service');

const checkIn = async (req, res) => {
  try {
    const { recorded_at } = req.body || {};
    const data = await attService.checkIn(req.user.employee_id, recorded_at);
    return res.status(201).json({ success: true, message: 'Checked in', data });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

const checkOut = async (req, res) => {
  try {
    const { recorded_at } = req.body || {};
    const data = await attService.checkOut(req.user.employee_id, recorded_at);
    return res.status(200).json({ success: true, message: 'Checked out', data });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

const getMe = async (req, res) => {
  try {
    const data = await attService.getMyAttendance(req.user.employee_id, req.query);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

const list = async (req, res) => {
  try {
    const data = await attService.listAttendance(req.user, req.query);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

module.exports = { checkIn, checkOut, getMe, list };

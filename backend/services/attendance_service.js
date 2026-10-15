const pool = require('../config/db');
const { generateId } = require('../utils/generate_id');

const SELECT_FIELDS = `
  a.attendance_id, a.employee_id,
  CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
  e.department_id,
  a.check_in_time, a.check_out_time,
  a.created_at, a.updated_at
`;

/**
 * Record a check-in for the current user.
 * Rule: only one open (no check-out) session per employee.
 */
async function checkIn(employeeId, recorded_at) {
  // Check for open session
  const [open] = await pool.query(
    'SELECT attendance_id FROM attendance WHERE employee_id = ? AND check_out_time IS NULL',
    [employeeId]
  );
  if (open.length > 0) {
    const err = new Error('Already checked in. Please check out first.');
    err.status = 409;
    throw err;
  }

  const checkInTime = recorded_at ? new Date(recorded_at) : new Date();
  const attendance_id = await generateId('ATT', 'attendance', 'attendance_id');

  await pool.query(
    'INSERT INTO attendance (attendance_id, employee_id, check_in_time) VALUES (?, ?, ?)',
    [attendance_id, employeeId, checkInTime]
  );

  return getAttendanceById(attendance_id);
}

/**
 * Record a check-out for the current user.
 */
async function checkOut(employeeId, recorded_at) {
  const [open] = await pool.query(
    'SELECT attendance_id, check_in_time FROM attendance WHERE employee_id = ? AND check_out_time IS NULL',
    [employeeId]
  );
  if (open.length === 0) {
    const err = new Error('No open check-in found');
    err.status = 409;
    throw err;
  }

  const record = open[0];
  const checkOutTime = recorded_at ? new Date(recorded_at) : new Date();

  if (checkOutTime <= new Date(record.check_in_time)) {
    const err = new Error('Check-out time must be after check-in time');
    err.status = 400;
    throw err;
  }

  await pool.query(
    'UPDATE attendance SET check_out_time = ? WHERE attendance_id = ?',
    [checkOutTime, record.attendance_id]
  );

  return getAttendanceById(record.attendance_id);
}

/**
 * Get a single attendance record.
 */
async function getAttendanceById(attendanceId) {
  const [rows] = await pool.query(
    `SELECT ${SELECT_FIELDS}
     FROM attendance a
     JOIN employees e ON a.employee_id = e.employee_id
     WHERE a.attendance_id = ?`,
    [attendanceId]
  );
  if (rows.length === 0) {
    const err = new Error('Attendance record not found');
    err.status = 404;
    throw err;
  }
  return rows[0];
}

/**
 * Get attendance history for the current user (self).
 */
async function getMyAttendance(employeeId, { page = 1, limit = 20 }) {
  const offset = (Number(page) - 1) * Number(limit);
  const [[{ total }]] = await pool.query(
    'SELECT COUNT(*) AS total FROM attendance WHERE employee_id = ?',
    [employeeId]
  );
  const [rows] = await pool.query(
    `SELECT ${SELECT_FIELDS}
     FROM attendance a
     JOIN employees e ON a.employee_id = e.employee_id
     WHERE a.employee_id = ?
     ORDER BY a.check_in_time DESC
     LIMIT ? OFFSET ?`,
    [employeeId, Number(limit), offset]
  );
  return { attendance: rows, total, page: Number(page), limit: Number(limit) };
}

/**
 * List attendance records (admin sees all, manager sees own dept).
 */
async function listAttendance(caller, { page = 1, limit = 20, employee_id, date }) {
  const conditions = [];
  const params = [];

  if (caller.role === 'manager') {
    const [empRow] = await pool.query(
      'SELECT department_id FROM employees WHERE employee_id = ?',
      [caller.employee_id]
    );
    const deptId = empRow[0]?.department_id;
    if (deptId) {
      conditions.push('e.department_id = ?');
      params.push(deptId);
    } else {
      return { attendance: [], total: 0, page: Number(page), limit: Number(limit) };
    }
  }

  if (employee_id) {
    conditions.push('a.employee_id = ?');
    params.push(employee_id);
  }

  if (date) {
    conditions.push('DATE(a.check_in_time) = ?');
    params.push(date);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (Number(page) - 1) * Number(limit);

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM attendance a JOIN employees e ON a.employee_id = e.employee_id ${where}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT ${SELECT_FIELDS}
     FROM attendance a
     JOIN employees e ON a.employee_id = e.employee_id
     ${where}
     ORDER BY a.check_in_time DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), offset]
  );

  return { attendance: rows, total, page: Number(page), limit: Number(limit) };
}

module.exports = { checkIn, checkOut, getMyAttendance, listAttendance };

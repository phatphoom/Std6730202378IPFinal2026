const pool = require('../config/db');
const { generateId } = require('../utils/generate_id');

const SELECT_FIELDS = `
  lr.leave_id, lr.employee_id,
  CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
  e.department_id,
  lr.leave_type, lr.start_date, lr.end_date, lr.reason,
  lr.status, lr.decided_by, lr.comment,
  lr.created_at, lr.updated_at
`;

/**
 * Get a single leave request by ID.
 */
async function getLeaveById(leaveId) {
  const [rows] = await pool.query(
    `SELECT ${SELECT_FIELDS}
     FROM leave_requests lr
     JOIN employees e ON lr.employee_id = e.employee_id
     WHERE lr.leave_id = ?`,
    [leaveId]
  );
  if (rows.length === 0) {
    const err = new Error('Leave request not found');
    err.status = 404;
    throw err;
  }
  return rows[0];
}

/**
 * List leave requests — admin sees all, manager sees own dept.
 */
async function listLeaveRequests(caller, { page = 1, limit = 20, status, employee_id }) {
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
      return { leaveRequests: [], total: 0, page: Number(page), limit: Number(limit) };
    }
  }

  if (status) {
    conditions.push('lr.status = ?');
    params.push(status);
  }

  if (employee_id) {
    conditions.push('lr.employee_id = ?');
    params.push(employee_id);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (Number(page) - 1) * Number(limit);

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM leave_requests lr
     JOIN employees e ON lr.employee_id = e.employee_id
     ${where}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT ${SELECT_FIELDS}
     FROM leave_requests lr
     JOIN employees e ON lr.employee_id = e.employee_id
     ${where}
     ORDER BY lr.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), offset]
  );

  return { leaveRequests: rows, total, page: Number(page), limit: Number(limit) };
}

/**
 * Get own leave requests.
 */
async function getMyLeaveRequests(employeeId, { page = 1, limit = 20, status }) {
  const conditions = ['lr.employee_id = ?'];
  const params = [employeeId];

  if (status) {
    conditions.push('lr.status = ?');
    params.push(status);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const offset = (Number(page) - 1) * Number(limit);

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM leave_requests lr JOIN employees e ON lr.employee_id = e.employee_id ${where}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT ${SELECT_FIELDS}
     FROM leave_requests lr
     JOIN employees e ON lr.employee_id = e.employee_id
     ${where}
     ORDER BY lr.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), offset]
  );

  return { leaveRequests: rows, total, page: Number(page), limit: Number(limit) };
}

/**
 * Create a new leave request.
 * Rules: dates must not overlap with existing approved/pending leaves for the same employee.
 */
async function createLeaveRequest(employeeId, { leave_type, start_date, end_date, reason }) {
  if (new Date(end_date) < new Date(start_date)) {
    const err = new Error('end_date must be on or after start_date');
    err.status = 400;
    throw err;
  }

  // Overlap check (pending + approved)
  const [overlap] = await pool.query(
    `SELECT leave_id FROM leave_requests
     WHERE employee_id = ?
       AND status IN ('pending','approved')
       AND start_date <= ?
       AND end_date   >= ?`,
    [employeeId, end_date, start_date]
  );
  if (overlap.length > 0) {
    const err = new Error('Leave dates overlap with an existing pending or approved request');
    err.status = 409;
    throw err;
  }

  const leave_id = await generateId('LV', 'leave_requests', 'leave_id');
  await pool.query(
    `INSERT INTO leave_requests (leave_id, employee_id, leave_type, start_date, end_date, reason)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [leave_id, employeeId, leave_type, start_date, end_date, reason || null]
  );

  return getLeaveById(leave_id);
}

/**
 * Update a leave request (owner, status must be pending).
 */
async function updateLeaveRequest(leaveId, ownerId, { leave_type, start_date, end_date, reason }) {
  const leave = await getLeaveById(leaveId);

  if (leave.employee_id !== ownerId) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
  if (leave.status !== 'pending') {
    const err = new Error('Only pending requests can be edited');
    err.status = 400;
    throw err;
  }

  const newStart = start_date || leave.start_date;
  const newEnd = end_date || leave.end_date;

  if (new Date(newEnd) < new Date(newStart)) {
    const err = new Error('end_date must be on or after start_date');
    err.status = 400;
    throw err;
  }

  // Overlap check excluding self
  const [overlap] = await pool.query(
    `SELECT leave_id FROM leave_requests
     WHERE employee_id = ?
       AND status IN ('pending','approved')
       AND leave_id != ?
       AND start_date <= ?
       AND end_date   >= ?`,
    [ownerId, leaveId, newEnd, newStart]
  );
  if (overlap.length > 0) {
    const err = new Error('Leave dates overlap with an existing pending or approved request');
    err.status = 409;
    throw err;
  }

  await pool.query(
    `UPDATE leave_requests
     SET leave_type = ?, start_date = ?, end_date = ?, reason = ?
     WHERE leave_id = ?`,
    [leave_type || leave.leave_type, newStart, newEnd, reason !== undefined ? reason : leave.reason, leaveId]
  );

  return getLeaveById(leaveId);
}

/**
 * Cancel a leave request (owner, status must be pending).
 */
async function cancelLeaveRequest(leaveId, ownerId) {
  const leave = await getLeaveById(leaveId);

  if (leave.employee_id !== ownerId) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
  if (leave.status !== 'pending') {
    const err = new Error('Only pending requests can be cancelled');
    err.status = 400;
    throw err;
  }

  await pool.query('UPDATE leave_requests SET status = ? WHERE leave_id = ?', ['cancelled', leaveId]);
  return getLeaveById(leaveId);
}

/**
 * Approve or reject a leave request.
 * Rules: decider must not be the requester (unless admin with explicit allowance).
 */
async function decideLeaveRequest(leaveId, deciderId, { status, comment }) {
  const leave = await getLeaveById(leaveId);

  if (!['approved', 'rejected'].includes(status)) {
    const err = new Error('status must be "approved" or "rejected"');
    err.status = 400;
    throw err;
  }
  if (leave.status !== 'pending') {
    const err = new Error('Only pending requests can be decided');
    err.status = 400;
    throw err;
  }
  if (leave.employee_id === deciderId) {
    const err = new Error('You cannot approve/reject your own leave request');
    err.status = 403;
    throw err;
  }

  await pool.query(
    'UPDATE leave_requests SET status = ?, decided_by = ?, comment = ? WHERE leave_id = ?',
    [status, deciderId, comment || null, leaveId]
  );

  return getLeaveById(leaveId);
}

module.exports = {
  getLeaveById,
  listLeaveRequests,
  getMyLeaveRequests,
  createLeaveRequest,
  updateLeaveRequest,
  cancelLeaveRequest,
  decideLeaveRequest,
};

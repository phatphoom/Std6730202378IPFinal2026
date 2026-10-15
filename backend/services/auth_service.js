const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

/**
 * Verify email + password and return a signed JWT.
 * @param {string} email
 * @param {string} password
 * @returns {{ token: string, user: object }}
 */
async function login(email, password) {
  const [rows] = await pool.query(
    'SELECT employee_id, email, password, role, status FROM employees WHERE email = ?',
    [email]
  );

  if (rows.length === 0) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const emp = rows[0];

  if (emp.status !== 'active') {
    const err = new Error('Account is inactive');
    err.status = 401;
    throw err;
  }

  const match = await bcrypt.compare(password, emp.password);
  if (!match) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const payload = { employee_id: emp.employee_id, email: emp.email, role: emp.role };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });

  const user = await getMe(emp.employee_id);

  return {
    token,
    user,
  };
}

/**
 * Return the current user's profile (without password).
 * @param {string} employeeId
 */
async function getMe(employeeId) {
  const [rows] = await pool.query(
    `SELECT e.employee_id, e.first_name, e.last_name, e.email, e.phone,
            e.department_id, d.name AS department_name,
            e.position, e.salary, e.role, e.status, e.start_date
     FROM employees e
     LEFT JOIN departments d ON e.department_id = d.department_id
     WHERE e.employee_id = ?`,
    [employeeId]
  );
  if (rows.length === 0) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return rows[0];
}

/**
 * Change the caller's own password.
 * @param {string} employeeId
 * @param {string} currentPassword
 * @param {string} newPassword
 */
async function changePassword(employeeId, currentPassword, newPassword) {
  const [rows] = await pool.query(
    'SELECT password FROM employees WHERE employee_id = ?',
    [employeeId]
  );
  if (rows.length === 0) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  const match = await bcrypt.compare(currentPassword, rows[0].password);
  if (!match) {
    const err = new Error('Current password is incorrect');
    err.status = 400;
    throw err;
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE employees SET password = ? WHERE employee_id = ?', [hashed, employeeId]);
}

module.exports = { login, getMe, changePassword };

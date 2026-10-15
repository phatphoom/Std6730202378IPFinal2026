const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { generateId } = require('../utils/generate_id');
const { kmeans1D } = require('../kmeans');

/**
 * Build the SELECT projection for employees (never returns password).
 */
const SELECT_FIELDS = `
  e.employee_id, e.first_name, e.last_name, e.email,
  e.phone, e.department_id, d.name AS department_name,
  e.position, e.salary, e.role, e.status, e.start_date,
  e.created_at, e.updated_at
`;

/**
 * List employees with optional pagination and filters.
 * Managers see only their own department.
 *
 * @param {{ role: string, employee_id: string, department_id?: string }} caller
 * @param {{ page, limit, search, department_id, status }} query
 */
async function listEmployees(caller, { page = 1, limit = 10, search, department_id, status }) {
  const conditions = [];
  const params = [];

  // Managers are scoped to their own department
  if (caller.role === 'manager') {
    const [empRow] = await pool.query(
      'SELECT department_id FROM employees WHERE employee_id = ?',
      [caller.employee_id]
    );
    const managerDeptId = empRow[0]?.department_id;
    if (managerDeptId) {
      conditions.push('e.department_id = ?');
      params.push(managerDeptId);
    } else {
      // Manager without a department sees nobody
      return { employees: [], total: 0, page: Number(page), limit: Number(limit) };
    }
  } else if (department_id) {
    conditions.push('e.department_id = ?');
    params.push(department_id);
  }

  if (search) {
    conditions.push('(e.first_name LIKE ? OR e.last_name LIKE ? OR e.email LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  if (status) {
    conditions.push('e.status = ?');
    params.push(status);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (Number(page) - 1) * Number(limit);

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM employees e ${where}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT ${SELECT_FIELDS}
     FROM employees e
     LEFT JOIN departments d ON e.department_id = d.department_id
     ${where}
     ORDER BY e.employee_id
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), offset]
  );

  return { employees: rows, total, page: Number(page), limit: Number(limit) };
}

/**
 * Get employee by ID. Access: admin, manager (same dept), or owner.
 */
async function getEmployeeById(employeeId) {
  const [rows] = await pool.query(
    `SELECT ${SELECT_FIELDS}
     FROM employees e
     LEFT JOIN departments d ON e.department_id = d.department_id
     WHERE e.employee_id = ?`,
    [employeeId]
  );
  if (rows.length === 0) {
    const err = new Error('Employee not found');
    err.status = 404;
    throw err;
  }
  return rows[0];
}

/**
 * Create a new employee account.
 */
async function createEmployee({
  first_name, last_name, email, password,
  phone, department_id, position, salary, role, start_date,
}) {
  // Unique email check
  const [dup] = await pool.query('SELECT employee_id FROM employees WHERE email = ?', [email]);
  if (dup.length > 0) {
    const err = new Error('Email already exists');
    err.status = 409;
    throw err;
  }

  // Validate department if provided
  if (department_id) {
    const [dept] = await pool.query(
      'SELECT department_id FROM departments WHERE department_id = ?',
      [department_id]
    );
    if (dept.length === 0) {
      const err = new Error('department_id does not reference a valid department');
      err.status = 400;
      throw err;
    }
  }

  const hashed = await bcrypt.hash(password, 10);
  const employee_id = await generateId('EMP', 'employees', 'employee_id');

  await pool.query(
    `INSERT INTO employees
       (employee_id, first_name, last_name, email, password, phone, department_id, position, salary, role, start_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [employee_id, first_name, last_name, email, hashed,
      phone || null, department_id || null, position || null,
      salary !== undefined && salary !== null ? Number(salary) : 0,
      role || 'employee', start_date || null]
  );

  return getEmployeeById(employee_id);
}

/**
 * Update employee fields.
 * Admin can change everything; owner can only change personal fields.
 *
 * @param {string} employeeId
 * @param {object} fields
 * @param {'admin'|'manager'|'employee'} callerRole
 */
async function updateEmployee(employeeId, fields, callerRole) {
  await getEmployeeById(employeeId); // ensure exists

  const allowedForOwner = ['first_name', 'last_name', 'phone'];
  const allowedForAdmin = [...allowedForOwner, 'email', 'department_id', 'position', 'salary', 'role', 'start_date'];

  const allowed = callerRole === 'admin' ? allowedForAdmin : allowedForOwner;
  const setClauses = [];
  const params = [];

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      setClauses.push(`${key} = ?`);
      params.push(fields[key]);
    }
  }

  if (setClauses.length === 0) {
    return getEmployeeById(employeeId);
  }

  // If email is being changed by admin, check uniqueness
  if (fields.email && callerRole === 'admin') {
    const [dup] = await pool.query(
      'SELECT employee_id FROM employees WHERE email = ? AND employee_id != ?',
      [fields.email, employeeId]
    );
    if (dup.length > 0) {
      const err = new Error('Email already exists');
      err.status = 409;
      throw err;
    }
  }

  params.push(employeeId);
  await pool.query(`UPDATE employees SET ${setClauses.join(', ')} WHERE employee_id = ?`, params);
  return getEmployeeById(employeeId);
}

/**
 * Toggle employee status (active / inactive). Admin only.
 */
async function updateEmployeeStatus(employeeId, status) {
  if (!['active', 'inactive'].includes(status)) {
    const err = new Error('status must be "active" or "inactive"');
    err.status = 400;
    throw err;
  }
  await getEmployeeById(employeeId);
  await pool.query('UPDATE employees SET status = ? WHERE employee_id = ?', [status, employeeId]);
  return getEmployeeById(employeeId);
}

/**
 * Calculate salary clusters using 1D K-Means (k=3)
 * @returns {Promise<Array<{ group: string, centroid: number, count: number }>>}
 */
async function getSalaryClusters() {
  const [rows] = await pool.query(
    'SELECT salary FROM employees WHERE status = "active" AND salary IS NOT NULL'
  );
  const salaries = rows.map((r) => Number(r.salary));
  const clusters = kmeans1D(salaries, 3);
  return clusters;
}

module.exports = {
  listEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  getSalaryClusters,
};

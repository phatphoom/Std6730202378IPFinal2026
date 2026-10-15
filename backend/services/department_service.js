const pool = require('../config/db');
const { generateId } = require('../utils/generate_id');

/**
 * List all departments.
 */
async function listDepartments() {
  const [rows] = await pool.query(
    `SELECT d.department_id, d.name, d.code, d.manager_employee_id,
            CONCAT(e.first_name, ' ', e.last_name) AS manager_name,
            d.created_at, d.updated_at
     FROM departments d
     LEFT JOIN employees e ON d.manager_employee_id = e.employee_id
     ORDER BY d.name`
  );
  return rows;
}

/**
 * Create a department.
 */
async function createDepartment({ name, code, manager_employee_id }) {
  // Unique check
  const [dup] = await pool.query(
    'SELECT department_id FROM departments WHERE name = ? OR code = ?',
    [name, code]
  );
  if (dup.length > 0) {
    const err = new Error('Department name or code already exists');
    err.status = 409;
    throw err;
  }

  // Validate manager if provided
  if (manager_employee_id) {
    const [emp] = await pool.query(
      'SELECT employee_id FROM employees WHERE employee_id = ?',
      [manager_employee_id]
    );
    if (emp.length === 0) {
      const err = new Error('manager_employee_id does not reference a valid employee');
      err.status = 400;
      throw err;
    }
  }

  const department_id = await generateId('DEP', 'departments', 'department_id');
  await pool.query(
    'INSERT INTO departments (department_id, name, code, manager_employee_id) VALUES (?, ?, ?, ?)',
    [department_id, name, code, manager_employee_id || null]
  );

  return getDepartmentById(department_id);
}

/**
 * Get a single department by ID.
 */
async function getDepartmentById(department_id) {
  const [rows] = await pool.query(
    `SELECT d.department_id, d.name, d.code, d.manager_employee_id,
            CONCAT(e.first_name, ' ', e.last_name) AS manager_name,
            d.created_at, d.updated_at
     FROM departments d
     LEFT JOIN employees e ON d.manager_employee_id = e.employee_id
     WHERE d.department_id = ?`,
    [department_id]
  );
  if (rows.length === 0) {
    const err = new Error('Department not found');
    err.status = 404;
    throw err;
  }
  return rows[0];
}

/**
 * Update a department.
 */
async function updateDepartment(department_id, { name, code, manager_employee_id }) {
  // Existence check
  await getDepartmentById(department_id);

  // Unique check (excluding self)
  const [dup] = await pool.query(
    'SELECT department_id FROM departments WHERE (name = ? OR code = ?) AND department_id != ?',
    [name, code, department_id]
  );
  if (dup.length > 0) {
    const err = new Error('Department name or code already exists');
    err.status = 409;
    throw err;
  }

  if (manager_employee_id) {
    const [emp] = await pool.query(
      'SELECT employee_id FROM employees WHERE employee_id = ?',
      [manager_employee_id]
    );
    if (emp.length === 0) {
      const err = new Error('manager_employee_id does not reference a valid employee');
      err.status = 400;
      throw err;
    }
  }

  await pool.query(
    'UPDATE departments SET name = ?, code = ?, manager_employee_id = ? WHERE department_id = ?',
    [name, code, manager_employee_id || null, department_id]
  );

  return getDepartmentById(department_id);
}

/**
 * Delete a department — only when no employees are assigned.
 */
async function deleteDepartment(department_id) {
  await getDepartmentById(department_id);

  const [empRows] = await pool.query(
    'SELECT employee_id FROM employees WHERE department_id = ? LIMIT 1',
    [department_id]
  );
  if (empRows.length > 0) {
    const err = new Error('Cannot delete a department that still has employees');
    err.status = 400;
    throw err;
  }

  await pool.query('DELETE FROM departments WHERE department_id = ?', [department_id]);
}

module.exports = { listDepartments, createDepartment, getDepartmentById, updateDepartment, deleteDepartment };

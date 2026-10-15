const pool = require('../config/db');

/**
 * Generate a zero-padded sequential ID for a given prefix and table.
 *
 * Examples:
 *   generateId('DEP', 'departments', 'department_id') -> 'DEP-0001'
 *   generateId('EMP', 'employees',   'employee_id')   -> 'EMP-0001'
 *
 * @param {string} prefix   - Short uppercase prefix (e.g. 'EMP')
 * @param {string} table    - Table name to query
 * @param {string} column   - Primary-key column name
 * @returns {Promise<string>}
 */
async function generateId(prefix, table, column) {
  // Find the highest existing numeric suffix
  const [rows] = await pool.query(
    `SELECT ${column} FROM \`${table}\` WHERE ${column} LIKE ? ORDER BY ${column} DESC LIMIT 1`,
    [`${prefix}-%`]
  );

  let nextNum = 1;
  if (rows.length > 0) {
    const lastId = rows[0][column]; // e.g. 'EMP-0042'
    const parts = lastId.split('-');
    nextNum = parseInt(parts[1], 10) + 1;
  }

  return `${prefix}-${String(nextNum).padStart(4, '0')}`;
}

module.exports = { generateId };

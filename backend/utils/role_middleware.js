/**
 * Role-based access control middleware factory.
 *
 * Usage:
 *   router.get('/', authMiddleware, requireRoles('admin', 'manager'), controller.list);
 *
 * @param {...string} roles - Allowed roles (e.g. 'admin', 'manager', 'employee')
 * @returns {Function} Express middleware
 */
function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
    }
    next();
  };
}

module.exports = requireRoles;

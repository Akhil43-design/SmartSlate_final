function requireRole(allowedRoles = []) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required. Please log in.' });
        }

        const userRole = req.user.role;
        if (!allowedRoles.includes(userRole)) {
            console.warn(`[RBAC] Denied user ${req.user.email} (${userRole}) access to ${req.originalUrl}`);
            return res.status(403).json({ error: 'Forbidden: Access denied for your user role.' });
        }

        next();
    };
}

module.exports = { requireRole };

// role / authorization
export function requireRole(role) {
	return function (req, res, next) {
		if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

		if (req.user.role !== role)
			return res.status(403).json({ message: 'Forbidden: insufficient role' });

		return next();
	};
}

// require self or admin
export function requireSelfOrAdmin(paramIdField = 'id') {
	return function (req, res, next) {
		if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

		// target ID
		const targetId = req.params[paramIdField];
		if (req.user.role === 'admin' || req.user._id?.toString() === targetId) return next();

		return res.status(403).json({ message: 'Forbidden: not allowed' });
	};
}

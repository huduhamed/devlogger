import jwt from 'jsonwebtoken';

// internal imports
import User from '../models/User.js';

// protect
export const protect = async (req, res, next) => {
	let token;
	if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
		try {
			token = req.headers.authorization.split(' ')[1]; // <-- removed await
			const decoded = jwt.verify(token, process.env.JWT_SECRET);
			req.user = await User.findById(decoded.id).select('');
			return next();
		} catch (error) {
			return res.status(401).json({ message: 'not authorized' });
		}
	}
	// if no token
	return res.status(401).json({ message: 'no token provided' });
};

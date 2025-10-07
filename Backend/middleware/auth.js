import jwt from 'jsonwebtoken';

// internal imports
import User from '../models/User.js';
import { JWT_SECRET } from '../config/env.js';

// auth middleware
async function authorize(req, res, next) {
	try {
		let token;

		// support Authorization header "Bearer <token>" and cookie named "token"
		if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
			token = req.headers.authorization.split(' ')[1];
		} else if (req.cookies && req.cookies.token) {
			token = req.cookies.token;
		}

		// if no token
		if (!token) {
			return res.status(401).json({ message: 'Unauthorized: token missing' });
		}

		// else verify
		const decoded = jwt.verify(token, JWT_SECRET);
		const userId = decoded.userId || decoded.id || decoded._id;
		if (!userId) {
			return res.status(401).json({ message: 'Unauthorized: invalid token' });
		}

		const user = await User.findById(userId).select('-password -passwordChangedAt');
		if (!user) {
			return res.status(401).json({ message: 'Unauthorized: user not found' });
		}

		// Token invalidation: if passwordChangedAt exists and token issued before it, reject
		if (user.passwordChangedAt && decoded.iat) {
			const changedAt = Math.floor(new Date(user.passwordChangedAt).getTime() / 1000);
			if (decoded.iat < changedAt) {
				return res
					.status(401)
					.json({ message: 'Unauthorized: password changed, please log in again.' });
			}
		}

		req.user = user;
		return next();
	} catch (error) {
		return res.status(401).json({ message: 'Unauthorized', error: error.message });
	}
}

export default authorize;

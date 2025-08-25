import jwt from 'jsonwebtoken';

// internal imports
import User from '../models/User.js';
import { JWT_SECRET } from '../config/env.js';

// protect
async function authorize(req, res, next) {
	try {
		let token;

		// if token exists
		if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
			token = req.headers.authorization.split(' ')[1];
		}

		// if not token
		if (!token) {
			res.status(401).json({ message: 'unauthorize' });
		}

		// verify token existance
		const decoded = jwt.verify(token, JWT_SECRET);

		// search user iN DB
		const user = await User.findById(decoded.userId);

		// if user doesn't exit in DB
		if (!user) {
			return res.status(401).json({ message: 'unauthorize' });
		}

		// attach user to req
		req.user = user;

		next();
	} catch (error) {
		res.status(401).json({
			message: 'unavailable',
			error: error.message,
		});
	}
}

export default authorize;

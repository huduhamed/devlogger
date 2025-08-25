import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// internal imports
import User from '../models/User.js';
import { JWT_EXPIRES_IN, JWT_SECRET } from '../config/env.js';

// register user
export async function signUp(req, res, next) {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		// create new user
		const { name, email, password } = req.body;

		// throw error if req. body is empty
		if (!name || !email || !password) {
			await session.abortTransaction();
			session.endSession();
			return res.status(400).json({ message: 'name, email and password are required' });
		}

		// check existing user
		const existing = await User.findOne({ email }).session(session);
		if (existing) {
			await session.abortTransaction();
			session.endSession();
			return res.status(409).json({ message: 'email already in use' });
		}

		// hash password and create user
		const hashed = await bcrypt.hash(password, 10);
		const newUser = new User({ name, email, password: hashed });
		await newUser.save({ session });

		await session.commitTransaction();
		session.endSession();

		// sign token with userId to match middleware (authorize looks for decoded.userId)
		const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

		return res.status(201).json({
			user: { id: newUser._id, name: newUser.name, email: newUser.email },
			token,
		});
	} catch (error) {
		await session.abortTransaction();
		session.endSession();
		next(error);
	}
}

// login user
export const loginUser = async (req, res) => {
	try {
		// sign in user
		const { email, password } = req.body;
		if (!email || !password)
			return res.status(400).json({ message: 'email and password required' });

		// cross check credentials
		const user = await User.findOne({ email });
		if (!user) return res.status(401).json({ message: 'invalid credentials' });

		// match credentials
		const match = await bcrypt.compare(password, user.password);
		if (!match) return res.status(401).json({ message: 'invalid credentials' });

		const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

		return res.status(200).json({
			user: { id: user._id, name: user.name, email: user.email },
			token,
		});
	} catch (error) {
		return res.status(500).json({ message: 'server error', error: error.message });
	}
};

// sign out logic
export async function signOut(req, res, next) {
	try {
		const authHeader = req.headers.authorization;
		if (authHeader && authHeader.startsWith('Bearer ')) {
			const token = authHeader.split(' ')[1];

			// decode token to get expiry
			const decoded = jwt.decode(token);
			const expiry =
				decoded && decoded.exp ? new Date(decoded.exp * 1000) : new Date(dayjs + 3600 * 1000);

			// save token to blacklist
			await BlacklistToken.create({ token, expiry });
		}

		res.status(200).json({
			success: true,
			message: 'User successfully signed out',
		});
	} catch (error) {
		next(error);
	}
}

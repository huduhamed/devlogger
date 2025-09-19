import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// internal imports
import User from '../models/User.js';
import { JWT_EXPIRES_IN, JWT_SECRET } from '../config/env.js';

// register user
export async function signUp(req, res, next) {
	try {
		const { name, email, password } = req.body;
		if (!name || !email || !password) {
			return res.status(400).json({ message: 'Name, Email and Password are required' });
		}
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.status(409).json({ message: 'email already in use, please sign-in' });
		}
		// hash password
		const hashed = await bcrypt.hash(password, 10);
		const newUser = await User.create({ name, email, password: hashed });
		const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

		return res.status(201).json({
			success: true,
			message: 'new user created successfullly',
			token,
			user: newUser,
		});
	} catch (error) {
		return next(error);
	}
}

// signin user
export async function signIn(req, res) {
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

		const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

		// return
		return res.status(200).json({
			success: true,
			message: 'user signed in',
			token,
			user,
		});
	} catch (error) {
		return res.status(500).json({ message: 'Something went worng, please try again later.' });
	}
}

// sign out logic
export async function signOut(req, res) {
	// Stateless JWT logout: client just discards token. Placeholder for future blacklist logic.
	return res.status(200).json({ success: true, message: 'User successfully signed out' });
}

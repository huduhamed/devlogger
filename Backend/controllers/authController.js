import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// internal imports
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import { JWT_EXPIRES_IN, JWT_SECRET } from '../config/env.js';
import { verifyGoogleToken } from '../config/google.js';

// google Sign-In
export async function googleSignIn(req, res, next) {
	try {
		const { idToken } = req.body;
		if (!idToken) {
			return res.status(400).json({ message: 'Google ID token required' });
		}
		// verify token and extract payload
		let payload;
		try {
			payload = await verifyGoogleToken(idToken);
		} catch (err) {
			return res.status(401).json({ message: 'Invalid Google token' });
		}
		// extract payload
		const { email, name, picture, sub: googleId } = payload;
		if (!email) {
			return res.status(400).json({ message: 'Google account must have an email' });
		}
		let user = await User.findOne({ email });
		let isNewUser = false;

		if (!user) {
			// create user and organization for first-time google login
			user = await User.create({
				name: name || 'Google User',
				email,
				password: googleId,
				avatarUrl: picture || '',
			});

			// create organization
			const orgBase = (name || 'google-user')
				.trim()
				.toLowerCase()
				.replace(/[^a-z0-9\s-]/g, '')
				.replace(/\s+/g, '-');
			let slugCandidate = orgBase || `org-${user._id.toString().slice(-6)}`;

			let counter = 1;
			while (await Organization.findOne({ slug: slugCandidate })) {
				slugCandidate = `${orgBase}-${counter++}`;
			}
			const organization = await Organization.create({
				name: `${name || 'Google User'}'s Org`,
				slug: slugCandidate,
				owner: user._id,
				members: [{ user: user._id, role: 'owner' }],
			});
			user.organization = organization._id;
			await user.save();
			isNewUser = true;
		}

		// issue JWT
		const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
		let org = null;

		if (isNewUser) {
			org = await Organization.findById(user.organization);
		}
		return res.status(200).json({
			success: true,
			message: isNewUser ? 'Google user created and signed in' : 'Google user signed in',
			token,
			user,
			organization: org,
		});
	} catch (error) {
		return next(error);
	}
}

// development-only: allow test sign-in without verifying Google token
export async function googleTestSignIn(req, res, next) {
	try {
		const { email, name, picture } = req.body;
		if (!email) return res.status(400).json({ message: 'email required for test sign-in' });

		let user = await User.findOne({ email });
		let isNewUser = false;

		if (!user) {
			// create user and organization for first-time google login
			const fakeId = `test-${email}`;
			user = await User.create({
				name: name || 'Test Google User',
				email,
				password: fakeId,
				avatarUrl: picture || '',
			});

			// create organization
			const orgBase = (name || 'test-google-user')
				.trim()
				.toLowerCase()
				.replace(/[^a-z0-9\s-]/g, '')
				.replace(/\s+/g, '-');
			let slugCandidate = orgBase || `org-${user._id.toString().slice(-6)}`;

			let counter = 1;
			while (await Organization.findOne({ slug: slugCandidate })) {
				slugCandidate = `${orgBase}-${counter++}`;
			}
			const organization = await Organization.create({
				name: `${name || 'Test Google User'}'s Org`,
				slug: slugCandidate,
				owner: user._id,
				members: [{ user: user._id, role: 'owner' }],
			});
			user.organization = organization._id;
			await user.save();
			isNewUser = true;
		}

		// issue JWT
		const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
		let org = null;

		if (isNewUser) {
			org = await Organization.findById(user.organization);
		}
		return res.status(200).json({
			success: true,
			message: isNewUser ? 'Test Google user created and signed in' : 'Test Google user signed in',
			token,
			user,
			organization: org,
		});
	} catch (error) {
		return next(error);
	}
}

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
		// create user first (no organization yet)
		let newUser = await User.create({ name, email, password: hashed });

		const orgBase = name
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-');
		let slugCandidate = orgBase || `org-${newUser._id.toString().slice(-6)}`;

		let counter = 1;
		while (await Organization.findOne({ slug: slugCandidate })) {
			slugCandidate = `${orgBase}-${counter++}`;
		}

		// create organization with user as owner & member
		const organization = await Organization.create({
			name: `${name}'s Org`,
			slug: slugCandidate,
			owner: newUser._id,
			members: [{ user: newUser._id, role: 'owner' }],
		});

		// update user with organization reference
		newUser.organization = organization._id;
		await newUser.save();

		const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

		return res.status(201).json({
			success: true,
			message: 'new user & organization created successfully',
			token,
			user: newUser,
			organization,
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
	// stateless JWT logout: client just discards token.
	return res.status(200).json({ success: true, message: 'User successfully signed out' });
}

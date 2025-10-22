import bcrypt from 'bcryptjs';

// internal imports
import User from '../models/User.js';

// fetch all users from db
export async function getUsers(req, res, next) {
	try {
		// find users
		const users = await User.find().select('-password');

		res.status(200).json({
			success: true,
			data: users,
		});
	} catch (error) {
		next(error);
	}
}

// fetch single user from db
export async function getUser(req, res, next) {
	try {
		// find a single user
		const user = await User.findById(req.params.id).select('-password');

		// check if user exists
		if (!user) {
			const err = new Error('user not found');
			err.statusCode = 404;
			return next(err);
		}

		res.status(200).json({
			success: true,
			data: user,
		});
	} catch (error) {
		next(error);
	}
}

// create a user
export async function createUser(req, res, next) {
	try {
		const { password, ...rest } = req.body;
		let hashed = password;
		if (password) {
			hashed = await bcrypt.hash(password, 10);
		}

		const user = new User({ ...rest, password: hashed });
		await user.save();

		const safeUser = user.toObject();
		delete safeUser.password;

		res.status(201).json({
			success: true,
			message: 'New user successfully created',
			data: safeUser,
		});
	} catch (error) {
		const err = new Error('failed to create user');
		err.statusCode = 400;
		err.cause = error;

		return next(err);
	}
}

// update user
export async function updateUser(req, res, next) {
	try {
		const update = { ...req.body };
		if (update.password) {
			update.password = await bcrypt.hash(update.password, 10);
			update.passwordChangedAt = new Date();
		}

		const user = await User.findByIdAndUpdate(req.params.id, update, {
			new: true,
			runValidators: true,
		}).select('-password');

		// if no user
		if (!user) {
			const err = new Error('user not found');
			err.statusCode = 404;
			return next(err);
		}

		res.status(200).json({ success: true, data: user });
	} catch (error) {
		const err = new Error('failed to update user');
		err.statusCode = 400;
		err.cause = error;

		return next(err);
	}
}

// delete user
export async function deleteUser(req, res, next) {
	try {
		const user = await User.findByIdAndDelete(req.params.id);

		if (!user) {
			const err = new Error('cannot find user');
			err.statusCode = 404;

			return next(err);
		}
		res.status(200).json({ success: true, message: 'user deleted successfully' });
	} catch (error) {
		const err = new Error('failed to delete user');
		err.statusCode = 400;
		err.cause = error;

		return next(err);
	}
}

// update profile settings
export async function updateSelf(req, res, next) {
	try {
		const userId = req.user?._id;
		if (!userId) {
			console.error('Avatar upload failed: Not authenticated');
			return res.status(401).json({ message: 'Not authenticated' });
		}

		const allowed = ['name', 'email', 'password', 'avatarUrl'];
		const update = {};

		for (const key of allowed) {
			if (req.body[key] != null && req.body[key] !== '') update[key] = req.body[key];
		}
		if (update.avatarUrl) {
			console.log('Avatar upload attempt for user:', userId, 'Size:', update.avatarUrl.length);
		}
		if (update.password) {
			update.password = await bcrypt.hash(update.password, 10);
			update.passwordChangedAt = new Date();
		}

		const user = await User.findByIdAndUpdate(userId, update, {
			new: true,
			runValidators: true,
		}).select('-password -passwordChangedAt');
		if (!user) {
			console.error('Avatar upload failed: User not found', userId);
			return res.status(404).json({ message: 'User not found' });
		}

		res.json({ success: true, data: user });
	} catch (error) {
		console.error('Avatar upload error:', error);
		next(error);
	}
}

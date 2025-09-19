// internal imports
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

// fetch all users from database
export async function getUsers(req, res, next) {
	try {
		('		// find users without password field');
		const users = await User.find().select('-password');

		// return json
		res.status(200).json({
			success: true,
			data: users,
		});
	} catch (error) {
		next(error);
	}
}

// fetch single user from database
export async function getUser(req, res, next) {
	try {
		// find a user
		const user = await User.findById(req.params.id).select('-password');

		// check if no user
		if (!user) {
			const err = new Error('user not found');
			err.statusCode = 404;
			return next(err);
		}

		// return json
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

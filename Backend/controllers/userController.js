// internal imports
import User from '../models/User.js';

// fetch all users from database
export async function getUsers(req, res, next) {
	try {
		// find users
		const users = await User.find();

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
			const error = new error('user not found');
			error.statusCode(404);
			throw error;
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
export async function createUser(req, res) {
	try {
		const user = new User(req.body);
		await user.save();

		res.status(201).json({
			success: true,
			message: 'New user successfully created',
		});
	} catch (error) {
		const err = new Error('failed to create user', { cause: error });
		err.statusCode = 400;
		throw err;
	}
}

// update user
export async function updateUser(req, res) {
	try {
		const user = await User.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true,
		});

		// if no user
		if (!user) {
			const error = new Error('user not found');
			error.statusCode = 404;
			throw error;
		}

		// return
		res.status(200).json({
			success: true,
			data: user,
		});
	} catch (error) {
		const err = new Error('failed to update user', { cause: error });
		err.statusCode = 400;
		throw err;
	}
}

// delete user
export async function deleteUser(req, res) {
	try {
		// find user in DB
		const user = await User.findByIdAndDelete(req.params.id);

		// if user not found
		if (!user) {
			const error = new Error('cannot find user');
			error.statusCode = 404;
			throw error;
		}

		// return
		res.status(200).json({
			success: true,
			message: 'user deleted successfully',
		});
	} catch (error) {
		const err = new Error('failed to delete user', { cause: error });
		err.statusCode = 400;
		throw err;
	}
}

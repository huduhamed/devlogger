// internal imports
import Log from '../models/Log.js';

// get logs
export async function getLogs(req, res, next) {
	try {
		// fetch userId
		const userId = req.user && (req.user._id || req.user.id);
		// get logs, most recent first
		const logs = await Log.find({ user: userId }).sort({ createdAt: -1 });

		// return
		return res.status(200).json({
			success: true,
			data: logs,
		});
	} catch (error) {
		next(error);
	}
}

// get single log
export async function getLog(req, res, next) {
	try {
		// get id
		const { id } = req.params;

		// get log from DB
		const log = await Log.findById(id);
		if (!log) return res.status(404).json({ message: 'Log not found' });

		// authenticate user against log
		const userId = req.user && (req.user._id || req.user.id);
		if (log.user.toString() !== userId.toString()) {
			return res.status(403).json({ message: 'Forbidden: not the owner' });
		}

		return res.status(200).json({
			success: true,
			data: log,
		});
	} catch (error) {
		next(error);
	}
}

// create new log
export async function createLog(req, res, next) {
	try {
		// destructure & create log
		const { title, description, tags } = req.body;
		if (!title)
			return res.status(400).json({
				message: 'title is required',
			});

		// tags
		let tagsArray = [];
		if (Array.isArray(tags)) tagsArray = tags;
		else if (typeof tags === 'string') {
			tagsArray = tags
				.split(',')
				.map((t) => t.trim())
				.filter(Boolean);
		}

		// map user, then create log
		const userId = req.user && (req.user._id || req.user.id);
		const log = await Log.create({ title, description, tags: tagsArray, user: userId });

		return res.status(201).json({
			success: true,
			message: 'new log created successfully',
			data: log,
		});
	} catch (error) {
		next(error);
	}
}

// update a log => only owner can update
export async function updateLog(req, res, next) {
	try {
		// fetch id from params
		const { id } = req.params;

		// find log in DB
		const log = await Log.findById(id);
		if (!log) return res.status(404).json({ message: 'Log not found' });

		// authenticate user
		const userId = req.user && (req.user._id || req.user.id);
		if (log.user.toString() !== userId.toString()) {
			return res.status(403).json({ message: 'Forbidden: not the owner' });
		}

		const updateData = { ...req.body };
		if (updateData.tags && typeof updateData.tags === 'string') {
			updateData.tags = updateData.tags
				.split(',')
				.map((t) => t.trim())
				.filter(Boolean);
		}

		// finally allow to update
		const updated = await Log.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

		return res.status(200).json({
			success: true,
			message: 'log updated ...',
			data: updated,
		});
	} catch (error) {
		const err = new Error('failed to update log', { cause: error });
		err.statusCode = 400;
		throw err;
	}
}

// delete a log => only owner can delete
export async function deleteLog(req, res, next) {
	try {
		const { id } = req.params;

		const log = await Log.findById(id);
		if (!log) return res.status(404).json({ message: 'log not found' });

		// authenticate user to match log
		const userId = req.user && (req.user._id || req.user.id);
		if (log.user.toString() !== userId.toString()) {
			return res.status(403).json({ message: 'Forbidden: not the owner' });
		}

		await log.deleteOne();
		return res.status(200).json({
			success: true,
			message: 'log deleted',
		});
	} catch (error) {
		const err = new Error('failed to delete log', { cause: error });
		err.statusCode = 400;
		throw err;
	}
}

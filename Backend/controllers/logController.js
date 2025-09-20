// internal imports
import Log from '../models/Log.js';

// all logs, regardless of user
export async function getAllLogs(req, res, next) {
	try {
		// restrict to organization scope if present on user (multi-tenancy)
		const orgId = req.user && req.user.organization;
		const query = orgId ? { organization: orgId } : {};
		const logs = await Log.find(query).sort({ createdAt: -1 }).populate('user', 'name email');
		return res.status(200).json({ success: true, data: logs });
	} catch (error) {
		next(error);
	}
}

// get logs
export async function getLogs(req, res, next) {
	try {
		// fetch org + user
		const userId = req.user && (req.user._id || req.user.id);
		const orgId = req.user && req.user.organization;
		// scope by organization primarily; optionally by user if no org yet (legacy)
		const baseQuery = orgId ? { organization: orgId } : { user: userId };
		const logs = await Log.find(baseQuery).sort({ createdAt: -1 });

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

		// get log from DB (ensure organization scoping)
		const log = await Log.findById(id);
		if (!log) return res.status(404).json({ message: 'Log not found' });

		// authenticate user against log (org scoped OR ownership fallback)
		const userId = req.user && (req.user._id || req.user.id);
		const orgId = req.user && req.user.organization;
		const owns = log.user.toString() === userId.toString();
		const sameOrg = orgId && log.organization && log.organization.toString() === orgId.toString();
		if (!owns && !sameOrg) {
			return res.status(403).json({ message: 'Forbidden: outside your organization' });
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
		const { title, description, tags, level } = req.body;
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
		const orgId = req.user && req.user.organization;
		const log = await Log.create({
			title,
			description,
			level,
			tags: tagsArray,
			user: userId,
			organization: orgId,
		});

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

		// authenticate user (ownership or same organization)
		const userId = req.user && (req.user._id || req.user.id);
		const orgId = req.user && req.user.organization;
		const owns = log.user.toString() === userId.toString();
		const sameOrg = orgId && log.organization && log.organization.toString() === orgId.toString();
		if (!owns && !sameOrg) {
			return res.status(403).json({ message: 'Forbidden: outside your organization' });
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
		const err = new Error('failed to update log');
		err.statusCode = 400;
		err.cause = error;

		return next(err);
	}
}

// delete a log => only owner can delete
export async function deleteLog(req, res, next) {
	try {
		const { id } = req.params;

		const log = await Log.findById(id);
		if (!log) return res.status(404).json({ message: 'log not found' });

		// authenticate user (ownership or org membership)
		const userId = req.user && (req.user._id || req.user.id);
		const orgId = req.user && req.user.organization;
		const owns = log.user.toString() === userId.toString();
		const sameOrg = orgId && log.organization && log.organization.toString() === orgId.toString();
		if (!owns && !sameOrg) {
			return res.status(403).json({ message: 'Forbidden: outside your organization' });
		}

		await log.deleteOne();
		return res.status(200).json({
			success: true,
			message: 'log deleted',
		});
	} catch (error) {
		const err = new Error('failed to delete log');
		err.statusCode = 400;
		err.cause = error;

		return next(err);
	}
}

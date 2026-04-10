// internal imports
import Log from '../models/Log.js';
import Organization from '../models/Organization.js';
import { getPlanConfig } from '../config/plans.js';

// current month key
function currentMonthKey() {
	const d = new Date();
	return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

async function reserveOrganizationLogQuota(orgId) {
	if (!orgId) return { ok: false, reason: 'Organization missing for user' };

	const org = await Organization.findById(orgId).select('_id plan limits');
	if (!org) return { ok: false, reason: 'Organization not found' };

	const monthKey = currentMonthKey();
	await Organization.updateOne(
		{ _id: orgId, 'usage.month': { $ne: monthKey } },
		{ $set: { 'usage.month': monthKey, 'usage.logCount': 0 } },
	);

	const planCfg = getPlanConfig(org.plan);
	const limit = org.limits?.logsPerMonth ?? planCfg.logsPerMonth;

	const updated = await Organization.findOneAndUpdate(
		{ _id: orgId, 'usage.month': monthKey, 'usage.logCount': { $lt: limit } },
		{ $inc: { 'usage.logCount': 1 } },
		{ new: true, projection: '_id usage' },
	);

	if (!updated) return { ok: false, reason: 'Monthly log quota exceeded. Upgrade plan.' };
	return { ok: true, monthKey };
}

async function releaseOrganizationLogQuota(orgId, monthKey) {
	if (!orgId || !monthKey) return;
	await Organization.updateOne(
		{ _id: orgId, 'usage.month': monthKey, 'usage.logCount': { $gt: 0 } },
		{ $inc: { 'usage.logCount': -1 } },
	);
}

// all logs, regardless of user
export async function getAllLogs(req, res, next) {
	try {
		// restrict to organization scope if present on user (multi-tenancy)
		const orgId = req.user && req.user.organization;
		const query = orgId ? { organization: orgId } : {};

		// filtering
		const { level, tag, q, searchMode } = req.query;
		if (level) query.level = level;
		if (tag) query.tags = tag;
		let projection = null;
		let sort = { createdAt: -1 };

		if (q) {
			if (searchMode === 'text') {
				query.$text = { $search: q };
				projection = { score: { $meta: 'textScore' } };
				sort = { score: { $meta: 'textScore' } };
			} else {
				query.$or = [
					{ title: { $regex: q, $options: 'i' } },
					{ description: { $regex: q, $options: 'i' } },
				];
			}
		}

		// pagination
		const page = Math.max(parseInt(req.query.page || '1', 10), 1);
		const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
		const skip = (page - 1) * limit;

		const findChain = (projection ? Log.find(query, projection) : Log.find(query))
			.sort(sort)
			.skip(skip)
			.limit(limit)
			.populate('user', 'name email')
			.lean();
		const [logs, total] = await Promise.all([findChain, Log.countDocuments(query)]);

		return res.status(200).json({
			success: true,
			data: logs,
			pagination: {
				page,
				limit,
				total,
				pages: Math.ceil(total / limit) || 1,
			},
		});
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
		// scope by organization primarily
		const baseQuery = orgId ? { organization: orgId } : { user: userId };

		// filtering
		const query = { ...baseQuery };
		const { level, tag, q, searchMode } = req.query;
		if (level) query.level = level;
		if (tag) query.tags = tag;
		let projection = null;
		let sort = { createdAt: -1 };

		if (q) {
			if (searchMode === 'text') {
				query.$text = { $search: q };
				projection = { score: { $meta: 'textScore' } };
				sort = { score: { $meta: 'textScore' } };
			} else {
				query.$or = [
					{ title: { $regex: q, $options: 'i' } },
					{ description: { $regex: q, $options: 'i' } },
				];
			}
		}

		// pagination
		const page = Math.max(parseInt(req.query.page || '1', 10), 1);
		const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
		const skip = (page - 1) * limit;

		const findChain = (projection ? Log.find(query, projection) : Log.find(query))
			.sort(sort)
			.skip(skip)
			.limit(limit)
			.lean();
		const [logs, total] = await Promise.all([findChain, Log.countDocuments(query)]);

		// return
		return res.status(200).json({
			success: true,
			data: logs,
			pagination: {
				page,
				limit,
				total,
				pages: Math.ceil(total / limit) || 1,
			},
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
		const quotaReservation = await reserveOrganizationLogQuota(orgId);
		if (!quotaReservation.ok) {
			const status = quotaReservation.reason === 'Organization not found' ? 404 : 403;
			return res.status(status).json({ message: quotaReservation.reason });
		}

		let log;
		try {
			log = await Log.create({
				title,
				description,
				level,
				tags: tagsArray,
				user: userId,
				organization: orgId,
			});
		} catch (err) {
			await releaseOrganizationLogQuota(orgId, quotaReservation.monthKey);
			throw err;
		}

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

		// mutate permissions: only the log owner can edit
		const userId = req.user && (req.user._id || req.user.id);
		const owns = log.user.toString() === userId.toString();
		if (!owns) {
			return res.status(403).json({ message: 'Forbidden: only the log owner can modify this log' });
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

		// mutate permissions: only the log owner can delete
		const userId = req.user && (req.user._id || req.user.id);
		const owns = log.user.toString() === userId.toString();
		if (!owns) {
			return res.status(403).json({ message: 'Forbidden: only the log owner can delete this log' });
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

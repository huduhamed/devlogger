// Create organization for user if none exists
export async function createOrganization(req, res, next) {
	try {
		const userId = req.user?._id;
		if (!userId) return res.status(401).json({ message: 'Unauthorized' });
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ message: 'User not found' });
		if (user.organization) {
			return res.status(400).json({ message: 'User already has an organization' });
		}
		const { name } = req.body;
		if (!name || typeof name !== 'string' || name.trim().length < 2) {
			return res.status(400).json({ message: 'Organization name required' });
		}
		// slugify name
		const orgBase = name.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
		let slugCandidate = orgBase || `org-${userId.toString().slice(-6)}`;
		let counter = 1;
		while (await Organization.findOne({ slug: slugCandidate })) {
			slugCandidate = `${orgBase}-${counter++}`;
		}
		const organization = await Organization.create({
			name,
			slug: slugCandidate,
			owner: user._id,
			members: [{ user: user._id, role: 'owner' }],
		});
		user.organization = organization._id;
		await user.save();
		return res.status(201).json({ success: true, message: 'Organization created', data: organization });
	} catch (err) {
		next(err);
	}
}
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// internal imports
import Organization from '../models/Organization.js';
import User from '../models/User.js';
import ApiKey from '../models/ApiKey.js';
import { getPlanConfig } from '../config/plans.js';

// Helper to get current billing month key
function currentMonthKey() {
	const d = new Date();
	return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

// Rotate usage month if needed
async function ensureUsage(org) {
	const monthKey = currentMonthKey();
	if (!org.usage || org.usage.month !== monthKey) {
		org.usage = { month: monthKey, logCount: 0 };
		await org.save();
	}
	return org;
}

export async function getOrganization(req, res, next) {
	try {
		const orgId = req.user?.organization;
		if (!orgId) return res.status(400).json({ message: 'No organization for user' });

		const org = await Organization.findById(orgId)
			.select('-apiKeys')
			.populate('owner', 'name email')
			.populate('members.user', 'name email');
		if (!org) return res.status(404).json({ message: 'Organization not found' });

		return res.status(200).json({ success: true, data: org });
	} catch (err) {
		next(err);
	}
}

export async function listMembers(req, res, next) {
	try {
		const orgId = req.user?.organization;
		const org = await Organization.findById(orgId).populate('members.user', 'name email');
		if (!org) return res.status(404).json({ message: 'Organization not found' });
		return res.status(200).json({ success: true, data: org.members });
	} catch (err) {
		next(err);
	}
}

export async function addMember(req, res, next) {
	try {
		const { email, role = 'member' } = req.body;
		if (!email) return res.status(400).json({ message: 'Email required' });

		const orgId = req.user?.organization;
		const org = await Organization.findById(orgId);
		if (!org) return res.status(404).json({ message: 'Organization not found' });

		// Enforce per-plan API key limits (count non-revoked keys)
		const planCfg = getPlanConfig(org.plan);
		const activeKeyCount = await ApiKey.countDocuments({ org: org._id, revoked: false });
		if (activeKeyCount >= (planCfg.apiKeys || 0)) {
			return res.status(403).json({ message: 'API key limit reached for current plan' });
		}

		if (org.members.length >= org.limits.members)
			return res.status(403).json({ message: 'Member limit reached for current plan' });

		const user = await User.findOne({ email });
		if (!user) return res.status(404).json({ message: 'User not found' });
		if (org.members.some((m) => m.user.toString() === user._id.toString())) {
			return res.status(409).json({ message: 'User already a member' });
		}

		org.members.push({ user: user._id, role });
		await org.save();

		return res
			.status(201)
			.json({ success: true, message: 'Member added', data: { user: user._id, role } });
	} catch (err) {
		next(err);
	}
}

export async function removeMember(req, res, next) {
	try {
		const { userId } = req.params;
		const orgId = req.user?.organization;
		const org = await Organization.findById(orgId);
		if (!org) return res.status(404).json({ message: 'Organization not found' });

		const member = org.members.find((m) => m.user.toString() === userId);
		if (!member) return res.status(404).json({ message: 'Member not in organization' });
		if (member.role === 'owner') return res.status(400).json({ message: 'Cannot remove owner' });

		org.members = org.members.filter((m) => m.user.toString() !== userId);
		await org.save();

		return res.status(200).json({ success: true, message: 'Member removed' });
	} catch (err) {
		next(err);
	}
}

export async function createApiKey(req, res, next) {
	try {
		const { name } = req.body;
		if (!name) return res.status(400).json({ message: 'Name required' });

		const orgId = req.user?.organization;
		const org = await Organization.findById(orgId);
		if (!org) return res.status(404).json({ message: 'Organization not found' });

		// Key format: dlog_<keyId>_<secret>
		const keyId = crypto.randomBytes(8).toString('hex');
		const secret = crypto.randomBytes(24).toString('hex');
		const rawKey = `dlog_${keyId}_${secret}`;
		const keyHash = await bcrypt.hash(secret, 12);

		await ApiKey.create({ org: org._id, name, keyId, keyHash });
		return res.status(201).json({ success: true, message: 'API key created', apiKey: rawKey });
	} catch (err) {
		next(err);
	}
}

export async function listApiKeys(req, res, next) {
	try {
		const orgId = req.user?.organization;
		const org = await Organization.findById(orgId).select('_id');
		if (!org) return res.status(404).json({ message: 'Organization not found' });
		const keys = await ApiKey.find({ org: org._id }).select('name keyId createdAt lastUsedAt revoked');
		return res.status(200).json({ success: true, data: keys });
	} catch (err) {
		next(err);
	}
}

export async function revokeApiKey(req, res, next) {
	try {
		const { keyId } = req.params;
		const orgId = req.user?.organization;
		const org = await Organization.findById(orgId).select('_id');
		if (!org) return res.status(404).json({ message: 'Organization not found' });
		const key = await ApiKey.findOne({ org: org._id, keyId, revoked: false });
		if (!key) return res.status(404).json({ message: 'Key not found or already revoked' });
		key.revoked = true;
		await key.save();
		return res.status(200).json({ success: true, message: 'API key revoked' });
	} catch (err) {
		next(err);
	}
}

export async function upgradePlan(req, res, next) {
	try {
		const { plan } = req.body;
		const allowed = ['free', 'pro', 'enterprise'];
		if (!allowed.includes(plan))
			return res.status(400).json({ message: 'Invalid plan selection' });
		const orgId = req.user?.organization;
		const org = await Organization.findById(orgId);
		if (!org) return res.status(404).json({ message: 'Organization not found' });
		org.plan = plan;
		await org.save();
		return res.status(200).json({ success: true, message: 'Plan updated', plan });
	} catch (err) {
		next(err);
	}
}

export async function updateOrganization(req, res, next) {
	try {
		const orgId = req.user?.organization;
		if (!orgId) return res.status(400).json({ message: 'No organization for user' });
		const allowed = ['name'];
		const update = {};
		for (const key of allowed) {
			if (req.body[key] != null && req.body[key] !== '') update[key] = req.body[key];
		}
		if (update.name) {
			update.slug = update.name
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/(^-|-$)+/g, '');
		}
		const org = await Organization.findByIdAndUpdate(orgId, update, { new: true, runValidators: true })
			.select('-apiKeys')
			.populate('owner', 'name email')
			.populate('members.user', 'name email');
		if (!org) return res.status(404).json({ message: 'Organization not found' });
		return res.json({ success: true, data: org });
	} catch (err) {
		next(err);
	}
}

// Public-style ingestion using x-api-key header
export async function ingestLog(req, res, next) {
	try {
		const rawKey = req.header('x-api-key');
		if (!rawKey) return res.status(401).json({ message: 'Missing API key' });

		// Expect dlog_<keyId>_<secret>
		const parts = rawKey.split('_');
		if (parts.length !== 3 || parts[0] !== 'dlog') return res.status(401).json({ message: 'Invalid API key' });
		const keyId = parts[1];
		const secret = parts[2];

		const keyDoc = await ApiKey.findOne({ keyId, revoked: false });
		if (!keyDoc) return res.status(401).json({ message: 'Invalid API key' });
		const org = await Organization.findById(keyDoc.org);
		if (!org) return res.status(401).json({ message: 'Invalid API key' });
		const match = await bcrypt.compare(secret, keyDoc.keyHash);
		if (!match) return res.status(401).json({ message: 'Invalid API key' });

		// Rotate usage month if needed and check plan limit
		await ensureUsage(org);
		if (org.usage.logCount + 1 > org.limits.logsPerMonth)
			return res.status(403).json({ message: 'Monthly log limit reached' });

		// Basic payload
		const { title, description, level = 'info', tags = [] } = req.body || {};
		if (!title) return res.status(400).json({ message: 'title required' });

		const Log = (await import('../models/Log.js')).default;
		const logDoc = await Log.create({
			title,
			description,
			level,
			tags: Array.isArray(tags) ? tags : [],
			organization: org._id,
			user: org.owner, // attribute to owner for now
		});

		org.usage.logCount += 1;
		keyDoc.lastUsedAt = new Date();
		await Promise.all([org.save(), keyDoc.save()]);

		return res.status(201).json({ success: true, data: logDoc });
	} catch (err) {
		next(err);
	}
}

// internal imports
import Organization from '../models/Organization.js';
import { getPlanConfig } from '../config/plans.js';

// key
function currentMonthKey() {
	const d = new Date();
	return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

// enforce usage
export default async function enforceUsage(req, res, next) {
	try {
		const orgId = req.user?.organization;
		if (!orgId) return res.status(400).json({ message: 'Organization missing for user' });

		const org = await Organization.findById(orgId);
		if (!org) return res.status(404).json({ message: 'Organization not found' });

		// rotate month
		const monthKey = currentMonthKey();
		if (!org.usage || org.usage.month !== monthKey) {
			org.usage = { month: monthKey, logCount: 0 };
			await org.save();
		}

		const planCfg = getPlanConfig(org.plan);
		if (org.usage.logCount + 1 > planCfg.logsPerMonth) {
			return res.status(403).json({ message: 'Monthly log quota exceeded. Upgrade plan.' });
		}

		req.organization = org;
		req.planConfig = planCfg;
		next();
	} catch (err) {
		next(err);
	}
}

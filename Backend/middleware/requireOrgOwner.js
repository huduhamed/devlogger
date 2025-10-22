import Organization from '../models/Organization.js';

// ensures requester is the owner or optionally admin of the org
export default async function requireOrgOwner(req, res, next) {
	try {
		const orgId = req.user?.organization;
		if (!orgId) return res.status(400).json({ message: 'User not associated with organization' });

		const org = await Organization.findById(orgId).select('owner');
		if (!org) return res.status(404).json({ message: 'Organization not found' });

		if (org.owner.toString() !== req.user._id.toString()) {
			return res.status(403).json({ message: 'Forbidden: requires organization owner role' });
		}
		req.organization = org;
		next();
	} catch (err) {
		next(err);
	}
}

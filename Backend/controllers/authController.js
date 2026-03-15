import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// internal imports
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import OrganizationInvite from '../models/OrganizationInvite.js';
import { JWT_EXPIRES_IN, JWT_SECRET } from '../config/env.js';
import { verifyGoogleToken } from '../config/google.js';
import { getPlanConfig } from '../config/plans.js';
import { createMemberAddedNotifications } from '../utils/organizationMembership.js';
import { hashInviteToken, isInviteExpired } from '../utils/organizationInvites.js';

// create owned org.
async function createOwnedOrganization({ user, name }) {
	const orgBase = name
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
		name: `${name}'s Org`,
		slug: slugCandidate,
		owner: user._id,
		members: [{ user: user._id, role: 'owner' }],
	});

	user.organization = organization._id;
	await user.save();

	return organization;
}

// valid invite
async function findValidInvitation(rawInviteToken) {
	if (!rawInviteToken) return null;

	const invite = await OrganizationInvite.findOne({
		tokenHash: hashInviteToken(rawInviteToken),
		status: 'pending',
	});

	if (!invite) return null;
	if (isInviteExpired(invite)) {
		invite.status = 'expired';
		await invite.save();
		return null;
	}

	return invite;
}

async function attachUserToInvitation({ app, invite, user }) {
	const organization = await Organization.findById(invite.organization);
	if (!organization) {
		return { error: { status: 404, message: 'Organization not found for invitation' } };
	}

	const planCfg = getPlanConfig(organization.plan);
	const memberLimit = organization.limits?.members ?? planCfg.members;
	if (organization.members.some((member) => member.user.toString() === user._id.toString())) {
		invite.status = 'accepted';
		invite.acceptedAt = new Date();
		invite.acceptedBy = user._id;
		await invite.save();
		return { organization };
	}

	if (organization.members.length >= memberLimit) {
		return { error: { status: 409, message: 'Organization member limit reached for this invite' } };
	}

	if (user.organization && user.organization.toString() !== organization._id.toString()) {
		return { error: { status: 409, message: 'User already belongs to another organization' } };
	}

	const inviter = await User.findById(invite.invitedBy).select('name email');
	const existingMembers = [...organization.members];
	organization.members.push({ user: user._id, role: invite.role || 'member' });
	user.organization = organization._id;
	invite.status = 'accepted';
	invite.acceptedAt = new Date();
	invite.acceptedBy = user._id;

	await Promise.all([organization.save(), user.save(), invite.save()]);
	await createMemberAddedNotifications({
		app,
		organization,
		actor: inviter || { _id: invite.invitedBy, email: invite.email },
		addedUser: user,
		existingMembers,
	});

	return { organization };
}

function respondInviteError(res, error) {
	return res.status(error.status).json({ message: error.message });
}

// google Sign-In
export async function googleSignIn(req, res, next) {
	try {
		const { idToken, inviteToken } = req.body;
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
		const normalizedEmail = payload.email?.trim()?.toLowerCase();
		const { name, picture, sub: googleId } = payload;
		const invite = await findValidInvitation(inviteToken);
		if (inviteToken && !invite) {
			return res.status(400).json({ message: 'Invitation is invalid or has expired' });
		}

		if (invite && invite.email !== normalizedEmail) {
			return res
				.status(400)
				.json({ message: 'Invitation email does not match this Google account' });
		}

		const email = normalizedEmail;
		if (!email) {
			return res.status(400).json({ message: 'Google account must have an email' });
		}
		let user = await User.findOne({ email });
		let isNewUser = false;
		let org = null;

		if (!user) {
			user = await User.create({
				name: name || 'Google User',
				email,
				password: googleId,
				avatarUrl: picture || '',
			});
			isNewUser = true;
		}

		if (invite) {
			const attachResult = await attachUserToInvitation({ app: req.app, invite, user });
			if (attachResult.error) return respondInviteError(res, attachResult.error);
			org = attachResult.organization;
		} else if (isNewUser) {
			org = await createOwnedOrganization({ user, name: name || 'Google User' });
		}

		// issue JWT
		const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

		if (!org && isNewUser) {
			org = await Organization.findById(user.organization);
		}
		return res.status(200).json({
			success: true,
			message: invite
				? 'Invitation accepted and Google user signed in'
				: isNewUser
					? 'Google user created and signed in'
					: 'Google user signed in',
			token,
			user,
			organization: org,
		});
	} catch (error) {
		return next(error);
	}
}

// (dev-only googleTestSignIn removed) Use real Google ID tokens via /api/v1/auth/google

// register user
export async function signUp(req, res, next) {
	try {
		const { name, email, password, inviteToken } = req.body;
		if (!name || !email || !password) {
			return res.status(400).json({ message: 'Name, Email and Password are required' });
		}
		const normalizedEmail = email.trim().toLowerCase();
		const invite = await findValidInvitation(inviteToken);
		if (inviteToken && !invite) {
			return res.status(400).json({ message: 'Invitation is invalid or has expired' });
		}
		if (invite && invite.email !== normalizedEmail) {
			return res.status(400).json({ message: 'Invitation email does not match this sign-up' });
		}

		const existingUser = await User.findOne({ email: normalizedEmail });
		if (existingUser) {
			return res.status(409).json({ message: 'email already in use, please sign-in' });
		}

		// hash password
		const hashed = await bcrypt.hash(password, 10);
		let newUser = await User.create({ name, email: normalizedEmail, password: hashed });
		let organization;

		if (invite) {
			const attachResult = await attachUserToInvitation({ app: req.app, invite, user: newUser });
			if (attachResult.error) {
				await User.deleteOne({ _id: newUser._id });
				return respondInviteError(res, attachResult.error);
			}
			organization = attachResult.organization;
		} else {
			organization = await createOwnedOrganization({ user: newUser, name });
		}

		const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

		return res.status(201).json({
			success: true,
			message: invite
				? 'Invitation accepted and account created successfully'
				: 'new user & organization created successfully',
			token,
			user: newUser,
			organization,
		});
	} catch (error) {
		return next(error);
	}
}

// invite details
export async function getInvitationDetails(req, res, next) {
	try {
		const invite = await findValidInvitation(req.params.token);
		if (!invite) {
			return res.status(404).json({ message: 'Invitation not found or has expired' });
		}

		const organization = await Organization.findById(invite.organization).select('name');
		const inviter = await User.findById(invite.invitedBy).select('name email');
		if (!organization) {
			return res.status(404).json({ message: 'Organization not found for invitation' });
		}

		return res.status(200).json({
			success: true,
			data: {
				email: invite.email,
				role: invite.role,
				expiresAt: invite.expiresAt,
				organization: { _id: organization._id, name: organization.name },
				inviter: inviter ? { _id: inviter._id, name: inviter.name, email: inviter.email } : null,
			},
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

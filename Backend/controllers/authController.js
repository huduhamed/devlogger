import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// internal imports
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import OrganizationInvite from '../models/OrganizationInvite.js';
import { JWT_EXPIRES_IN, JWT_SECRET } from '../config/env.js';
import { verifyGoogleToken } from '../config/google.js';
import { getPlanConfig } from '../config/plans.js';
import { createMemberAddedNotifications } from '../utils/organizationMembership.js';
import { hashInviteToken, isInviteExpired } from '../utils/organizationInvites.js';
import { sendPasswordResetEmail } from '../utils/sendOrganizationInviteEmail.js';

const strongPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

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

// find all pending invitations by email
async function findPendingInvitationsByEmail(email) {
	const normalizedEmail = email?.trim()?.toLowerCase();
	if (!normalizedEmail) return [];

	const invites = await OrganizationInvite.find({
		email: normalizedEmail,
		status: 'pending',
	});

	// filter out expired invites and mark them as expired
	const validInvites = [];
	for (const invite of invites) {
		if (isInviteExpired(invite)) {
			invite.status = 'expired';
			await invite.save();
		} else {
			validInvites.push(invite);
		}
	}

	return validInvites;
}

async function attachUserToInvitation({ app, invite, user }) {
	const organization = await Organization.findById(invite.organization);
	if (!organization) {
		return { error: { status: 404, message: 'No organization is linked to this invitation.' } };
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
		return { error: { status: 409, message: 'Member limit has been reached.' } };
	}

	if (user.organization && user.organization.toString() !== organization._id.toString()) {
		return {
			error: { status: 409, message: 'This account already belongs to another workspace.' },
		};
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

// attach user to all pending invitations by email
async function attachUserToPendingInvitations({ app, user, email }) {
	const pendingInvites = await findPendingInvitationsByEmail(email);
	if (pendingInvites.length === 0) return null;

	// add user to first pending invite's organization
	const firstInvite = pendingInvites[0];
	const attachResult = await attachUserToInvitation({ app, invite: firstInvite, user });

	return attachResult.error ? null : attachResult.organization;
}

function respondInviteError(res, error) {
	return res.status(error.status).json({ message: error.message });
}

// google Sign-In
export async function googleSignIn(req, res, next) {
	try {
		const { idToken, inviteToken } = req.body;
		if (!idToken) {
			return res.status(400).json({ message: 'Could not be completed, please try again.' });
		}
		// verify token and extract payload
		let payload;
		try {
			payload = await verifyGoogleToken(idToken);
		} catch (err) {
			return res.status(401).json({ message: 'Sign-in failed, please try again.' });
		}
		// extract payload
		const normalizedEmail = payload.email?.trim()?.toLowerCase();
		const { name, picture, sub: googleId } = payload;

		const invite = await findValidInvitation(inviteToken);
		if (inviteToken && !invite) {
			return res.status(400).json({ message: 'This invitation link is no longer valid.' });
		}

		if (invite && invite.email !== normalizedEmail) {
			return res
				.status(400)
				.json({ message: 'Please sign-in with the email address that received this invitation.' });
		}

		const email = normalizedEmail;
		if (!email) {
			return res.status(400).json({ message: 'An error occured, please try again later.' });
		}
		let user = await User.findOne({ email });
		let isNewUser = false;
		let org = null;
		let wasPendingInvite = false;

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
			// check for pending invitations by email
			const pendingOrg = await attachUserToPendingInvitations({ app: req.app, user, email });
			if (pendingOrg) {
				org = pendingOrg;
				wasPendingInvite = true;
			} else {
				// only create personal org if no pending invitations
				org = await createOwnedOrganization({ user, name: name || 'Google User' });
			}
		}

		// issue JWT
		const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

		if (!org && isNewUser) {
			org = await Organization.findById(user.organization);
		}
		return res.status(200).json({
			success: true,
			message:
				invite || wasPendingInvite
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

// register user
export async function signUp(req, res, next) {
	try {
		const { name, email, password, inviteToken } = req.body;
		if (!name || !email || !password) {
			return res.status(400).json({ message: 'Please provide your name, email, and password.' });
		}
		const normalizedEmail = email.trim().toLowerCase();
		const invite = await findValidInvitation(inviteToken);
		if (inviteToken && !invite) {
			return res.status(400).json({ message: 'This invitation link is no longer valid.' });
		}
		if (invite && invite.email !== normalizedEmail) {
			return res
				.status(400)
				.json({ message: 'Please sign up with the email address that received this invitation.' });
		}

		const existingUser = await User.findOne({ email: normalizedEmail });
		if (existingUser) {
			return res
				.status(409)
				.json({ message: 'That email is already in use. Try signing in instead.' });
		}

		// hash password
		const hashed = await bcrypt.hash(password, 10);
		let newUser = await User.create({ name, email: normalizedEmail, password: hashed });
		let organization;
		let wasPendingInvite = false;

		if (invite) {
			const attachResult = await attachUserToInvitation({ app: req.app, invite, user: newUser });
			if (attachResult.error) {
				await User.deleteOne({ _id: newUser._id });
				return respondInviteError(res, attachResult.error);
			}
			organization = attachResult.organization;
		} else {
			// check for pending invitations by email
			const pendingOrg = await attachUserToPendingInvitations({
				app: req.app,
				user: newUser,
				email: normalizedEmail,
			});
			if (pendingOrg) {
				organization = pendingOrg;
				wasPendingInvite = true;
			} else {
				organization = await createOwnedOrganization({ user: newUser, name });
			}
		}

		const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

		return res.status(201).json({
			success: true,
			message:
				invite || wasPendingInvite
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
			return res.status(404).json({ message: 'This invitation link is invalid or has expired.' });
		}

		const organization = await Organization.findById(invite.organization).select('name');
		const inviter = await User.findById(invite.invitedBy).select('name email');
		if (!organization) {
			return res.status(404).json({ message: 'No organization is linked to this invitation.' });
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
			return res.status(400).json({ message: 'Please enter both email and password.' });

		// cross check credentials
		const normalizedEmail = email.trim().toLowerCase();
		const user = await User.findOne({ email: normalizedEmail });
		if (!user) return res.status(401).json({ message: 'Email or password is incorrect.' });

		// match credentials
		const match = await bcrypt.compare(password, user.password);
		if (!match) return res.status(401).json({ message: 'Email or password is incorrect.' });

		const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

		// return
		return res.status(200).json({
			success: true,
			message: 'user signed in',
			token,
			user,
		});
	} catch (error) {
		return res.status(500).json({ message: 'Something went wrong, please try again shortly.' });
	}
}

// sign out logic
export async function signOut(req, res) {
	// stateless JWT logout: client just discards token.
	return res.status(200).json({ success: true, message: 'User successfully signed out' });
}

// forgot password - send reset link
export async function forgotPassword(req, res, next) {
	try {
		const { email } = req.body;
		if (!email) {
			return res.status(400).json({ message: 'Please enter your email address.' });
		}

		const normalizedEmail = email.trim().toLowerCase();
		const user = await User.findOne({ email: normalizedEmail });
		if (!user) {
			// Don't reveal whether email exists for security
			return res.status(200).json({
				success: true,
				message: 'If an account exists with that email, a password reset link has been sent.',
			});
		}

		// Generate reset token
		const resetToken = crypto.randomBytes(32).toString('hex');
		const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

		// Set token and expiry (1 hour)
		user.passwordResetToken = resetTokenHash;
		user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
		await user.save();

		// Build reset URL
		const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
		const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(normalizedEmail)}`;

		// Send email
		const emailResult = await sendPasswordResetEmail({ to: normalizedEmail, resetUrl });

		return res.status(200).json({
			success: true,
			message: emailResult.delivered
				? 'We sent you a password reset link.'
				: 'We created a reset link. Use the link below to continue.',
			resetUrl: emailResult.delivered ? null : emailResult.resetUrl,
		});
	} catch (error) {
		return next(error);
	}
}

// reset password
export async function resetPassword(req, res, next) {
	try {
		const { token, email, newPassword } = req.body;

		if (!token || !email || !newPassword) {
			return res
				.status(400)
				.json({ message: 'Please provide the reset token, email and new password.' });
		}

		if (!strongPasswordRegex.test(newPassword)) {
			return res.status(400).json({
				message:
					'Password must be at least 8 characters and include at least one letter and one number.',
			});
		}

		const normalizedEmail = email.trim().toLowerCase();

		// Hash the token to compare with stored hash
		const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

		// Find user and verify token
		const user = await User.findOne({
			email: normalizedEmail,
			passwordResetToken: tokenHash,
			passwordResetExpires: { $gt: new Date() },
		});

		if (!user) {
			return res.status(400).json({ message: 'This reset link is invalid or has expired.' });
		}

		// Update password
		user.password = await bcrypt.hash(newPassword, 10);
		user.passwordResetToken = null;
		user.passwordResetExpires = null;
		user.passwordChangedAt = new Date();
		await user.save();

		return res.status(200).json({
			success: true,
			message: 'Password reset successfully. You can now sign in with your new password.',
		});
	} catch (error) {
		return next(error);
	}
}

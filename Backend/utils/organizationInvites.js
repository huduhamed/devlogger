import crypto from 'crypto';

// internal imports
import { FRONTEND_URL } from '../config/env.js';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// invite token
export function createInviteToken() {
	return crypto.randomBytes(32).toString('hex');
}

// hide invite token
export function hashInviteToken(token) {
	return crypto.createHash('sha256').update(String(token)).digest('hex');
}

// invite expire
export function getInviteExpiryDate() {
	return new Date(Date.now() + INVITE_TTL_MS);
}

// invite
export function buildInviteUrl({ token, email }) {
	const baseUrl = FRONTEND_URL || 'http://localhost:5173';
	const url = new URL('/sign-up', baseUrl);
	url.searchParams.set('inviteToken', token);
	url.searchParams.set('email', email);
	return url.toString();
}

// check invite exp.
export function isInviteExpired(invite) {
	return !invite?.expiresAt || new Date(invite.expiresAt).getTime() <= Date.now();
}

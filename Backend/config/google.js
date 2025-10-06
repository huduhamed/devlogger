import { OAuth2Client } from 'google-auth-library';

// internal imports
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from './env.js';

export const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);

export async function verifyGoogleToken(idToken) {
	const ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
	return ticket.getPayload();
}

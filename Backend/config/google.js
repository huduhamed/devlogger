import { OAuth2Client } from 'google-auth-library';

// internal imports
import { GOOGLE_CLIENT_ID } from './env.js';

export const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

export async function verifyGoogleToken(idToken) {
	const ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
	return ticket.getPayload();
}

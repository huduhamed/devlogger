import { config } from 'dotenv';

// internal imports
config({ path: './.env' });

export const {
	PORT,
	MONGODB_URL,
	JWT_SECRET,
	JWT_EXPIRES_IN,
	STRIPE_SECRET_KEY,
	STRIPE_WEBHOOK_SECRET,
	STRIPE_PRICE_PRO_MONTHLY,
	STRIPE_PRICE_ENTERPRISE_MONTHLY,
	FRONTEND_URL,
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
} = process.env;

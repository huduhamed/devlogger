import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Determine __dirname for ES modules and load .env relative to this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load the .env file located at Backend/.env regardless of process.cwd()
config({ path: path.join(__dirname, '..', '.env') });

export const {
	PORT,
	MONGODB_URL,
	JWT_SECRET,
	JWT_EXPIRES_IN,
	STRIPE_SECRET_KEY,
	STRIPE_WEBHOOK_SECRET,
	PRODUCT_PRICE_PRO,
	PRODUCT_PRICE_ENTERPRISE,
	FRONTEND_URL,
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	SMTP_HOST,
	SMTP_PORT,
	SMTP_USER,
	SMTP_PASS,
	SMTP_FROM,
	SMTP_SECURE,
} = process.env;

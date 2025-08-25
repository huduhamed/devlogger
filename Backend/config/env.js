import { config } from 'dotenv';

// internal imports
config({ path: './.env' });

export const { PORT, MONGODB_URL, JWT_SECRET, JWT_EXPIRES_IN } = process.env;

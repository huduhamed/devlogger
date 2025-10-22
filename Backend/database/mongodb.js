import mongoose from 'mongoose';

// internal imports
import { MONGODB_URL } from '../config/env.js';

// check DB connection
if (!MONGODB_URL) throw new Error('MONGODB_URL is not defined.');

// connect db
async function connectToDB() {
	try {
		await mongoose.connect(MONGODB_URL);
		console.log('connected to database.');
	} catch (error) {
		console.error('error connecting to DB', error);

		process.exit(1);
	}
}

export default connectToDB;

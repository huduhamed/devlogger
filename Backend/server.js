import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

import authRoutes from './routes/authRoutes.js';
import logRoutes from './routes/logRoutes.js';
import { protect } from './middleware/auth.js';

dotenv.config();
const app = express();

const corsOptions = {
	origin: 'http://localhost:5173',
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization'],
	credentials: true,
};

// Allow CORS headers on all requests
app.use(cors(corsOptions));
app.use(express.json());

// Handle OPTIONS requests (preflight) with CORS headers present
app.use((req, res, next) => {
	if (req.method === 'OPTIONS') {
		return res.sendStatus(200);
	}
	next();
});

// DB connection
mongoose
	.connect(process.env.MONGODB_URL)
	.then(() => console.log('DB connnected'))
	.catch((err) => console.error(err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/logs', protect, logRoutes);

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

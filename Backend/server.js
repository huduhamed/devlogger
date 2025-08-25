import express, { urlencoded } from 'express';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/authRoutes.js';
import logRoutes from './routes/logRoutes.js';
import { protect } from './middleware/auth.js';
import { PORT } from './config/env.js';
import connectToDB from './database/mongodb.js';

const app = express();

// middleware
app.use(express.json());
app.use(cookieParser());
app.use(urlencoded({ extended: false }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/logs', protect, logRoutes);

app.get('/', (req, res) => {
	res.send('welcome!');
});

// listen & connect to DB
app.listen(PORT, async () => {
	console.log(`Server running on  http://localhost:${PORT}`);

	// connect to db
	await connectToDB();
});

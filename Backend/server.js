import express, { urlencoded } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRouter from './routes/authRoutes.js';
import userRouter from './routes/userRoute.js';
import logRoutes from './routes/logRoutes.js';
import { PORT } from './config/env.js';
import errorHandler from './middleware/errorHandler.js';
import connectToDB from './database/mongodb.js';

const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

// security middlewares
app.use(helmet());

// basic rate limiting (can adjust or scope per route later)
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // limit each IP
	standardHeaders: true,
	legacyHeaders: false,
});
app.use(limiter);

// body & cookie parsing
app.use(express.json({ limit: '200kb' }));
app.use(cookieParser());
app.use(urlencoded({ extended: false }));

// Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/logs', logRoutes);

app.get('/', (req, res) => {
	res.send('welcome onboard buddy!');
});

// Error handler (after all routes)
app.use(errorHandler);

// Only start listening and connect to DB when NOT testing
if (process.env.NODE_ENV !== 'test') {
	app.listen(PORT, async () => {
		console.log(`Server running on  http://localhost:${PORT}`);
		// connect to db
		await connectToDB();
	});
}

export default app;

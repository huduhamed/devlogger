import express, { urlencoded } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import authRouter from './routes/authRoutes.js';
import userRouter from './routes/userRoute.js';
import logRoutes from './routes/logRoutes.js';
import { PORT } from './config/env.js';
import connectToDB from './database/mongodb.js';

const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

// middlewares
app.use(express.json());
app.use(cookieParser());
app.use(urlencoded({ extended: false }));

// Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/logs', logRoutes);

app.get('/', (req, res) => {
	res.send('welcome onboard buddy!');
});

// Only start listening and connect to DB when NOT testing
if (process.env.NODE_ENV !== 'test') {
	app.listen(PORT, async () => {
		console.log(`Server running on  http://localhost:${PORT}`);
		// connect to db
		await connectToDB();
	});
}

export default app;

import express, { urlencoded } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import requestId from './middleware/requestId.js';
import rateLimit from 'express-rate-limit';

// internal imports
import authRouter from './routes/authRoutes.js';
import userRouter from './routes/userRoute.js';
import logRoutes from './routes/logRoutes.js';
import organizationRoutes from './routes/organizationRoutes.js';
import { PORT, FRONTEND_URL } from './config/env.js';
import billingRoutes from './routes/billingRoutes.js';
import { stripeWebhook } from './controllers/billingController.js';
import errorHandler from './middleware/errorHandler.js';
import connectToDB from './database/mongodb.js';

const app = express();
app.use(cors({ origin: FRONTEND_URL || 'http://localhost:5173', credentials: true }));

// security + tracing middlewares
app.use(requestId);
app.use(helmet());

// basic rate limiting (can adjust or scope per route later)
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // limit each IP
	standardHeaders: true,
	legacyHeaders: false,
});
app.use(limiter);

// simple structured request logging (replace later with pino/winston)
app.use((req, _res, next) => {
	const start = Date.now();
	const { method, url, requestId: rid } = req;
	_res.on('finish', () => {
		const ms = Date.now() - start;
		// console.log(JSON.stringify({ level: 'info', msg: 'req', method, url, status: _res.statusCode, ms, requestId: rid }));
	});
	return next();
});

// body & cookie parsing
// Stripe webhook needs raw body; use a conditional parser
app.use((req, res, next) => {
	if (req.originalUrl === '/api/v1/billing/webhook') {
		// capture raw body for stripe signature verification
		let data = '';
		req.setEncoding('utf8');
		req.on('data', (chunk) => {
			data += chunk;
		});
		req.on('end', () => {
			req.rawBody = data;
			next();
		});
	} else {
		express.json({ limit: '200kb' })(req, res, next);
	}
});
app.use(cookieParser());
app.use(urlencoded({ extended: false }));

// Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/logs', logRoutes);
app.use('/api/v1/organizations', organizationRoutes);
app.use('/api/v1/billing', billingRoutes);

// Stripe webhook endpoint (must be after body parsing setup)
app.post('/api/v1/billing/webhook', stripeWebhook);

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

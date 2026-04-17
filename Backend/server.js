import express, { urlencoded } from 'express';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// internal imports
import authRouter from './routes/authRoutes.js';
import requestId from './middleware/requestId.js';
import userRouter from './routes/userRoute.js';
import logRoutes from './routes/logRoutes.js';
import organizationRoutes from './routes/organizationRoutes.js';
import { PORT, FRONTEND_URL } from './config/env.js';
import billingRoutes from './routes/billingRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { stripeWebhook } from './controllers/billingController.js';
import errorHandler from './middleware/errorHandler.js';
import connectToDB from './database/mongodb.js';
import User from './models/User.js';
import { JWT_SECRET } from './config/env.js';

const app = express();

const rawOrigins = (FRONTEND_URL || '')
	.split(',')
	.map((origin) => origin.trim())
	.filter(Boolean);

if (process.env.NODE_ENV === 'production' && rawOrigins.length === 0) {
	throw new Error('FRONTEND_URL must be set in production.');
}

const allowedOrigins =
	rawOrigins.length > 0
		? rawOrigins
		: process.env.NODE_ENV === 'test'
			? []
			: ['http://localhost:5173'];

const corsOptions = {
	credentials: true,
	origin(origin, callback) {
		if (!origin) return callback(null, true);
		if (allowedOrigins.includes(origin)) return callback(null, true);
		return callback(new Error('Origin not allowed by CORS'));
	},
};

app.use(cors(corsOptions));

// create an HTTP server to attach socket.io
const httpServer = http.createServer(app);

// initialize socket.io
const io = new IOServer(httpServer, {
	cors: {
		origin: allowedOrigins,
		methods: ['GET', 'POST'],
		credentials: true,
	},
});

// make io available via app
app.set('io', io);

io.on('connection', async (socket) => {
	try {
		const token = socket.handshake.auth?.token;
		if (!token) {
			socket.emit('auth_error', 'Token missing');
			socket.disconnect(true);
			return;
		}

		const decoded = jwt.verify(token, JWT_SECRET);
		const userId = decoded.userId || decoded.id || decoded._id;
		if (!userId) {
			socket.emit('auth_error', 'Invalid token payload');
			socket.disconnect(true);
			return;
		}

		const user = await User.findById(userId).select('-password');
		if (!user) {
			socket.emit('auth_error', 'User not found');
			socket.disconnect(true);
			return;
		}

		// join rooms for user and org
		socket.join(`user:${user._id.toString()}`);
		if (user.organization) socket.join(`org:${user.organization.toString()}`);

		socket.on('disconnect', () => {
			// no-op for now
		});
	} catch (e) {
		console.error('Socket authentication failed', {
			socketId: socket.id,
			error: e.message,
		});
		socket.emit('auth_error', 'Authentication failed');
		socket.disconnect(true);
	}
});

// security + tracing middlewares
app.use(requestId);
// configure helmet
app.use(
	helmet({
		crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
		crossOriginEmbedderPolicy: false,
	}),
);

// basic rate limiting
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
	standardHeaders: true,
	legacyHeaders: false,
});
app.use(limiter);

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 8,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: 'Too many authentication attempts. Please try again later.' },
});

const passwordResetLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 3,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: 'Too many reset requests. Please try again later.' },
});

app.use('/api/v1/auth/sign-in', authLimiter);
app.use('/api/v1/auth/sign-up', authLimiter);
app.use('/api/v1/auth/forgot-password', passwordResetLimiter);

// simple structured request logging
app.use((req, _res, next) => {
	const start = Date.now();
	const { method, url, requestId: rid } = req;
	_res.on('finish', () => {
		const ms = Date.now() - start;
	});
	return next();
});

// Stripe webhook must receive the raw request body for signature verification.
app.post('/api/v1/billing/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

app.use(express.json({ limit: '200kb' }));
app.use(cookieParser());
app.use(urlencoded({ extended: false }));

// routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/logs', logRoutes);
app.use('/api/v1/organizations', organizationRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/notifications', notificationRoutes);

app.get('/', (req, res) => {
	res.send('welcome onboard buddy!');
});

app.get('/health', (_req, res) => {
	return res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.get('/ready', (_req, res) => {
	if (mongoose.connection.readyState !== 1) {
		return res.status(503).json({ status: 'not_ready' });
	}

	return res.status(200).json({ status: 'ready' });
});

// Error handler
app.use(errorHandler);

// Only start listening and connect to DB when NOT testing
if (process.env.NODE_ENV !== 'test') {
	const server = httpServer.listen(PORT, async () => {
		console.log(`Server running on  http://localhost:${PORT}`);
		// connect to db
		await connectToDB();
	});

	const shutdown = (signal) => {
		console.log(`${signal} received. Shutting down gracefully...`);
		server.close(async () => {
			try {
				io.close();
				if (mongoose.connection.readyState !== 0) {
					await mongoose.connection.close();
				}
				process.exit(0);
			} catch (error) {
				console.error('Graceful shutdown failed', error);
				process.exit(1);
			}
		});
	};

	process.on('SIGTERM', () => shutdown('SIGTERM'));
	process.on('SIGINT', () => shutdown('SIGINT'));
}

export default app;

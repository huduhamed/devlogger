import express, { urlencoded } from 'express';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';

// internal imports
import authRouter from './routes/authRoutes.js';
import requestId from './middleware/requestId.js';
import userRouter from './routes/userRoute.js';
import logRoutes from './routes/logRoutes.js';
import organizationRoutes from './routes/organizationRoutes.js';
import { PORT, FRONTEND_URL, STRIPE_SECRET_KEY } from './config/env.js';
import billingRoutes from './routes/billingRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { stripeWebhook } from './controllers/billingController.js';
import errorHandler from './middleware/errorHandler.js';
import connectToDB from './database/mongodb.js';
import User from './models/User.js';
import { JWT_SECRET } from './config/env.js';

const app = express();
app.use(cors({ origin: FRONTEND_URL || 'http://localhost:5173', credentials: true }));

// create an HTTP server to attach socket.io
const httpServer = http.createServer(app);

// initialize socket.io
const io = new IOServer(httpServer, {
	cors: {
		origin: FRONTEND_URL || 'http://localhost:5173',
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
			return;
		}

		const decoded = jwt.verify(token, JWT_SECRET);
		const userId = decoded.userId || decoded.id || decoded._id;
		if (!userId) return;

		const user = await User.findById(userId).select('-password');
		if (!user) return;

		// join rooms for user and org
		socket.join(`user:${user._id.toString()}`);
		if (user.organization) socket.join(`org:${user.organization.toString()}`);

		socket.on('disconnect', () => {
			// no-op for now
		});
	} catch (e) {
		// ignore errors
	}
});

// security + tracing middlewares
app.use(requestId);
// configure helmet
app.use(
	helmet({
		crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
		crossOriginEmbedderPolicy: false,
	})
);

// basic rate limiting
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
	standardHeaders: true,
	legacyHeaders: false,
});
app.use(limiter);

// simple structured request logging
app.use((req, _res, next) => {
	const start = Date.now();
	const { method, url, requestId: rid } = req;
	_res.on('finish', () => {
		const ms = Date.now() - start;
	});
	return next();
});

// stripe webhook
app.use((req, res, next) => {
	if (req.originalUrl === '/api/v1/billing/webhook') {
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

// routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/logs', logRoutes);
app.use('/api/v1/organizations', organizationRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Stripe webhook endpoint
app.post('/api/v1/billing/webhook', stripeWebhook);

app.get('/', (req, res) => {
	res.send('welcome onboard buddy!');
});

// Error handler
app.use(errorHandler);

// Only start listening and connect to DB when NOT testing
if (process.env.NODE_ENV !== 'test') {
	httpServer.listen(PORT, async () => {
		console.log(`Server running on  http://localhost:${PORT}`);
		// connect to db
		await connectToDB();
	});
}

export default app;

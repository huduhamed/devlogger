import { Router } from 'express';
import rateLimit from 'express-rate-limit';

// internal imports
import { validate } from '../middleware/validate.js';
import { supportTicketSchema } from '../validation/schemas.js';
import { createSupportTicket } from '../controllers/supportController.js';

const router = Router();

const supportLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 5,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: 'Too many support requests. Please try again later.' },
});

router.post('/tickets', supportLimiter, validate(supportTicketSchema), createSupportTicket);

export default router;

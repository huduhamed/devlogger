import { Router } from 'express';

// internal imports
import authorize from '../middleware/auth.js';
import {
	createCheckoutSession,
	createPortalSession,
	stripeWebhook,
	getBillingConfig,
} from '../controllers/billingController.js';

const router = Router();

// Stripe webhook requires raw body
router.post('/webhook', (req, res, next) => next());

router.post('/checkout', authorize, createCheckoutSession);
router.post('/portal', authorize, createPortalSession);
router.get('/config', authorize, getBillingConfig);

export default router;

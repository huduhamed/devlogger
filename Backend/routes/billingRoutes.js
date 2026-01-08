import { Router } from 'express';

// internal imports
import authorize from '../middleware/auth.js';
import {
	createCheckoutSession,
	createPortalSession,
	stripeWebhook,
	getBillingConfig,
	verifyCheckoutSession,
} from '../controllers/billingController.js';

const router = Router();

// stripe webhook
router.post('/webhook', stripeWebhook);

router.post('/checkout', authorize, createCheckoutSession);
router.post('/verify-session', authorize, verifyCheckoutSession);
router.post('/portal', authorize, createPortalSession);
router.get('/config', authorize, getBillingConfig);

export default router;

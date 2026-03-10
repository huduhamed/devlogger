import { Router } from 'express';

// internal imports
import authorize from '../middleware/auth.js';
import {
	createCheckoutSession,
	createPortalSession,
	getBillingConfig,
	verifyCheckoutSession,
} from '../controllers/billingController.js';

const router = Router();

router.post('/checkout', authorize, createCheckoutSession);
router.post('/verify-session', authorize, verifyCheckoutSession);
router.post('/portal', authorize, createPortalSession);
router.get('/config', authorize, getBillingConfig);

export default router;

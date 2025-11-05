import { Router } from 'express';

// internal imports
import authorize from '../middleware/auth.js';
import {
	getNotifications,
	markAllRead,
	markRead,
	createNotification,
} from '../controllers/notificationController.js';

const router = Router();

// get notifications for current user/org
router.get('/', authorize, getNotifications);

// mark all read
router.post('/mark-all-read', authorize, markAllRead);

// mark single
router.post('/:id/mark-read', authorize, markRead);

// create notification (internal/dev use)
router.post('/', authorize, createNotification);

export default router;

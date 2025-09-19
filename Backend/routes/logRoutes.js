import { Router } from 'express';
import {
	createLog,
	updateLog,
	getLogs,
	deleteLog,
	getLog,
	getAllLogs,
} from '../controllers/logController.js';
import authorize from '../middleware/auth.js';

const router = Router();

// fetch all logs (optional, admin/public dashboard)
router.get('/all', authorize, getAllLogs);

// Get all logs for current authenticated user
router.get('/', authorize, getLogs);

// Get single log (owner only)
router.get('/:id', authorize, getLog);

// create log endpoint
router.post('/', authorize, createLog);

// update a log
router.put('/:id', authorize, updateLog);

// delete a log
router.delete('/:id', authorize, deleteLog);

export default router;

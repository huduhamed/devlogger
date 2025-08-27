import { Router } from 'express';
import { createLog, updateLog, getLogs, deleteLog, getLog } from '../controllers/logController.js';
import authorize from '../middleware/auth.js';

const router = Router();

// Get all logs
router.get('/', getLogs);

// Get single log (owner only)
router.get('/:id', authorize, getLog);

// create log endpoint
router.post('/', createLog);

// update a log
router.put('/:id', authorize, updateLog);

// delete a log
router.delete('/:id', authorize, deleteLog);

export default router;

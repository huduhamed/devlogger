import { Router } from 'express';

// internal imports
import authorize from '../middleware/auth.js';
import requireOrgOwner from '../middleware/requireOrgOwner.js';
import {
	getOrganization,
	listMembers,
	addMember,
	removeMember,
	createApiKey,
	listApiKeys,
	revokeApiKey,
	ingestLog,
	upgradePlan,
} from '../controllers/organizationController.js';

const router = Router();

// Authenticated org-level operations
router.get('/me', authorize, getOrganization);
router.get('/members', authorize, listMembers);
router.post('/members', authorize, requireOrgOwner, addMember);
router.delete('/members/:userId', authorize, requireOrgOwner, removeMember);

// API key management (owner only)
router.post('/api-keys', authorize, requireOrgOwner, createApiKey);
router.get('/api-keys', authorize, requireOrgOwner, listApiKeys);
router.post('/api-keys/:keyId/revoke', authorize, requireOrgOwner, revokeApiKey);
router.post('/upgrade', authorize, requireOrgOwner, upgradePlan);

// Public ingestion endpoint (uses x-api-key, no bearer auth)
router.post('/ingest', ingestLog);

export default router;

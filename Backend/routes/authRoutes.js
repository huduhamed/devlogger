import { Router } from 'express';

// internal imports
import {
	getInvitationDetails,
	signUp,
	signIn,
	signOut,
	googleSignIn,
} from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { signUpSchema, signInSchema } from '../validation/schemas.js';

const authRouter = Router();

// sign-up endpoints path => /api/v1/auth/sign-up
authRouter.post('/sign-up', validate(signUpSchema), signUp);

// public invitation lookup
authRouter.get('/invitations/:token', getInvitationDetails);

// signin endpoints path => /api/v1/auth/sign-in
authRouter.post('/sign-in', validate(signInSchema), signIn);

// google Oauth
authRouter.post('/google', googleSignIn);

// sign-out endpoints path => /api/v1/auth/sign-out
authRouter.post('/sign-out', signOut);

export default authRouter;

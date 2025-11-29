import { Router } from 'express';

// internal imports
import {
	signUp,
	signIn,
	signOut,
	googleSignIn,
	googleTestSignIn,
} from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { signUpSchema, signInSchema } from '../validation/schemas.js';

const authRouter = Router();

// sign-up endpoints path => /api/v1/auth/sign-up
authRouter.post('/sign-up', validate(signUpSchema), signUp);

// signin endpoints path => /api/v1/auth/sign-in
authRouter.post('/sign-in', validate(signInSchema), signIn);

// sign-out endpoints path => /api/v1/auth/sign-out
authRouter.post('/sign-out', signOut);
authRouter.post('/google', googleSignIn);

// development-only test route
if (process.env.NODE_ENV !== 'production') {
	authRouter.post('/google/test', googleTestSignIn);
}

export default authRouter;

import { Router } from 'express';

// internal imports
import { signUp, signIn, signOut, googleSignIn } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { signUpSchema, signInSchema } from '../validation/schemas.js';

const authRouter = Router();

// sign-up endpoints path => /api/v1/auth/sign-up
authRouter.post('/sign-up', validate(signUpSchema), signUp);

// signin endpoints path => /api/v1/auth/sign-in
authRouter.post('/sign-in', validate(signInSchema), signIn);

// sign-out endpoints path => /api/v1/auth/sign-out
authRouter.post('/sign-out', signOut);
router.post('/google', googleSignIn);

export default authRouter;

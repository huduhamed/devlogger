import { Router } from 'express';
// internal imports
import { signUp, loginUser, signOut } from '../controllers/authController.js';

const authRouter = Router();

// sign-up endpoints path => /api/v1/auth/sign-up
authRouter.post('/signup', signUp);

// login endpoints path => /api/v1/auth/sign-in
authRouter.post('/login', loginUser);

// sign-out endpoints path => /api/v1/auth/sign-out
authRouter.post('/sign-out', signOut);

export default authRouter;

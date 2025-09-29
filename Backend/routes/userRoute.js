import { Router } from 'express';

// internal imports
import {
	createUser,
	deleteUser,
	getUser,
	getUsers,
	updateUser,
	updateSelf,
} from '../controllers/userController.js';
import authorize from '../middleware/auth.js';
import { requireRole, requireSelfOrAdmin } from '../middleware/roles.js';

// instance of user route
const userRouter = Router();

// get all users endpoint (admin only)
userRouter.get('/', authorize, requireRole('admin'), getUsers);

// get a single user info (self or admin)
userRouter.get('/:id', authorize, requireSelfOrAdmin('id'), getUser);

// create user endpoint (admin only)
userRouter.post('/', authorize, requireRole('admin'), createUser);

// update user endpoint (self or admin)
userRouter.put('/:id', authorize, requireSelfOrAdmin('id'), updateUser);

// self update convenience (profile settings)
userRouter.patch('/me', authorize, updateSelf);

// delete user endpoint (self or admin)
userRouter.delete('/:id', authorize, requireSelfOrAdmin('id'), deleteUser);

export default userRouter;

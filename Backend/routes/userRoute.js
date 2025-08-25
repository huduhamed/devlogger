import { Router } from 'express';

// internal imports
import {
	createUser,
	deleteUser,
	getUser,
	getUsers,
	updateUser,
} from '../controllers/userController.js';
import authorize from '../middleware/auth.js';

// instance of user route
const userRouter = Router();

// get all users endpoint
userRouter.get('/', getUsers);

// get a single user info
userRouter.get('/:id', authorize, getUser);

// create user endpoint
userRouter.post('/', createUser);

// update user endpoint
userRouter.put('/:id', authorize, updateUser);

// delete user endpoint
userRouter.delete('/:id', authorize, deleteUser);

export default userRouter;

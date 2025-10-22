import { jest } from '@jest/globals';

/*
  Unit tests for the authorize middleware.
  - mock jsonwebtoken.verify and the User model.
  - The middleware does: read token -> jwt.verify -> User.findById(...).select('-password')
  - To match the chained select(...) call we mock findById to return an object with a select() that resolves.
*/

let authorize; // middleware under test
let jwt; // mocked jsonwebtoken
let User; // mocked User model

// helper to build a fake express res object with spyable methods
const makeRes = () => {
	const res = {};
	res.status = jest.fn().mockReturnValue(res);
	res.json = jest.fn().mockReturnValue(res);
	return res;
};

describe('authorize middleware (unit)', () => {
	beforeAll(async () => {
		// Register ESM-safe mocks BEFORE importing the modules under test.
		// We declare verify as a jest.fn so tests can control its behaviour.
		await jest.unstable_mockModule('jsonwebtoken', () => ({
			__esModule: true,
			default: { verify: jest.fn() },
		}));

		// Mock User model. findById should return an object that has select()
		await jest.unstable_mockModule('../models/User.js', () => ({
			__esModule: true,
			default: { findById: jest.fn() },
		}));

		// Import the actual middleware and the mocked modules (after mocks registered)
		const authMod = await import('../middleware/auth.js');
		authorize = authMod.default;

		const jwtMod = await import('jsonwebtoken');
		jwt = jwtMod.default;

		const userMod = await import('../models/User.js');
		User = userMod.default;
	});

	beforeEach(() => {
		jest.resetAllMocks();
		// ensure the middleware sees a JWT secret during tests
		process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
	});

	test('returns 401 when token missing', async () => {
		// No Authorization header and no cookie -> should return 401 early
		const req = { headers: {}, cookies: {} };
		const res = makeRes();
		const next = jest.fn();

		await authorize(req, res, next);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized: token missing' });
		expect(next).not.toHaveBeenCalled();
	});

	test('returns 401 when token invalid (jwt.verify throws)', async () => {
		// If jwt.verify throws, middleware should catch and return an Unauthorized error
		const req = { headers: { authorization: 'Bearer bad.token' }, cookies: {} };
		const res = makeRes();
		const next = jest.fn();

		jwt.verify.mockImplementation(() => {
			throw new Error('invalid token');
		});

		await authorize(req, res, next);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({
				message: 'Unauthorized',
				error: 'invalid token',
			})
		);
		expect(next).not.toHaveBeenCalled();
	});

	test('returns 401 when user not found', async () => {
		// Simulate a valid token but user does not exist in DB
		const tokenPayload = { userId: '507f1f77bcf86cd799439011' };
		const req = { headers: { authorization: 'Bearer ok.token' }, cookies: {} };
		const res = makeRes();
		const next = jest.fn();

		jwt.verify.mockReturnValue(tokenPayload);

		// Important: middleware calls User.findById(...).select('-password')
		// So our mock must return an object with select() that resolves to null.
		User.findById.mockReturnValue({
			select: jest.fn().mockResolvedValue(null),
		});

		await authorize(req, res, next);

		expect(jwt.verify).toHaveBeenCalled();
		expect(User.findById).toHaveBeenCalledWith(tokenPayload.userId);
		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized: user not found' });
		expect(next).not.toHaveBeenCalled();
	});

	test('attaches user to req and calls next when token valid', async () => {
		// Simulate valid token and existing user -> middleware should attach req.user and call next()
		const tokenPayload = { userId: '507f1f77bcf86cd799439011' };
		const userObj = { _id: tokenPayload.userId, email: 'a@b.com' };

		const req = { headers: { authorization: 'Bearer ok.token' }, cookies: {} };
		const res = makeRes();
		const next = jest.fn();

		jwt.verify.mockReturnValue(tokenPayload);

		// findById returns object with select() that resolves to the user object
		User.findById.mockReturnValue({
			select: jest.fn().mockResolvedValue(userObj),
		});

		await authorize(req, res, next);

		expect(User.findById).toHaveBeenCalledWith(tokenPayload.userId);
		expect(req.user).toEqual(userObj);
		expect(next).toHaveBeenCalled();
		expect(res.status).not.toHaveBeenCalled();
	});
});

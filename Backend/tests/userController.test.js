import { jest } from '@jest/globals';

let deleteUser;
let User;
let Organization;
let Log;
let Notification;
let ApiKey;

const makeRes = () => {
	const res = {};
	res.status = jest.fn().mockReturnValue(res);
	res.json = jest.fn().mockReturnValue(res);
	return res;
};

describe('userController deleteUser', () => {
	beforeAll(async () => {
		await jest.unstable_mockModule('../models/User.js', () => ({
			__esModule: true,
			default: {
				findById: jest.fn(),
				deleteOne: jest.fn(),
				updateMany: jest.fn(),
			},
		}));

		await jest.unstable_mockModule('../models/Organization.js', () => ({
			__esModule: true,
			default: {
				findById: jest.fn(),
				deleteOne: jest.fn(),
				updateOne: jest.fn(),
			},
		}));

		await jest.unstable_mockModule('../models/Log.js', () => ({
			__esModule: true,
			default: {
				deleteMany: jest.fn(),
			},
		}));

		await jest.unstable_mockModule('../models/Notification.js', () => ({
			__esModule: true,
			default: {
				deleteMany: jest.fn(),
			},
		}));

		await jest.unstable_mockModule('../models/ApiKey.js', () => ({
			__esModule: true,
			default: {
				deleteMany: jest.fn(),
			},
		}));

		const ctrl = await import('../controllers/userController.js');
		deleteUser = ctrl.deleteUser;

		User = (await import('../models/User.js')).default;
		Organization = (await import('../models/Organization.js')).default;
		Log = (await import('../models/Log.js')).default;
		Notification = (await import('../models/Notification.js')).default;
		ApiKey = (await import('../models/ApiKey.js')).default;
	});

	beforeEach(() => {
		jest.resetAllMocks();
		Log.deleteMany.mockResolvedValue({ acknowledged: true });
		Notification.deleteMany.mockResolvedValue({ acknowledged: true });
		ApiKey.deleteMany.mockResolvedValue({ acknowledged: true });
		User.updateMany.mockResolvedValue({ acknowledged: true });
		User.deleteOne.mockResolvedValue({ acknowledged: true });
		Organization.deleteOne.mockResolvedValue({ acknowledged: true });
		Organization.updateOne.mockResolvedValue({ acknowledged: true });
	});

	test('deleting an organization owner removes org-related data and clears member org links', async () => {
		const req = { params: { id: 'user1' } };
		const res = makeRes();
		const next = jest.fn();

		User.findById.mockResolvedValue({ _id: 'user1', organization: 'org1' });
		Organization.findById.mockReturnValue({
			select: jest.fn().mockResolvedValue({
				_id: 'org1',
				owner: { toString: () => 'user1' },
				members: [{ user: { toString: () => 'user1' } }, { user: { toString: () => 'user2' } }],
			}),
		});

		await deleteUser(req, res, next);

		expect(Log.deleteMany).toHaveBeenNthCalledWith(1, { user: 'user1' });
		expect(Notification.deleteMany).toHaveBeenNthCalledWith(1, { user: 'user1' });
		expect(ApiKey.deleteMany).toHaveBeenCalledWith({ org: 'org1' });
		expect(Log.deleteMany).toHaveBeenNthCalledWith(2, { organization: 'org1' });
		expect(Notification.deleteMany).toHaveBeenNthCalledWith(2, { organization: 'org1' });
		expect(User.updateMany).toHaveBeenCalledWith(
			{ _id: { $in: ['user2'] } },
			{ $unset: { organization: 1 } },
		);
		expect(Organization.deleteOne).toHaveBeenCalledWith({ _id: 'org1' });
		expect(User.deleteOne).toHaveBeenCalledWith({ _id: 'user1' });
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({ success: true, message: 'user deleted successfully' });
	});

	test('deleting a non-owner removes the member from the organization', async () => {
		const req = { params: { id: 'user2' } };
		const res = makeRes();
		const next = jest.fn();

		User.findById.mockResolvedValue({ _id: 'user2', organization: 'org1' });
		Organization.findById.mockReturnValue({
			select: jest.fn().mockResolvedValue({
				_id: 'org1',
				owner: { toString: () => 'owner1' },
				members: [{ user: { toString: () => 'owner1' } }, { user: { toString: () => 'user2' } }],
			}),
		});

		await deleteUser(req, res, next);

		expect(Organization.updateOne).toHaveBeenCalledWith(
			{ _id: 'org1' },
			{ $pull: { members: { user: 'user2' } } },
		);
		expect(ApiKey.deleteMany).not.toHaveBeenCalled();
		expect(Organization.deleteOne).not.toHaveBeenCalled();
		expect(User.deleteOne).toHaveBeenCalledWith({ _id: 'user2' });
		expect(res.status).toHaveBeenCalledWith(200);
	});
});

import { jest } from '@jest/globals';

// logs
let getLogs, createLog, updateLog, deleteLog, getLog, Log, Organization;

// fake express res object with spyable methods
const makeRes = () => {
	const res = {};

	res.status = jest.fn().mockReturnValue(res);
	res.json = jest.fn().mockReturnValue(res);

	return res;
};

describe('logController', () => {
	beforeAll(async () => {
		// register mock for Log model before importing controller
		await jest.unstable_mockModule('../models/Log.js', () => ({
			__esModule: true,
			default: {
				find: jest.fn(),
				create: jest.fn(),
				findById: jest.fn(),
				findByIdAndUpdate: jest.fn(),
			},
		}));

		await jest.unstable_mockModule('../models/Organization.js', () => ({
			__esModule: true,
			default: {
				findById: jest.fn(),
				updateOne: jest.fn(),
				findOneAndUpdate: jest.fn(),
			},
		}));

		// import controller fns after mock is in place
		const ctrlMod = await import('../controllers/logController.js');

		getLogs = ctrlMod.getLogs;
		createLog = ctrlMod.createLog;
		updateLog = ctrlMod.updateLog;
		deleteLog = ctrlMod.deleteLog;
		// TODO: fix later
		getLog = ctrlMod.getLog;

		// import mocked log model to configure behavior in tests
		const LogMod = await import('../models/Log.js');
		Log = LogMod.default;

		const OrgMod = await import('../models/Organization.js');
		Organization = OrgMod.default;
	});

	beforeEach(() => {
		jest.resetAllMocks();
		Organization.findById.mockReturnValue({
			select: jest.fn().mockResolvedValue({
				_id: 'org1',
				plan: 'free',
				limits: { logsPerMonth: 20 },
			}),
		});
		Organization.updateOne.mockResolvedValue({ acknowledged: true });
		Organization.findOneAndUpdate.mockResolvedValue({ _id: 'org1', usage: { logCount: 1 } });
	});

	// get logs
	describe('getLogs', () => {
		test('returns paginated logs for authenticated users (legacy no org)', async () => {
			const fakeLogs = [{ title: 'logtitle1' }, { title: 'logtitle2' }];
			const sortMock = jest.fn().mockReturnThis();
			const skipMock = jest.fn().mockReturnThis();
			const leanMock = jest.fn().mockResolvedValue(fakeLogs);
			const limitMock = jest.fn().mockReturnValue({ lean: leanMock });
			Log.find.mockReturnValue({ sort: sortMock, skip: skipMock, limit: limitMock });
			Log.countDocuments = jest.fn().mockResolvedValue(2);

			const req = { user: { _id: 'user1' }, query: {} };
			const res = makeRes();
			const next = jest.fn();

			await getLogs(req, res, next);

			expect(Log.find).toHaveBeenCalledWith({ user: 'user1' });
			expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
			expect(skipMock).toHaveBeenCalledWith(0); // page 1
			expect(limitMock).toHaveBeenCalledWith(20); // default limit
			expect(leanMock).toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					success: true,
					data: fakeLogs,
					pagination: expect.objectContaining({ page: 1, limit: 20, total: 2, pages: 1 }),
				}),
			);
		});
	});

	// create log
	describe('createLog', () => {
		test('requires title', async () => {
			const req = { body: {}, user: { _id: 'user1' } };
			const res = makeRes();
			const next = jest.fn();

			await createLog(req, res, next);

			// returns 400 if title is missing
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ message: 'title is required' });
		});

		test('normalizes tags string into array and creates log', async () => {
			// log.create resolves to created object
			const created = { title: 'T', tags: ['a', 'b'], user: 'user1', organization: 'org1' };
			Log.create.mockResolvedValue(created);

			// mock body args
			const req = {
				body: { title: 'T', tags: 'a, b' },
				user: { _id: 'user1', organization: 'org1' },
			};
			const res = makeRes();
			const next = jest.fn();

			// act
			await createLog(req, res, next);

			// assert => tag string normalized & create called with expected payload
			expect(Log.create).toHaveBeenCalledWith({
				title: 'T',
				description: undefined,
				tags: ['a', 'b'],
				user: 'user1',
				organization: 'org1',
			});
			expect(res.status).toHaveBeenCalledWith(201);
			// Controller includes a message field, verify success and return data
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({ success: true, data: created }),
			);
		});
	});

	// update log
	describe('updateLog', () => {
		test('returns 404 when not found', async () => {
			Log.findById.mockResolvedValue(null);

			// fetch params, body & user of log
			const req = { params: { id: 'log1' }, body: {}, user: { _id: 'user1' } };
			const res = makeRes();
			const next = jest.fn();

			await updateLog(req, res, next);

			// if log not found
			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({ message: 'Log not found' });
		});

		test('returns 403 when user is not owner', async () => {
			// findById returns a doc, whose user is a different id
			Log.findById.mockResolvedValue({ user: 'otherUser' });

			// fetch params, body & user of log
			const req = { params: { id: 'log1' }, body: {}, user: { _id: 'user1' } };
			const res = makeRes();
			const next = jest.fn();

			await updateLog(req, res, next);

			// if not owner of log
			expect(res.status).toHaveBeenCalledWith(403);
			expect(res.json).toHaveBeenCalledWith({
				message: 'Forbidden: only the log owner can modify this log',
			});
		});

		// finally updates if owner matches
		test('updates when owner', async () => {
			const original = { _id: 'log1', user: 'user1' };
			const updated = { _id: 'log1', title: 'Updated' };

			Log.findById.mockResolvedValue(original);
			Log.findByIdAndUpdate.mockResolvedValue(updated);

			// get params, body & user of log
			const req = { params: { id: 'log1' }, body: { title: 'Updated' }, user: { _id: 'user1' } };
			const res = makeRes();
			const next = jest.fn();

			await updateLog(req, res, next);

			expect(Log.findByIdAndUpdate).toHaveBeenCalledWith(
				'log1',
				{ title: 'Updated' },
				{ new: true, runValidators: true },
			);
			expect(res.status).toHaveBeenCalledWith(200);

			// controller includes a message field, verify success & returned data
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({ success: true, data: updated }),
			);
		});
	});

	// delete log
	describe('deleteLog', () => {
		test('returns 404 when not found', async () => {
			Log.findById.mockResolvedValue(null);

			// get params, body & user of log
			const req = { params: { id: 'log1' }, user: { _id: 'user1' } };
			const res = makeRes();
			const next = jest.fn();

			await deleteLog(req, res, next);

			expect(res.status).toHaveBeenCalledWith(404);

			//"log not found" => case-insensitive
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({ message: expect.stringMatching(/log not found/i) }),
			);
		});

		// if not owner
		test('returns 403 when not owner', async () => {
			Log.findById.mockResolvedValue({ user: 'otherUser' });

			//  params, body & user of log
			const req = { params: { id: 'log1' }, user: { _id: 'user1' } };
			const res = makeRes();
			const next = jest.fn();

			await deleteLog(req, res, next);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(res.json).toHaveBeenCalledWith({
				message: 'Forbidden: only the log owner can delete this log',
			});
		});

		test('deletes when owner', async () => {
			const deleteOne = jest.fn().mockResolvedValue();
			Log.findById.mockResolvedValue({ _id: 'log1', user: 'user1', deleteOne });

			// get params, body & user of log
			const req = { params: { id: 'log1' }, user: { _id: 'user1' } };
			const res = makeRes();
			const next = jest.fn();

			await deleteLog(req, res, next);

			// finally delete
			expect(deleteOne).toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(200);

			//log deleted & returns success:true
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({ success: true, message: expect.stringMatching(/log deleted/i) }),
			);
		});
	});
});

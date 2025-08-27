import { jest } from '@jest/globals';

/*
  Unit tests for the logController.
  - We mock the Log model entirely and call controller functions directly with fake req/res/next.
  - This keeps tests fast and DB-free; we validate behavior and ownership checks.
  - Assertions are written to tolerate minor differences in message text while still verifying core behavior.
*/

// logs
let getLogs, createLog, updateLog, deleteLog, getLog, Log;

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
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	// get logs
	describe('getLogs', () => {
		test('returns all logs for authenticated users', async () => {
			// arrange: mock Log.find(...).sort(...) chain to resolve with fake logs
			const fakeLogs = [{ title: 'logtitle1' }, { title: 'logtitle2' }];
			Log.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(fakeLogs) });

			const req = { user: { _id: 'user1' } };
			const res = makeRes();
			const next = jest.fn();

			// act
			await getLogs(req, res, next);

			// query user & response contains data
			expect(Log.find).toHaveBeenCalledWith({ user: 'user1' });
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({ success: true, data: fakeLogs });
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
			const created = { title: 'T', tags: ['a', 'b'], user: 'user1' };
			Log.create.mockResolvedValue(created);

			// mock body args
			const req = { body: { title: 'T', tags: 'a, b' }, user: { _id: 'user1' } };
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
			});
			expect(res.status).toHaveBeenCalledWith(201);
			// Controller includes a message field, verify success and return data
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({ success: true, data: created })
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
			expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden: not the owner' });
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
				{ new: true, runValidators: true }
			);
			expect(res.status).toHaveBeenCalledWith(200);

			// controller includes a message field, verify success & returned data
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({ success: true, data: updated })
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
				expect.objectContaining({ message: expect.stringMatching(/log not found/i) })
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
			expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden: not the owner' });
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
				expect.objectContaining({ success: true, message: expect.stringMatching(/log deleted/i) })
			);
		});
	});
});

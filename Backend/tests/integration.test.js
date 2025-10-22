import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

// internal
import app from '../server.js';

let mongo;

beforeAll(async () => {
	mongo = await MongoMemoryServer.create();
	const uri = mongo.getUri();
	// ensure connect uses in tests if invoked
	process.env.MONGODB_URL = uri;
	await mongoose.connect(uri);
});

afterAll(async () => {
	await mongoose.disconnect();
	if (mongo) await mongo.stop();
});

describe('Integration: auth + logs', () => {
	let token;
	test('sign-up returns token & user', async () => {
		const res = await request(app)
			.post('/api/v1/auth/sign-up')
			.send({ name: 'Alice', email: 'alice@example.com', password: 'pass1234' })
			.expect(201);
		expect(res.body.token).toBeDefined();
		token = res.body.token;
	});

	test('create log', async () => {
		const res = await request(app)
			.post('/api/v1/logs')
			.set('Authorization', `Bearer ${token}`)
			.send({ title: 'First Log', description: 'Testing', level: 'info', tags: ['test'] })
			.expect(201);
		expect(res.body.data.title).toBe('First Log');
	});
});

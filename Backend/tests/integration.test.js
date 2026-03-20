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
	let organizationId;
	test('sign-up returns token & user', async () => {
		const res = await request(app)
			.post('/api/v1/auth/sign-up')
			.send({ name: 'Alice', email: 'alice@example.com', password: 'pass1234' })
			.expect(201);
		expect(res.body.token).toBeDefined();
		token = res.body.token;
		organizationId = res.body.organization?._id;
	});

	test('create log', async () => {
		const res = await request(app)
			.post('/api/v1/logs')
			.set('Authorization', `Bearer ${token}`)
			.send({ title: 'First Log', description: 'Testing', level: 'info', tags: ['test'] })
			.expect(201);
		expect(res.body.data.title).toBe('First Log');
	});

	test('owner can invite by email and invited sign-up joins the same organization', async () => {
		const inviteRes = await request(app)
			.post('/api/v1/organizations/members')
			.set('Authorization', `Bearer ${token}`)
			.send({ email: 'bob@example.com' })
			.expect(201);

		expect(inviteRes.body.message).toMatch(/Invitation/);
		expect(inviteRes.body.data.email).toBe('bob@example.com');
		expect(inviteRes.body.data.invitationUrl).toBeDefined();

		const inviteUrl = new URL(inviteRes.body.data.invitationUrl);
		const inviteToken = inviteUrl.searchParams.get('inviteToken');
		expect(inviteToken).toBeTruthy();

		const inviteDetailsRes = await request(app)
			.get(`/api/v1/auth/invitations/${inviteToken}`)
			.expect(200);

		expect(inviteDetailsRes.body.data.email).toBe('bob@example.com');
		expect(inviteDetailsRes.body.data.organization._id.toString()).toBe(organizationId.toString());

		const signupRes = await request(app)
			.post('/api/v1/auth/sign-up')
			.send({
				name: 'Bob',
				email: 'bob@example.com',
				password: 'pass1234',
				inviteToken,
			})
			.expect(201);

		expect(signupRes.body.organization._id.toString()).toBe(organizationId.toString());
		expect(signupRes.body.organization.name).toBe("Alice's Org");

		const bobToken = signupRes.body.token;
		const membersRes = await request(app)
			.get('/api/v1/organizations/members')
			.set('Authorization', `Bearer ${token}`)
			.expect(200);

		expect(membersRes.body.data).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ user: expect.objectContaining({ email: 'bob@example.com' }) }),
			]),
		);

		const bobNotificationsRes = await request(app)
			.get('/api/v1/notifications')
			.set('Authorization', `Bearer ${bobToken}`)
			.expect(200);

		expect(bobNotificationsRes.body.data).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ text: expect.stringContaining('You were added to') }),
			]),
		);
	});

	test('invited user sign-up without using invite link still joins organization', async () => {
		// Create new owner
		const ownerRes = await request(app)
			.post('/api/v1/auth/sign-up')
			.send({ name: 'Charlie', email: 'charlie@example.com', password: 'pass1234' })
			.expect(201);

		const ownerToken = ownerRes.body.token;
		const ownerOrgId = ownerRes.body.organization._id;

		// Send invite to david@example.com
		await request(app)
			.post('/api/v1/organizations/members')
			.set('Authorization', `Bearer ${ownerToken}`)
			.send({ email: 'david@example.com' })
			.expect(201);

		// David signs up WITHOUT using the invite link
		const davidSignupRes = await request(app)
			.post('/api/v1/auth/sign-up')
			.send({
				name: 'David',
				email: 'david@example.com',
				password: 'pass1234',
				// NO inviteToken provided
			})
			.expect(201);

		// David should be in Charlie's organization (not his own)
		expect(davidSignupRes.body.organization._id.toString()).toBe(ownerOrgId.toString());
		expect(davidSignupRes.body.organization.name).toBe("Charlie's Org");
		expect(davidSignupRes.body.message).toMatch(/Invitation/);

		// Verify David is listed as member
		const membersRes = await request(app)
			.get('/api/v1/organizations/members')
			.set('Authorization', `Bearer ${ownerToken}`)
			.expect(200);

		expect(membersRes.body.data).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ user: expect.objectContaining({ email: 'david@example.com' }) }),
			]),
		);
	});
});

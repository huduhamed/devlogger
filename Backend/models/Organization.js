import mongoose from 'mongoose';

// org schema
const organizationSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		slug: { type: String, required: true, unique: true, lowercase: true },
		owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		members: [
			{
				user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
				role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
				joinedAt: { type: Date, default: Date.now },
			},
		],
		plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
		billing: {
			customerId: { type: String },
			subscriptionId: { type: String },
			status: { type: String },
			currentPeriodEnd: { type: Date },
			lastPurchaseEmailAt: { type: Date },
			lastPurchaseEmailPlan: { type: String },
			lastPurchaseEmailSubscriptionId: { type: String },
		},
		limits: {
			logsPerMonth: { type: Number, default: 10 },
			members: { type: Number, default: 5 },
		},
		usage: {
			month: { type: String },
			logCount: { type: Number, default: 0 },
		},
		apiKeys: [
			{
				name: { type: String, required: true },
				keyHash: { type: String, required: true },
				createdAt: { type: Date, default: Date.now },
				lastUsedAt: { type: Date },
				revoked: { type: Boolean, default: false },
			},
		],
	},
	{ timestamps: true },
);

const Organization = mongoose.model('Organization', organizationSchema);

export default Organization;

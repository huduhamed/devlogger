import mongoose from 'mongoose';

// organization schema
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
		limits: {
			logsPerMonth: { type: Number, default: 10000 },
			members: { type: Number, default: 5 },
		},
	},
	{ timestamps: true }
);

organizationSchema.index({ slug: 1 });

const Organization = mongoose.model('Organization', organizationSchema);
export default Organization;

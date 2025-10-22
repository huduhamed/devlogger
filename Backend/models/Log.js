import mongoose from 'mongoose';

const { Schema } = mongoose;

// log schema
const logSchema = new mongoose.Schema(
	{
		title: { type: String, trim: true, required: true },
		description: { type: String, trim: true },
		level: {
			type: String,
			enum: ['debug', 'info', 'warn', 'error'],
			default: 'info',
		},
		tags: [{ type: String }],
		meta: { type: Schema.Types.Mixed },
		user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
	},
	{
		timestamps: true,
	}
);

// common query/index for fetching recent logs per user
logSchema.index({ user: 1, createdAt: -1 });
logSchema.index({ organization: 1, createdAt: -1 });
logSchema.index({ organization: 1, user: 1, createdAt: -1 });

// full text search (basic) on title & description
logSchema.index({ title: 'text', description: 'text' });

const Log = mongoose.model('Log', logSchema);

export default Log;

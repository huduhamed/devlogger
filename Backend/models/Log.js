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
		timestamp: { type: Date, default: Date.now },
	},
	{
		timestamps: true,
	}
);

// common query/index for fetching recent logs per user
logSchema.index({ user: 1, timestamp: -1 });

const Log = mongoose.model('Log', logSchema);

export default Log;

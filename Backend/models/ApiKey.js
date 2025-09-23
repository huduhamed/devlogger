import mongoose from 'mongoose';

const apiKeySchema = new mongoose.Schema(
	{
		org: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true, required: true },
		name: { type: String, required: true },
		keyId: { type: String, required: true, unique: true }, // public id part
		keyHash: { type: String, required: true }, // hash of secret part
		revoked: { type: Boolean, default: false, index: true },
		lastUsedAt: { type: Date },
	},
	{ timestamps: true }
);

// apiKeySchema.index({ keyId: 1 });
apiKeySchema.index({ org: 1, revoked: 1 });

const ApiKey = mongoose.model('ApiKey', apiKeySchema);
export default ApiKey;

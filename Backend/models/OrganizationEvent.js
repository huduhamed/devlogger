import mongoose from 'mongoose';

const OrganizationEventSchema = new mongoose.Schema(
	{
		organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
		type: { type: String, required: true },
		actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
		data: { type: mongoose.Schema.Types.Mixed },
	},
	{ timestamps: true },
);

export default mongoose.model('OrganizationEvent', OrganizationEventSchema);

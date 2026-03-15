import mongoose from 'mongoose';

// org invite schema
const organizationInviteSchema = new mongoose.Schema(
	{
		organization: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Organization',
			required: true,
			index: true,
		},
		invitedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		email: {
			type: String,
			required: true,
			trim: true,
			lowercase: true,
			index: true,
		},
		role: {
			type: String,
			enum: ['admin', 'member'],
			default: 'member',
		},
		tokenHash: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		status: {
			type: String,
			enum: ['pending', 'accepted', 'revoked', 'expired'],
			default: 'pending',
			index: true,
		},
		expiresAt: {
			type: Date,
			required: true,
			index: true,
		},
		acceptedAt: {
			type: Date,
		},
		acceptedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
	},
	{ timestamps: true },
);

organizationInviteSchema.index({ organization: 1, email: 1, status: 1 });

const OrganizationInvite = mongoose.model('OrganizationInvite', organizationInviteSchema);

export default OrganizationInvite;

import mongoose from 'mongoose';

// support ticket
const supportTicketSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			trim: true,
		},
		email: {
			type: String,
			trim: true,
			lowercase: true,
			required: true,
		},
		subject: {
			type: String,
			trim: true,
			required: true,
		},
		message: {
			type: String,
			trim: true,
			required: true,
		},
		metadata: {
			type: mongoose.Schema.Types.Mixed,
			default: {},
		},
		status: {
			type: String,
			enum: ['open', 'sent', 'failed'],
			default: 'open',
		},
		delivered: {
			type: Boolean,
			default: false,
		},
		deliveryError: {
			type: String,
			trim: true,
		},
	},
	{ timestamps: true },
);

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

export default SupportTicket;

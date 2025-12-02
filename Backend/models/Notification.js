import mongoose from 'mongoose';

// notif schema
const notificationSchema = new mongoose.Schema(
	{
		user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
		organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: false },
		text: { type: String, required: [true, 'text is required'] },
		data: { type: Object, default: {} },
		read: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;

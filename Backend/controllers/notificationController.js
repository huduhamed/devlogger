// internal imports
import Notification from '../models/Notification.js';

// GET /api/v1/notifications
export async function getNotifications(req, res, next) {
	try {
		const userId = req.user?._id;
		const orgId = req.user?.organization;

		// fetch notifications for the user or their organization
		const filter = {
			$or: [{ user: userId }, { organization: orgId }],
		};

		// limit to 50 recent notifications, use lean() for performance
		const notifications = await Notification.find(filter)
			.sort({ createdAt: -1 })
			.limit(50)
			.lean();

		const unread = await Notification.countDocuments({ ...filter, read: false });

		return res.status(200).json({ data: notifications, meta: { unread } });
	} catch (err) {
		next(err);
	}
}

// POST /api/v1/notifications/mark-all-read
export async function markAllRead(req, res, next) {
	try {
		const userId = req.user?._id;
		const orgId = req.user?.organization;

		const filter = { $or: [{ user: userId }, { organization: orgId }] };
		await Notification.updateMany(filter, { $set: { read: true } });

		return res.status(200).json({ message: 'marked all as read' });
	} catch (err) {
		next(err);
	}
}

// POST /api/v1/notifications/:id/mark-read
export async function markRead(req, res, next) {
	try {
		const { id } = req.params;
		const userId = req.user?._id;
		const orgId = req.user?.organization;

		const notification = await Notification.findById(id);
		if (!notification) return res.status(404).json({ message: 'notification not found' });

		// ensure the user has access
		if (notification.user && !notification.user.equals(userId)) {
			// if notification is for org, allow if same org
			if (!notification.organization || !notification.organization.equals(orgId)) {
				return res.status(403).json({ message: 'forbidden' });
			}
		}

		notification.read = true;
		await notification.save();

		return res.status(200).json({ message: 'marked read' });
	} catch (err) {
		next(err);
	}
}

// POST /api/v1/notifications
export async function createNotification(req, res, next) {
	try {
		const { user, organization, text, data } = req.body;
		if (!text) return res.status(400).json({ message: 'text is required' });

		const n = await Notification.create({ user, organization, text, data });

		// emit real-time event to socket.io rooms if io is available
		try {
			const io = req.app.get('io');
			if (io) {
				// notify user-specific room
				if (n.user) {
					io.to(`user:${n.user.toString()}`).emit('notification', n);
				}
				// notify organization room
				if (n.organization) {
					io.to(`org:${n.organization.toString()}`).emit('notification', n);
				}
			}
		} catch (e) {
			// ignore socket errors
		}

		return res.status(201).json({ data: n });
	} catch (err) {
		next(err);
	}
}

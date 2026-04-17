// internal imports
import Notification from '../models/Notification.js';
import { sendMemberAddedEmail } from './sendOrganizationInviteEmail.js';

export function emitNotification(app, notification) {
	try {
		const io = app?.get?.('io');
		if (!io) return;

		if (notification.user) {
			io.to(`user:${notification.user.toString()}`).emit('notification', notification);
		} else if (notification.organization) {
			io.to(`org:${notification.organization.toString()}`).emit('notification', notification);
		}
	} catch {
		// ignore real-time delivery failures
	}
}
// member add notif.
export async function createMemberAddedNotifications({
	app,
	organization,
	actor,
	addedUser,
	existingMembers,
}) {
	const actorId = actor?._id?.toString();
	const addedUserId = addedUser._id.toString();
	const orgId = organization._id;
	const orgName = organization.name || 'the organization';
	const actorName = actor?.name || actor?.email || 'A team member';

	const teammateNotifications = existingMembers
		.map((member) => member.user?.toString?.() || member.user?.toString())
		.filter(Boolean)
		.filter((memberId) => memberId !== actorId && memberId !== addedUserId)
		.map((memberId) => ({
			user: memberId,
			organization: orgId,
			text: `${addedUser.name || addedUser.email} was added to ${orgName}.`,
			data: {
				type: 'organization.member_added',
				addedUserId,
				addedUserEmail: addedUser.email,
				actorUserId: actorId,
				actorName,
				organizationId: orgId.toString(),
			},
		}));

	const memberNotification = {
		user: addedUser._id,
		organization: orgId,
		text: `You were added to ${orgName} by ${actorName}.`,
		data: {
			type: 'organization.added_to_org',
			addedUserId,
			addedUserEmail: addedUser.email,
			actorUserId: actorId,
			actorName,
			organizationId: orgId.toString(),
		},
	};

	const notifications = [...teammateNotifications, memberNotification];
	const createdNotifications = await Notification.insertMany(notifications);
	createdNotifications.forEach((notification) => emitNotification(app, notification));

	try {
		await sendMemberAddedEmail({
			to: addedUser.email,
			inviterName: actorName,
			organizationName: orgName,
			manageUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/organization`,
		});
	} catch {
		// Keep in-app notifications reliable even if email delivery fails.
	}
}

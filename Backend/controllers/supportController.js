// internal imports
import SupportTicket from '../models/SupportTicket.js';
import { sendSupportTicketEmail } from '../utils/sendSupportTicketEmail.js';

export async function createSupportTicket(req, res, next) {
	try {
		const { name, email, subject, message, metadata = {} } = req.body;
		const normalizedEmail = email.trim().toLowerCase();
		const cleanName = name?.trim();

		const ticket = await SupportTicket.create({
			name: cleanName,
			email: normalizedEmail,
			subject: subject.trim(),
			message: message.trim(),
			metadata,
		});

		let deliveryResult = { delivered: false };
		try {
			deliveryResult = await sendSupportTicketEmail({
				name: cleanName,
				email: normalizedEmail,
				subject: subject.trim(),
				message: message.trim(),
				metadata,
			});
			ticket.status = 'sent';
			ticket.delivered = true;
			await ticket.save();
		} catch (deliveryError) {
			ticket.status = 'failed';
			ticket.deliveryError = deliveryError?.message || 'Failed to deliver support email.';
			await ticket.save();
		}

		return res.status(201).json({
			success: true,
			message: 'Your support message has been received.',
			data: {
				id: ticket._id,
				delivered: deliveryResult.delivered,
				to: deliveryResult.to || null,
			},
		});
	} catch (err) {
		next(err);
	}
}

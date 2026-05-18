import { Resend } from 'resend';

// internal imports
import { RESEND_API_KEY, RESEND_FROM_EMAIL, SUPPORT_EMAIL_TO } from '../config/env.js';
import { renderSupportTicketEmail } from '../emails/support-ticket-email.js';

function canSendEmail() {
	return Boolean(RESEND_API_KEY) && process.env.NODE_ENV !== 'test';
}

function getResendClient() {
	if (!canSendEmail()) return null;
	return new Resend(RESEND_API_KEY);
}

export async function sendSupportTicketEmail({ name, email, subject, message, metadata }) {
	const resend = getResendClient();
	const to = SUPPORT_EMAIL_TO || 'hudu.contact@gmail.com';

	if (!resend) {
		if (process.env.NODE_ENV !== 'test') {
			console.log(`Support ticket email not sent for ${email}. Subject: ${subject}`);
		}
		return { delivered: false, to };
	}

	const from = RESEND_FROM_EMAIL || 'Devlogger Support <onboarding@resend.dev>';
	const html = renderSupportTicketEmail({
		name,
		email,
		subject,
		message,
		metadata,
	});
	const textParts = [
		`New Devlogger support ticket`,
		`From: ${name || 'Anonymous'} <${email}>`,
		`Subject: ${subject}`,
		'',
		message,
	];
	if (metadata && Object.keys(metadata).length > 0) {
		textParts.push('', 'Context:');
		for (const [key, value] of Object.entries(metadata)) {
			textParts.push(`- ${key}: ${String(value)}`);
		}
	}

	await resend.emails.send({
		from,
		to,
		replyTo: email,
		subject: `[Devlogger Support] ${subject}`,
		text: textParts.join('\n'),
		html,
	});

	return { delivered: true, to };
}

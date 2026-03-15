import nodemailer from 'nodemailer';

import {
	SMTP_FROM,
	SMTP_HOST,
	SMTP_PASS,
	SMTP_PORT,
	SMTP_SECURE,
	SMTP_USER,
} from '../config/env.js';

let transporter;

function canSendEmail() {
	return Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS);
}

// transport
function getTransporter() {
	if (!canSendEmail()) return null;
	if (!transporter) {
		transporter = nodemailer.createTransport({
			host: SMTP_HOST,
			port: Number(SMTP_PORT),
			secure: String(SMTP_SECURE || '').toLowerCase() === 'true' || Number(SMTP_PORT) === 465,
			auth: {
				user: SMTP_USER,
				pass: SMTP_PASS,
			},
		});
	}
	return transporter;
}

// send org invite
export async function sendOrganizationInviteEmail({
	to,
	organizationName,
	inviterName,
	inviteUrl,
}) {
	const mailer = getTransporter();
	if (!mailer) {
		if (process.env.NODE_ENV !== 'test') {
			console.log(
				`Invite email not sent for ${to}. Configure SMTP to enable delivery. Link: ${inviteUrl}`,
			);
		}
		return { delivered: false, inviteUrl };
	}

	await mailer.sendMail({
		from: SMTP_FROM || SMTP_USER,
		to,
		subject: `You're invited to join ${organizationName} on DevLogger`,
		text: `${inviterName} invited you to join ${organizationName} on DevLogger. Create your account here: ${inviteUrl}`,
		html: `
			<div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
				<h2 style="margin-bottom: 12px;">You're invited to join ${organizationName}</h2>
				<p>${inviterName} invited you to collaborate on DevLogger.</p>
				<p style="margin: 24px 0;">
					<a href="${inviteUrl}" style="display: inline-block; padding: 12px 20px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 8px;">Accept invite and sign up</a>
				</p>
				<p>If the button does not work, copy and paste this link into your browser:</p>
				<p><a href="${inviteUrl}">${inviteUrl}</a></p>
			</div>
		`,
	});

	return { delivered: true, inviteUrl };
}

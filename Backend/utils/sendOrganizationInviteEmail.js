import { Resend } from 'resend';

// internal imports
import { RESEND_API_KEY, RESEND_FROM_EMAIL } from '../config/env.js';

// send email
function canSendEmail() {
	return Boolean(RESEND_API_KEY);
}

// resend client
function getResendClient() {
	if (!canSendEmail()) return null;
	return new Resend(RESEND_API_KEY);
}

// escapes
function escapeHtml(value = '') {
	return String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

// send org invite
export async function sendOrganizationInviteEmail({
	to,
	organizationName,
	inviterName,
	inviteUrl,
}) {
	const resend = getResendClient();
	if (!resend) {
		if (process.env.NODE_ENV !== 'test') {
			console.log(`Invite email not sent for ${to}. Link: ${inviteUrl}`);
		}
		return { delivered: false, inviteUrl };
	}

	const safeOrg = escapeHtml(organizationName);
	const safeInviter = escapeHtml(inviterName);
	const safeUrl = escapeHtml(inviteUrl);

	await resend.emails.send({
		from: RESEND_FROM_EMAIL || 'DevLogger <onboarding@resend.dev>',
		to,
		subject: `Join ${organizationName} on DevLogger`,
		text: `${inviterName} invited you to join ${organizationName} on DevLogger. Accept your invitation and create your account here: ${inviteUrl}`,
		html: `
			<div style="background:#f8fafc;padding:28px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
				<div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
					<div style="padding:20px 24px;background:#0f172a;color:#f8fafc;">
						<div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.85;">DevLogger Invitation</div>
						<h2 style="margin:8px 0 0;font-size:24px;line-height:1.25;">You have been invited to join ${safeOrg}</h2>
					</div>
					<div style="padding:24px;line-height:1.6;font-size:15px;">
						<p style="margin:0 0 14px;">${safeInviter} added you to their team workspace in DevLogger.</p>
						<p style="margin:0 0 22px;">Accept this invitation to create your account and start collaborating right away.</p>
						<p style="margin:0 0 18px;">
							<a href="${safeUrl}" style="display:inline-block;padding:12px 18px;background:#111827;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;">Accept invitation</a>
						</p>
						<p style="margin:0;color:#64748b;font-size:13px;">If the button does not work, copy and paste this link into your browser:</p>
						<p style="margin:8px 0 0;"><a href="${safeUrl}" style="color:#2563eb;word-break:break-all;">${safeUrl}</a></p>
					</div>
				</div>
			</div>
		`,
	});

	return { delivered: true, inviteUrl };
}

// send password reset email
export async function sendPasswordResetEmail({ to, resetUrl }) {
	const resend = getResendClient();
	if (!resend) {
		if (process.env.NODE_ENV !== 'test') {
			console.log(`Password reset email not sent for ${to}. Link: ${resetUrl}`);
		}
		return { delivered: false, resetUrl };
	}

	const safeUrl = escapeHtml(resetUrl);

	await resend.emails.send({
		from: RESEND_FROM_EMAIL || 'DevLogger <onboarding@resend.dev>',
		to,
		subject: 'Reset your DevLogger password',
		text: `You requested a password reset for your DevLogger account. Click the link below to reset your password: ${resetUrl}. This link will expire in 1 hour.`,
		html: `
			<div style="background:#f8fafc;padding:28px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
				<div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
					<div style="padding:20px 24px;background:#0f172a;color:#f8fafc;">
						<div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.85;">Password Reset Request</div>
						<h2 style="margin:8px 0 0;font-size:24px;line-height:1.25;">Reset your password</h2>
					</div>
					<div style="padding:24px;line-height:1.6;font-size:15px;">
						<p style="margin:0 0 14px;">You requested a password reset for your DevLogger account.</p>
						<p style="margin:0 0 22px;">Click the button below to set a new password. This link will expire in 1 hour.</p>
						<p style="margin:0 0 18px;">
							<a href="${safeUrl}" style="display:inline-block;padding:12px 18px;background:#111827;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;">Reset password</a>
						</p>
						<p style="margin:0;color:#64748b;font-size:13px;">If the button does not work, copy and paste this link into your browser:</p>
						<p style="margin:8px 0 0;"><a href="${safeUrl}" style="color:#2563eb;word-break:break-all;">${safeUrl}</a></p>
						<p style="margin:16px 0 0;color:#64748b;font-size:13px;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
					</div>
				</div>
			</div>
		`,
	});

	return { delivered: true, resetUrl };
}

// send subscription purchase/upgrade confirmation email
export async function sendSubscriptionConfirmationEmail({
	to,
	ownerName,
	organizationName,
	planName,
	benefits,
	manageUrl,
}) {
	const resend = getResendClient();
	if (!resend) {
		if (process.env.NODE_ENV !== 'test') {
			console.log(`Subscription email not sent for ${to}. Plan: ${planName}`);
		}
		return { delivered: false };
	}

	const safeOwner = escapeHtml(ownerName || 'there');
	const safeOrg = escapeHtml(organizationName || 'your workspace');
	const safePlan = escapeHtml(planName);
	const safeManageUrl = escapeHtml(manageUrl);

	await resend.emails.send({
		from: RESEND_FROM_EMAIL || 'DevLogger <onboarding@resend.dev>',
		to,
		subject: `Your ${safePlan} plan is now active on DevLogger`,
		text: `Hi ${ownerName || 'there'}, your ${organizationName || 'workspace'} has been upgraded to ${planName}. Included with this plan: ${benefits.logsPerMonth.toLocaleString()} logs/month, ${benefits.members.toLocaleString()} members, ${benefits.apiKeys.toLocaleString()} API keys. Manage your subscription here: ${manageUrl}`,
		html: `
			<div style="background:#f8fafc;padding:28px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
				<div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
					<div style="padding:20px 24px;background:#0f172a;color:#f8fafc;">
						<div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.85;">Subscription Confirmed</div>
						<h2 style="margin:8px 0 0;font-size:24px;line-height:1.25;">Your ${safePlan} plan is active</h2>
					</div>
					<div style="padding:24px;line-height:1.6;font-size:15px;">
						<p style="margin:0 0 14px;">Hi ${safeOwner}, thanks for your purchase.</p>
						<p style="margin:0 0 14px;"><strong>${safeOrg}</strong> is now on the <strong>${safePlan}</strong> plan.</p>
						<p style="margin:0 0 8px;"><strong>What you now get:</strong></p>
						<ul style="margin:0 0 18px 18px;padding:0;">
							<li>${benefits.logsPerMonth.toLocaleString()} logs per month</li>
							<li>Up to ${benefits.members.toLocaleString()} team members</li>
							<li>${benefits.apiKeys.toLocaleString()} API keys</li>
						</ul>
						<p style="margin:0 0 18px;">
							<a href="${safeManageUrl}" style="display:inline-block;padding:12px 18px;background:#111827;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;">Manage subscription</a>
						</p>
						<p style="margin:0;color:#64748b;font-size:13px;">If you did not make this purchase, please contact support right away.</p>
					</div>
				</div>
			</div>
		`,
	});

	return { delivered: true };
}

import React from 'react';
import {
	Body,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Preview,
	Section,
	Text,
} from '@react-email/components';
import { render } from '@react-email/render';

const h = React.createElement;

const styles = {
	page: {
		backgroundColor: '#f8fafc',
		padding: '24px 12px',
		fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
		color: '#0f172a',
	},
	container: {
		maxWidth: '680px',
		margin: '0 auto',
		backgroundColor: '#ffffff',
		border: '1px solid #e2e8f0',
		borderRadius: '16px',
		overflow: 'hidden',
		boxShadow: '0 20px 50px rgba(15, 23, 42, 0.08)',
	},
	header: {
		padding: '24px 28px',
		background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)',
		color: '#ffffff',
	},
	badge: {
		display: 'inline-block',
		fontSize: '11px',
		fontWeight: 700,
		letterSpacing: '0.16em',
		textTransform: 'uppercase',
		opacity: 0.9,
	},
	h1: {
		margin: '10px 0 0',
		fontSize: '28px',
		lineHeight: 1.2,
	},
	subhead: {
		margin: '10px 0 0',
		color: '#dbeafe',
		fontSize: '14px',
	},
	body: {
		padding: '28px',
		fontSize: '15px',
		lineHeight: 1.7,
	},
	meta: {
		color: '#475569',
		fontSize: '13px',
	},
	label: {
		fontSize: '11px',
		fontWeight: 700,
		letterSpacing: '0.14em',
		textTransform: 'uppercase',
		color: '#64748b',
		marginBottom: '6px',
	},
	card: {
		padding: '16px',
		borderRadius: '14px',
		border: '1px solid #e2e8f0',
		backgroundColor: '#f8fafc',
	},
	message: {
		whiteSpace: 'pre-wrap',
		color: '#0f172a',
		margin: 0,
	},
	metaValue: {
		margin: 0,
		color: '#0f172a',
	},
};

function MetaLine({ label, value }) {
	return h(
		'div',
		{ style: { marginBottom: '10px' } },
		h(Text, { style: styles.label }, label),
		h(Text, { style: styles.metaValue }, String(value)),
	);
}

function SupportTicketEmail({ name, email, subject, message, metadata }) {
	const contextEntries = Object.entries(metadata || {}).filter(
		([, value]) => value != null && value !== '',
	);
	const contextBlock =
		contextEntries.length > 0
			? h(
					'div',
					{ style: { marginTop: '20px' } },
					h(Text, { style: styles.label }, 'Context'),
					h(
						'div',
						{ style: styles.card },
						contextEntries.map(([key, value]) => h(MetaLine, { key, label: key, value })),
					),
				)
			: null;

	const headerSection = h(
		Section,
		{ style: styles.header },
		h(Text, { style: styles.badge }, 'Support ticket'),
		h(Heading, { style: styles.h1 }, 'New message from Devlogger Support'),
		h(Text, { style: styles.subhead }, `Subject: ${subject}`),
	);

	const bodySection = h(
		Section,
		{ style: styles.body },
		h(Text, { style: styles.meta }, `From ${name || 'Anonymous'} <${email}>`),
		h(Hr, { style: { borderColor: '#e2e8f0', margin: '20px 0' } }),
		h(
			'div',
			{ style: styles.card },
			h(Text, { style: styles.label }, 'Message'),
			h(Text, { style: styles.message }, message),
		),
		contextBlock,
	);

	return h(
		Html,
		{ lang: 'en' },
		h(Head, null),
		h(Preview, null, `Support ticket from ${name || email}: ${subject}`),
		h(
			Body,
			{ style: styles.page },
			h(Container, { style: styles.container }, headerSection, bodySection),
		),
	);
}

export function renderSupportTicketEmail(props) {
	return render(h(SupportTicketEmail, props));
}

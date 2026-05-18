import { useContext, useState } from 'react';

// internal imports
import API from '../services/api';
import AuthContext from '../context/AuthContext.jsx';
import OrgContext from '../context/OrgContext.jsx';
import { toast } from 'react-toastify';
import Button from './ui/Button.jsx';
import Card, { CardBody } from './ui/Card.jsx';

export default function SupportContactForm() {
	const { auth } = useContext(AuthContext);
	const { org } = useContext(OrgContext) || {};
	const [email, setEmail] = useState(auth?.user?.email || '');
	const [name, setName] = useState(auth?.user?.name || '');
	const [subject, setSubject] = useState('');
	const [message, setMessage] = useState('');
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!subject || !message) return toast.error('Please add a subject and message.');
		setLoading(true);
		try {
			const payload = {
				name: name || undefined,
				subject,
				message,
				email: email || undefined,
				metadata: {
					page: 'support',
					path: typeof window !== 'undefined' ? window.location.pathname : '/support',
					organization: org?.id || org?._id,
					organizationName: org?.name,
				},
			};
			await API.post('/support/tickets', payload);
			toast.success('Thanks — your message was sent. Our team will reply by email.');
			setName(auth?.user?.name || '');
			setSubject('');
			setMessage('');
		} catch (err) {
			const msg = err?.response?.data?.message || 'Failed to send message. Please try again.';
			toast.error(msg);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className="overflow-hidden border-white/70 shadow-[0_18px_50px_rgba(15,23,42,0.12)] dark:border-slate-800">
			<div className="h-1 bg-gradient-to-r from-blue-600 via-sky-400 to-cyan-300" />
			<CardBody className="space-y-5">
				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700 dark:text-blue-200">
						Contact support
					</p>
					<h2 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">Send a message</h2>
					<p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
						We&apos;ll use the details below to reply by email and keep the right workspace context
						attached.
					</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
							Your name
						</label>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Your name"
							className="mt-1 block w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950/80 dark:text-white"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
							Your email
						</label>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="email@example.com"
							className="mt-1 block w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950/80 dark:text-white"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
							Subject
						</label>
						<input
							type="text"
							value={subject}
							onChange={(e) => setSubject(e.target.value)}
							placeholder="Short summary of your issue"
							className="mt-1 block w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950/80 dark:text-white"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
							Message
						</label>
						<textarea
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							placeholder="Describe the issue or question..."
							rows={6}
							className="mt-1 block w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950/80 dark:text-white"
						/>
					</div>

					<div className="flex items-center justify-between gap-4">
						<div className="text-xs leading-5 text-slate-500 dark:text-slate-400">
							Replies are sent to the email you enter. If you&apos;re signed in, we also attach your
							workspace context.
						</div>
						<Button type="submit" loading={loading} variant="primary" className="shrink-0 px-5">
							Send message
						</Button>
					</div>
				</form>
			</CardBody>
		</Card>
	);
}

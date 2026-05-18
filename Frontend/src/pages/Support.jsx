import { useContext, useEffect } from 'react';

// internal imports
import Card, { CardBody, CardHeader } from '../components/ui/Card.jsx';
import SupportContactForm from '../components/SupportContactForm.jsx';
import AuthContext from '../context/AuthContext.jsx';
import OrgContext from '../context/OrgContext.jsx';
import { setPageMeta } from '../utils/seo.js';

function Support() {
	const { auth } = useContext(AuthContext);
	const { org } = useContext(OrgContext) || {};

	useEffect(() => {
		setPageMeta(
			'Support — Devlogger',
			'Get help, read FAQs or contact the Devlogger team.',
			'/support',
		);
	}, []);

	const faqs = [
		{
			q: 'How do I invite team members?',
			a: 'Open Organization → Invite members and send invites by email.',
		},
		{
			q: 'How do API keys work?',
			a: 'Create API keys under Organization settings and use them for external operations. You can revoke any time.',
		},
		{
			q: 'Can I upgrade or cancel my subscription?',
			a: 'Yes — visit the Pricing page or contact sales for all related purchases.',
		},
	];

	return (
		<div className="relative isolate overflow-hidden">
			<div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.08),_transparent_26%),linear-gradient(to_bottom,_rgba(248,250,252,0.98),_rgba(243,244,246,0.88))] dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(148,163,184,0.14),_transparent_26%),linear-gradient(to_bottom,_rgba(3,7,18,0.94),_rgba(15,23,42,0.96))]" />
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
				<header className="max-w-3xl">
					<div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-blue-700 shadow-sm backdrop-blur dark:border-blue-400/20 dark:bg-slate-900/70 dark:text-blue-200">
						<span className="h-2 w-2 rounded-full bg-blue-600" />
						Devlogger support
					</div>
					<h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl dark:text-white">
						Instant help for our customers.
					</h1>
					<p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
						Find answers fast, check the essentials or send the team a message with the right
						context already attached.
					</p>
				</header>

				<div className="mt-8 grid gap-4 sm:grid-cols-3">
					{[
						{
							label: 'Response',
							value: 'Fast follow-up',
							detail: 'We reply by email with next steps.',
						},
						{
							label: 'Context',
							value: 'Org aware',
							detail: org?.name || 'Workspace details included automatically.',
						},
						{
							label: 'Self-serve',
							value: 'FAQs first',
							detail: 'Get common answers without waiting.',
						},
					].map((item) => (
						<div
							key={item.label}
							className="rounded-2xl border border-white/80 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80"
						>
							<div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
								{item.label}
							</div>
							<div className="mt-2 text-xl font-bold text-slate-950 dark:text-white">
								{item.value}
							</div>
							<p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
								{item.detail}
							</p>
						</div>
					))}
				</div>

				<div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
					<div className="space-y-6">
						<Card className="overflow-hidden border-white/70 shadow-[0_18px_50px_rgba(15,23,42,0.10)] dark:border-slate-800">
							<div className="h-1 bg-gradient-to-r from-blue-600 via-sky-400 to-cyan-300" />
							<CardHeader
								title={`Need help${auth?.user ? `, ${auth.user.name}` : ''}`}
								subtitle={
									org?.name ? `Organization: ${org.name}` : 'Support is available for everyone'
								}
							/>
							<CardBody>
								<p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
									Start with the most common questions below. If you still need help, use the form
									on the right and we&apos;ll handle it with the right context.
								</p>

								<div className="mt-6 space-y-3">
									{faqs.map((f) => (
										<div
											key={f.q}
											className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/60"
										>
											<div className="text-sm font-semibold text-slate-950 dark:text-white">
												{f.q}
											</div>
											<div className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
												{f.a}
											</div>
										</div>
									))}
								</div>
							</CardBody>
						</Card>

						<Card className="border-blue-200/80 bg-gradient-to-br from-blue-50 via-white to-slate-50 shadow-sm dark:border-blue-400/20 dark:from-blue-500/10 dark:via-slate-950/80 dark:to-slate-950">
							<CardBody>
								<div className="flex items-start justify-between gap-4">
									<div>
										<p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700 dark:text-blue-200">
											Suggested path
										</p>
										<h2 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
											Most questions start with the FAQ.
										</h2>
										<p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
											It keeps the experience fast for simple issues and gives your message better
											context when you do contact us.
										</p>
									</div>
									<div className="hidden h-12 w-12 rounded-2xl bg-blue-600/10 ring-1 ring-inset ring-blue-600/20 lg:block" />
								</div>
							</CardBody>
						</Card>
					</div>

					<aside>
						<div className="sticky top-20">
							<SupportContactForm />
						</div>
					</aside>
				</div>
			</div>
		</div>
	);
}

export default Support;

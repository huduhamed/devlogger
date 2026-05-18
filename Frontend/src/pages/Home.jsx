import { useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';

// internal imports
import Button from '../components/ui/Button.jsx';
import AuthContext from '../context/AuthContext.jsx';
import { setPageMeta, addStructuredData, getOrganizationSchema } from '../utils/seo.js';

// home comp
function Home() {
	const { auth } = useContext(AuthContext);
	const isSignedIn = !!auth?.token && !!auth?.user;

	const highlights = [
		{
			title: 'Timeline-first context',
			description: 'Capture every decision, event, and follow-up without losing history.',
		},
		{
			title: 'Team visibility',
			description:
				'Keep product, engineering, and support aligned with one shared source of truth.',
		},
		{
			title: 'Fast, focused workflows',
			description: 'Log issues, share updates, and find signal quickly with a UX built for speed.',
		},
	];

	const metrics = [
		{ label: 'Faster handoffs', value: '24/7' },
		{ label: 'Timeline visibility', value: '100%' },
		{ label: 'Collaboration ready', value: 'Realtime' },
	];

	useEffect(() => {
		setPageMeta(
			'Team Logging & Collaboration',
			"Track, share and learn from every event. Empower your team with Devlogger's collaborative logging platform.",
			'https://devlogger.io',
		);
		addStructuredData(getOrganizationSchema());
	}, []);

	return (
		<div className="relative isolate overflow-hidden">
			<div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.14),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.08),_transparent_28%),linear-gradient(to_bottom,_rgba(248,250,252,0.95),_rgba(248,250,252,0.86))] dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(148,163,184,0.14),_transparent_28%),linear-gradient(to_bottom,_rgba(3,7,18,0.94),_rgba(15,23,42,0.96))]" />
			<div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-7xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
				<div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
					<div className="max-w-3xl">
						<div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-blue-700 shadow-sm backdrop-blur dark:border-blue-400/20 dark:bg-slate-900/70 dark:text-blue-200">
							<span className="h-2 w-2 rounded-full bg-blue-600" />
							Timeline-first operational context
						</div>
						<h1 className="max-w-2xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
							Keep team decision visible, searchable and in sync.
						</h1>
						<p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl dark:text-slate-300">
							Devlogger gives teams one fast place to capture logs, track events, and preserve the
							context behind every incident, fix, and follow-up.
						</p>

						<div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
							{!isSignedIn ? (
								<>
									<Link to="/sign-up" className="w-full sm:w-auto">
										<Button
											variant="primary"
											size="lg"
											className="w-full rounded-full px-6 text-base font-semibold shadow-lg shadow-blue-600/20"
										>
											Get started free
										</Button>
									</Link>
									<Link to="/sign-in" className="w-full sm:w-auto">
										<Button
											variant="outline"
											size="lg"
											className="w-full rounded-full px-6 text-base font-semibold"
										>
											Sign in
										</Button>
									</Link>
								</>
							) : (
								<Link to="/dashboard" className="w-full sm:w-auto">
									<Button
										variant="primary"
										size="lg"
										className="w-full rounded-full px-6 text-base font-semibold shadow-lg shadow-blue-600/20"
									>
										Open dashboard
									</Button>
								</Link>
							)}
							<Link to="/pricing" className="w-full sm:w-auto">
								<Button
									variant="ghost"
									size="lg"
									className="w-full rounded-full px-6 text-base font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-white/70 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-white/5"
								>
									View pricing
								</Button>
							</Link>
						</div>

						<div className="mt-10 grid gap-4 sm:grid-cols-3">
							{metrics.map((metric) => (
								<div
									key={metric.label}
									className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80"
								>
									<div className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
										{metric.value}
									</div>
									<div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
										{metric.label}
									</div>
								</div>
							))}
						</div>
					</div>

					<div className="relative">
						<div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br from-blue-500/20 via-sky-400/10 to-transparent blur-3xl" />
						<div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 sm:p-8">
							<div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
								<div>
									<p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
										Live workspace
									</p>
									<h2 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
										Operational intelligence for engineers
									</h2>
								</div>
								<div className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
									Synced
								</div>
							</div>

							<div className="mt-6 space-y-4">
								<div className="rounded-2xl bg-slate-950 p-4 text-slate-100 shadow-inner dark:bg-slate-900">
									<div className="flex items-center justify-between text-sm text-slate-400">
										<span>Latest timeline event</span>
										<span>2 min ago</span>
									</div>
									<p className="mt-3 text-base font-medium leading-7">
										Rollback completed after a production alert. Follow-up assigned to platform
										team, and the timeline keeps every note tied to the same incident.
									</p>
								</div>

								<div className="grid gap-3 sm:grid-cols-2">
									<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
										<div className="text-sm text-slate-500 dark:text-slate-400">Open issues</div>
										<div className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
											18
										</div>
									</div>
									<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
										<div className="text-sm text-slate-500 dark:text-slate-400">Shared updates</div>
										<div className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
											142
										</div>
									</div>
								</div>

								<div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 dark:border-blue-400/20 dark:bg-blue-500/10">
									<p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-200">
										Designed for speed
									</p>
									<p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
										Optimistic updates, clear ownership, and a visual hierarchy that makes the
										important stuff obvious at a glance.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="mt-14 grid gap-4 lg:grid-cols-3">
					{highlights.map((item) => (
						<div
							key={item.title}
							className="rounded-2xl border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70"
						>
							<div className="mb-3 h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-sky-400" />
							<h3 className="text-lg font-semibold text-slate-950 dark:text-white">{item.title}</h3>
							<p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
								{item.description}
							</p>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export default Home;

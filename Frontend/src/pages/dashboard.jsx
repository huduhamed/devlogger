import { useContext } from 'react';
import { Link } from 'react-router-dom';

// internal import
import LogsContext from '../context/LogsContext.jsx';
import Card, { CardBody, CardHeader } from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import OrgContext from '../context/OrgContext.jsx';
import UpgradeBanner from '../components/UpgradeBanner.jsx';

// dashaboard
function Dashboard() {
	const { logs, loading } = useContext(LogsContext);
	const { org } = useContext(OrgContext);

	const getInitials = (name = '') =>
		name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase())
			.join('') || 'U';

	// list all recent logs
	const recentLogs = logs;

	// aggregate logs by creator
	const logsByUser = Object.values(
		logs.reduce((acc, l) => {
			const id = l.user?._id || (l.user && l.user.toString()) || 'unknown';
			const name = l.user?.name || 'Unknown';
			if (!acc[id]) acc[id] = { id, name, count: 0 };
			acc[id].count += 1;
			return acc;
		}, {}),
	).sort((a, b) => b.count - a.count);

	const formatDate = (value) => {
		if (!value) return 'Unknown time';
		const date = new Date(value);
		return Number.isNaN(date.getTime()) ? 'Unknown time' : date.toLocaleString();
	};

	const totalLogs = logs.length;
	const activeContributors = logsByUser.length;
	const latestLog = logs[0];
	const usagePercent =
		org?.limits?.logsPerMonth && org?.usage?.logCount != null
			? Math.min(100, Math.round((org.usage.logCount / org.limits.logsPerMonth) * 100))
			: null;
	const isOnPlanLimit =
		org?.limits?.logsPerMonth != null && org?.usage?.logCount != null
			? org.usage.logCount >= org.limits.logsPerMonth
			: false;

	return (
		<div className="relative isolate mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.12),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),_transparent_28%)] blur-2xl dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.12),_transparent_28%)]" />
			<div className="mb-8 flex flex-col gap-6 rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 lg:flex-row lg:items-end lg:justify-between">
				<div className="max-w-2xl">
					<div className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-200">
						<span className="h-2 w-2 rounded-full bg-blue-600" />
						Operational overview
					</div>
					<h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl dark:text-white">
						Dashboard
					</h1>
					<p className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-300">
						A live summary of recent log activity, team participation, and organization usage.
					</p>
					{org && (
						<div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
							<span className="font-semibold text-slate-900 dark:text-white">{org.name}</span>
							<span className="rounded-full bg-slate-100 px-2.5 py-1 capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-200">
								{org.plan}
							</span>
							{org.limits?.logsPerMonth != null && org.usage?.logCount != null && (
								<span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
									{org.usage.logCount} / {org.limits.logsPerMonth} logs this month
								</span>
							)}
						</div>
					)}
				</div>

				<div className="flex flex-wrap gap-3">
					<Link
						to="/create-log"
						className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
					>
						New log
					</Link>
					<Link
						to="/logs"
						className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
					>
						View logs
					</Link>
				</div>
			</div>

			{org && (
				<div className="mb-8">
					<UpgradeBanner org={org} />
				</div>
			)}

			<div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<Card className="border-white/60 bg-white/85 dark:border-slate-800 dark:bg-slate-950/80">
					<CardBody className="p-5">
						<div className="text-sm font-medium text-slate-500 dark:text-slate-400">Total logs</div>
						<div className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
							{totalLogs}
						</div>
						<div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
							Events in the current view
						</div>
					</CardBody>
				</Card>
				<Card className="border-white/60 bg-white/85 dark:border-slate-800 dark:bg-slate-950/80">
					<CardBody className="p-5">
						<div className="text-sm font-medium text-slate-500 dark:text-slate-400">
							Active contributors
						</div>
						<div className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
							{activeContributors}
						</div>
						<div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
							People publishing logs
						</div>
					</CardBody>
				</Card>
				<Card className="border-white/60 bg-white/85 dark:border-slate-800 dark:bg-slate-950/80">
					<CardBody className="p-5">
						<div className="text-sm font-medium text-slate-500 dark:text-slate-400">
							Latest activity
						</div>
						<div className="mt-3 text-xl font-bold tracking-tight text-slate-950 dark:text-white">
							{latestLog?.title || 'No recent logs'}
						</div>
						<div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
							{latestLog ? formatDate(latestLog.createdAt) : 'Create a log to start the timeline'}
						</div>
					</CardBody>
				</Card>
				<Card className="border-white/60 bg-white/85 dark:border-slate-800 dark:bg-slate-950/80">
					<CardBody className="p-5">
						<div className="text-sm font-medium text-slate-500 dark:text-slate-400">Usage</div>
						<div className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
							{usagePercent != null ? `${usagePercent}%` : '—'}
						</div>
						<div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
							<div
								className={`h-full rounded-full ${isOnPlanLimit ? 'bg-amber-500' : 'bg-blue-600'}`}
								style={{ width: usagePercent != null ? `${usagePercent}%` : '0%' }}
							/>
						</div>
						<div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
							{org?.usage?.logCount != null && org?.limits?.logsPerMonth != null
								? `${org.usage.logCount} logs used of ${org.limits.logsPerMonth}`
								: 'Usage details appear when an organization is selected'}
						</div>
					</CardBody>
				</Card>
			</div>

			{loading ? (
				<Card className="border-white/60 bg-white/85 dark:border-slate-800 dark:bg-slate-950/80">
					<CardBody className="flex items-center gap-3 p-6 text-slate-600 dark:text-slate-300">
						<Spinner />
						<span role="status" aria-live="polite">
							Loading dashboard...
						</span>
					</CardBody>
				</Card>
			) : (
				<div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
					<Card className="border-white/60 bg-white/85 dark:border-slate-800 dark:bg-slate-950/80">
						<CardHeader
							title="Creator leaderboard"
							subtitle="Who is contributing the most recently"
							actions={
								<div className="text-sm text-slate-500 dark:text-slate-400">
									Total:{' '}
									<span className="font-bold text-slate-900 dark:text-white">{logs.length}</span>
								</div>
							}
						/>
						<CardBody className="p-0">
							{logsByUser.length === 0 ? (
								<div className="p-6">
									<EmptyState
										title="No logs yet"
										description="Create your first log to see team activity here."
									/>
								</div>
							) : (
								<ul className="divide-y divide-slate-200 dark:divide-slate-800">
									{logsByUser.map((u) => (
										<li key={u.id}>
											<Link
												to={`/logs?userId=${encodeURIComponent(u.id)}&userName=${encodeURIComponent(u.name)}`}
												className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/60"
											>
												<div className="flex min-w-0 items-center gap-3">
													<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-950">
														{getInitials(u.name)}
													</div>
													<div className="min-w-0">
														<div className="truncate text-sm font-semibold text-slate-950 dark:text-white">
															{u.name}
														</div>
														<div className="text-xs text-slate-500 dark:text-slate-400">
															Click to filter logs
														</div>
													</div>
												</div>
												<div className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
													{u.count}
												</div>
											</Link>
										</li>
									))}
								</ul>
							)}
						</CardBody>
					</Card>

					<Card className="border-white/60 bg-white/85 dark:border-slate-800 dark:bg-slate-950/80">
						<CardHeader title="Most recent" subtitle="Latest event stream from the workspace" />
						<CardBody className="p-0">
							{recentLogs.length === 0 ? (
								<div className="p-6">
									<EmptyState
										title="No logs yet"
										description="Create your first log to see it highlighted here."
									/>
								</div>
							) : (
								<div className="max-h-[34rem] overflow-y-auto pr-1 dashboard-scrollbar">
									<ul className="space-y-0 px-5 pb-5">
										{recentLogs.map((log) => (
											<li
												key={log._id}
												className="border-b border-slate-200 py-4 last:border-b-0 dark:border-slate-800"
											>
												<div className="flex flex-wrap items-start justify-between gap-3">
													<div className="min-w-0 flex-1">
														<div className="flex flex-wrap items-center gap-2">
															<h3 className="break-words text-base font-semibold text-slate-950 dark:text-white">
																{log.title}
															</h3>
															<Badge
																color={
																	log.level === 'error'
																		? 'red'
																		: log.level === 'warn'
																			? 'yellow'
																			: log.level === 'info'
																				? 'blue'
																				: 'gray'
																}
															>
																{log.level || 'entry'}
															</Badge>
															{log.tag && <Badge color="green">{log.tag}</Badge>}
														</div>
														<p className="mt-2 break-words text-sm leading-6 text-slate-600 dark:text-slate-400">
															{log.description || 'No description provided.'}
														</p>
														<div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
															<span>{formatDate(log.createdAt)}</span>
															{log.user?.name && <span>• {log.user.name}</span>}
															{log.updatedAt &&
																log.createdAt &&
																new Date(log.updatedAt).getTime() >
																	new Date(log.createdAt).getTime() && <span>• Edited</span>}
														</div>
													</div>
												</div>
											</li>
										))}
									</ul>
								</div>
							)}
						</CardBody>
					</Card>
				</div>
			)}
		</div>
	);
}

export default Dashboard;

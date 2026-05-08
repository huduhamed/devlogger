import { useContext } from 'react';
import { Link } from 'react-router-dom';

// internal import
import LogsContext from '../context/LogsContext.jsx';
import Card, { CardBody, CardHeader } from '../components/ui/Card.jsx';
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

	return (
		<div className="max-w-3xl sm:max-w-6xl mx-auto px-4">
			<div className="mb-6">
				<h1 className="text-2xl font-bold">Dashboard</h1>
				<p className="text-sm text-gray-600">Recent activity</p>
				{org && (
					<div className="mt-3 text-sm text-gray-700 dark:text-gray-300 break-words">
						<span className="font-medium">{org.name}</span> • Plan:{' '}
						<span className="capitalize">{org.plan}</span>
						{org.limits?.logsPerMonth != null && org.usage?.logCount != null && (
							<span>
								{' '}
								• {org.usage.logCount} / {org.limits.logsPerMonth} logs this month
							</span>
						)}
					</div>
				)}
				{org && (
					<div className="mt-3">
						<UpgradeBanner org={org} />
					</div>
				)}
			</div>

			{loading ? (
				<div role="status" aria-live="polite" className="flex items-center gap-2 text-gray-600">
					<Spinner /> Loading logs...
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<Card>
						<CardHeader
							title="Log history"
							actions={
								<div className="text-sm text-gray-400">
									Total: <span className="font-bold">{logs.length}</span>
								</div>
							}
						/>
						<CardBody>
							{logsByUser.length === 0 ? (
								<div className="text-sm text-gray-600">No logs yet.</div>
							) : (
								<ul className="divide-y divide-stone-200 dark:divide-gray-800">
									{logsByUser.map((u) => (
										<li key={u.id} className="py-2">
											<Link
												to={`/logs?userId=${encodeURIComponent(u.id)}&userName=${encodeURIComponent(u.name)}`}
												className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-stone-100 dark:hover:bg-gray-800"
											>
												<div className="flex items-center gap-3 min-w-0">
													<div className="h-10 w-10 rounded-full bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900 flex items-center justify-center text-sm font-semibold shrink-0">
														{getInitials(u.name)}
													</div>
													<div className="min-w-0">
														<div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
															{u.name}
														</div>
														<div className="text-xs text-gray-500 dark:text-gray-400">
															Click to filter logs
														</div>
													</div>
												</div>
												<div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
													{u.count}
												</div>
											</Link>
										</li>
									))}
								</ul>
							)}
						</CardBody>
					</Card>
					<Card className="md:col-span-2">
						<CardHeader title="Most Recent" />
						<CardBody>
							{recentLogs.length === 0 ? (
								<EmptyState
									title="No logs yet"
									description="Create your first log to see it here."
								/>
							) : (
								<div className="max-h-72 overflow-y-auto pr-1 dashboard-scrollbar">
									<ul className="space-y-3">
										{recentLogs.map((log) => (
											<li key={log._id} className="p-3 border rounded-md bg-white dark:bg-gray-900">
												<h3 className="font-semibold break-words">{log.title}</h3>
												<p className="text-sm text-gray-400 break-words">{log.description}</p>
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

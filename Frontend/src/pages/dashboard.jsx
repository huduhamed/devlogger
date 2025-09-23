import { useContext } from 'react';

// internal import
import LogsContext from '../context/LogsContext.jsx';
import Card, { CardBody, CardHeader } from '../components/ui/Card.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import OrgContext from '../context/OrgContext.jsx';

// dashaboard
function Dashboard() {
	const { logs, loading } = useContext(LogsContext);
	const { org } = useContext(OrgContext);

	// list 5 most recent
	const recentLogs = logs.slice(0, 5);

	return (
		<div className="max-w-6xl mx-auto">
			<div className="mb-6">
				<h1 className="text-2xl font-bold">Dashboard</h1>
				<p className="text-sm text-gray-600">Recent activity and quick stats</p>
				{org && (
					<div className="mt-3 text-sm text-gray-700 dark:text-gray-300">
						<span className="font-medium">{org.name}</span> • Plan: <span className="capitalize">{org.plan}</span>
						{org.limits?.logsPerMonth != null && org.usage?.logCount != null && (
							<span> • {org.usage.logCount} / {org.limits.logsPerMonth} logs this month</span>
						)}
					</div>
				)}
			</div>

			{loading ? (
				<div className="flex items-center gap-2 text-gray-600"><Spinner /> Loading logs...</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<Card>
						<CardHeader title="Total Logs" />
						<CardBody>
							<div className="text-3xl font-bold">{logs.length}</div>
						</CardBody>
					</Card>
					<Card className="md:col-span-2">
						<CardHeader title="Most Recent" />
						<CardBody>
							{recentLogs.length === 0 ? (
								<EmptyState title="No logs yet" description="Create your first log to see it here." />
							) : (
								<ul className="space-y-3">
									{recentLogs.map((log) => (
										<li key={log._id} className="p-3 border rounded-md bg-white dark:bg-gray-900">
											<h3 className="font-semibold">{log.title}</h3>
											<p className="text-sm text-gray-600">{log.description}</p>
										</li>
									))}
								</ul>
							)}
						</CardBody>
					</Card>
				</div>
			)}
		</div>
	);
}

export default Dashboard;

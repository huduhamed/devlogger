import { useContext } from 'react';

// internal import
import LogsContext from '../context/LogsContext.jsx';

// dashaboard
function Dashboard() {
	const { logs, loading } = useContext(LogsContext);

	// list 5 most recent
	const recentLogs = logs.slice(0, 5);

	return (
		<div>
			<h1 className="text-2xl font-bold mb-4">Most Recent Logs</h1>

			{loading ? (
				<p>Loading logs...</p>
			) : (
				<>
					<div className="mb-6">
						<h2 className="text-lg font-semibold">Quick Stats</h2>
						<p>Total Logs: {logs.length}</p>
					</div>

					<div>
						<h2 className="text-lg font-semibold">Recent Logs</h2>
						<ul className="mt-2 space-y-2">
							{recentLogs.map((log) => (
								<li key={log._id} className="p-3 bg-gray-100 rounded shadow-sm">
									<h3 className="font-bold">{log.title}</h3>
									<p className="text-sm text-gray-700">{log.description}</p>
								</li>
							))}
						</ul>
					</div>
				</>
			)}
		</div>
	);
}

export default Dashboard;

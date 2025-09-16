import { useEffect, useState } from 'react';

// internal imports
import API from '../services/api';

// dashaboard
function Dashboard() {
	const [logs, setLogs] = useState([]);
	const [loading, setLoading] = useState(true);

	// fetch logs
	const fetchLogs = async () => {
		try {
			const res = await API.get('/logs');
			const data = res.data.data || [];
			setLogs(data);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchLogs();
	}, []);

	// list 5 most recent
	const recentLogs = logs.slice(0, 5);

	return (
		<div>
			<h1 className="text-2xl font-bold mb-4">Dashboard</h1>

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

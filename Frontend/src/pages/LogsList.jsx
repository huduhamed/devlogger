import { useEffect, useState, useContext } from 'react';
import { toast } from 'react-toastify';

// internal imports
import API from '../services/api';
import AuthContext from '../context/AuthContext';

// logs list
function LogsList() {
	const [logs, setLogs] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const { auth } = useContext(AuthContext);

	// fetch logs
	const fetchLogs = async () => {
		setLoading(true);

		try {
			const res = await API.get('/logs');
			setLogs(res.data.data || []);
		} catch (err) {
			setError(err.message || 'Failed to fetch logs');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchLogs();
	}, []);

	// handle delete
	const handleDelete = async (id) => {
		if (!window.confirm('Are you sure you want to delete this log?')) return;
		try {
			await API.delete(`/logs/${id}`);
			// refresh after delete
			fetchLogs();
		} catch (err) {
			console.error(err);
			toast.error('Failed to delete log');
		}
	};

	return (
		<div className="max-w-4xl mx-auto mt-6">
			<h2 className="text-2xl font-bold mb-4">All Logs</h2>

			{loading && <p>Loading logs...</p>}
			{error && <p className="text-red-500">{error}</p>}

			<ul className="space-y-4">
				{logs.map((log) => (
					<li
						key={log._id}
						className="p-4 bg-gray-100 rounded-lg shadow flex justify-between items-start"
					>
						<div>
							<h3 className="text-lg font-semibold">{log.title}</h3>
							<p className="text-gray-700">{log.description}</p>
							<small className="block text-gray-500 mt-1">
								By: <span className="capitalize">{log.user?.name}</span> •{' '}
								{new Date(log.createdAt).toLocaleString()}
							</small>
							{log.tags?.length > 0 && (
								<div className="mt-2 text-sm text-blue-600">#{log.tags.join(' #')}</div>
							)}
						</div>

						{/* Show edit/delete only if current user is owner */}
						{auth?.user?._id === log.user?._id && (
							<div className="flex gap-2 ml-4">
								<button
									onClick={() => console.log('Edit log:', log._id)}
									className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
								>
									Edit
								</button>
								<button
									onClick={() => handleDelete(log._id)}
									className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
								>
									Delete
								</button>
							</div>
						)}
					</li>
				))}
			</ul>
		</div>
	);
}

export default LogsList;

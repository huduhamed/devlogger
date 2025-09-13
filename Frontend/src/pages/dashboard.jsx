import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

// internal imports
import API from '../services/api';
import LogForm from './LogForm';
import AuthContext from '../context/AuthContext';

// dashboard
function Dashboard() {
	const [logs, setLogs] = useState([]);
	const [editingLog, setEditingLog] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const { auth, logout } = useContext(AuthContext);
	const navigate = useNavigate();

	// handle logout
	const handleLogout = () => {
		logout();
		navigate('/');
	};

	// fetch logs for current user
	const fetchUserLogs = async () => {
		setLoading(true);
		try {
			const res = await API.get('/logs');
			setLogs(res.data.data || []);
		} catch (err) {
			setError(err.response?.data?.message || err.message || 'Failed to fetch logs');
		} finally {
			setLoading(false);
		}
	};

	// handle delete
	const handleDelete = async (id) => {
		if (!window.confirm('Are you sure you want to delete this log?')) return;
		await API.delete(`/logs/${id}`);
		fetchUserLogs();
	};

	useEffect(() => {
		fetchUserLogs();
	}, []);

	return (
		<div className="max-w-3xl mx-auto mt-8 px-4">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold">Dashboard</h1>

				{/* User profile */}
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
						{auth.user?.name?.[0]?.toUpperCase() || 'U'}
					</div>
					<span className="font-medium">
						{auth.user?.name
							? auth.user.name.charAt(0).toUpperCase() + auth.user.name.slice(1)
							: 'User'}
					</span>
					<button onClick={handleLogout} className="text-red-500 underline ml-3 text-sm">
						Logout
					</button>
				</div>
			</div>

			{/* Error / Loading */}
			{error && <p className="text-red-500 mb-4">{error}</p>}
			{loading && <p>Loading logs...</p>}

			{/* Log form */}
			<LogForm
				initialData={editingLog}
				onSubmit={async (data, id) => {
					if (id) await API.put(`/logs/${id}`, data);
					else await API.post('/logs', data);
					setEditingLog(null);

					fetchUserLogs();
				}}
				onCancel={() => setEditingLog(null)}
			/>

			<ul className="mt-6 space-y-3">
				{logs.map((log) => (
					<li key={log._id} className="p-4 bg-gray-100 rounded flex justify-between items-start">
						<div>
							<h3 className="font-bold">{log.title}</h3>
							<p className="text-gray-700">{log.description}</p>
							<small className="text-gray-500">{log.tags.join(', ')}</small>
						</div>
						<div className="flex flex-col gap-1 ml-4">
							<button
								onClick={() => setEditingLog(log)}
								className="text-blue-500 hover:underline text-sm"
							>
								Edit
							</button>
							<button
								onClick={() => handleDelete(log._id)}
								className="text-red-500 hover:underline text-sm"
							>
								Delete
							</button>
						</div>
					</li>
				))}
			</ul>
		</div>
	);
}

export default Dashboard;

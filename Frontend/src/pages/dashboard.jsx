import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// internal imports
import API from '../services/api';
import LogForm from './LogForm';
import { logout } from '../services/auth';

function Dashboard() {
	const [logs, setLogs] = useState([]);
	const [editingLog, setEditingLog] = useState(null);
	const navigate = useNavigate();

	// handle logout
	const handleLogout = () => {
		logout();
		navigate('/');
	};

	// fetch logs
	const fetchLogs = async () => {
		const res = await API.get('/logs');
		setLogs(res.data);
	};

	useEffect(() => {
		fetchLogs();
	}, []);

	// handle delete
	const handleDelete = async (id) => {
		await API.delete(`/logs/${id}`);
		fetchLogs();
	};

	return (
		<div className="max-w-2xl mx-auto mt-10">
			<h1 className="text-2xl font-bold mb-4">Dashboard</h1>
			console.log('Dashboard rendered');
			<LogForm
				onSuccess={() => {
					fetchLogs();
					setEditingLog(null);
				}}
				initialData={editingLog}
				onCancel={() => setEditingLog(null)}
			/>
			<ul className="mt-6 space-y-2">
				{logs.map((log) => (
					<li key={log._id} className="p-3 bg-gray-100 rounded flex justify-between items-center">
						<div>
							<h3 className="font-bold">{log.title}</h3>
							<p>{log.description}</p>
						</div>
						<button onClick={() => setEditingLog(log)} className="text-blue-500 mr-2">
							Edit
						</button>
						<button onClick={handleLogout} className="mb-4 text-sm text-red-500 underline">
							Logout
						</button>
						<button onClick={() => handleDelete(log._id)} className="text-red-500">
							Delete
						</button>
					</li>
				))}
			</ul>
		</div>
	);
}
export default Dashboard;

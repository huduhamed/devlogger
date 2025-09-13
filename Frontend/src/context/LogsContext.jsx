import { createContext, useState, useEffect } from 'react';

// internal imports
import API from '../services/api';

const LogsContext = createContext();

// logs provider
export function LogsProvider({ children }) {
	const [logs, setLogs] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	// fetch logs
	const fetchLogs = async () => {
		setLoading(true);
		try {
			const res = await API.get('/logs');
			setLogs(res.data.data);
		} catch (err) {
			setError(err.message || 'Failed to fetch logs');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchLogs();
	}, []);

	return (
		<LogsContext.Provider value={{ logs, setLogs, loading, error, fetchLogs }}>
			{children}
		</LogsContext.Provider>
	);
}

export default LogsContext;

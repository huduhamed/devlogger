import { createContext, useState, useEffect, useCallback } from 'react';

// internal imports
import API from '../services/api';

//  logs context
const LogsContext = createContext();

// logs provider
export function LogsProvider({ children }) {
	const [logs, setLogs] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(20);
	const [total, setTotal] = useState(0);
	const [pages, setPages] = useState(1);
	const [filters, setFilters] = useState({ level: '', tag: '', q: '' });

	// fetch logs
	const fetchLogs = useCallback(
		async (override = {}) => {
			setLoading(true);

			try {
				const current = {
					page,
					limit,
					...filters,
					...override,
				};
				const params = new URLSearchParams();
				if (current.page) params.set('page', current.page);
				if (current.limit) params.set('limit', current.limit);
				if (current.level) params.set('level', current.level);
				if (current.tag) params.set('tag', current.tag);
				if (current.q) params.set('q', current.q);

				const res = await API.get(`/logs?${params.toString()}`);
				setLogs(res.data.data || []);
				if (res.data.pagination) {
					setPage(res.data.pagination.page);
					setLimit(res.data.pagination.limit);
					setTotal(res.data.pagination.total);
					setPages(res.data.pagination.pages);
				}
			} catch (err) {
				const msg = err.response?.data?.message || err.message || 'Failed to fetch logs';
				setError(msg);
			} finally {
				setLoading(false);
			}
		},
		[page, limit, filters]
	);

	useEffect(() => {
		fetchLogs();
	}, [fetchLogs]);

	// revalidate logs on window focus & periodic interval
	useEffect(() => {
		const onFocus = () => {
			if (!document.hidden && !loading) fetchLogs();
		};
		window.addEventListener('focus', onFocus);

		const intervalId = setInterval(() => {
			if (!loading) fetchLogs();
		}, 45000);
		return () => {
			window.removeEventListener('focus', onFocus);
			clearInterval(intervalId);
		};
	}, [fetchLogs, loading]);

	const updateFilters = (f) => {
		setFilters((prev) => ({ ...prev, ...f }));
		setPage(1);
	};

	const goToPage = (p) => {
		setPage(p);
	};

	return (
		<LogsContext.Provider
			value={{
				logs,
				loading,
				error,
				page,
				limit,
				pages,
				total,
				filters,
				setLimit,
				updateFilters,
				goToPage,
				fetchLogs,
			}}
		>
			{children}
		</LogsContext.Provider>
	);
}

export default LogsContext;

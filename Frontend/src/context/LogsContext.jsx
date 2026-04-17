import { createContext, useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// internal imports
import API from '../services/api';

//  logs context
const LogsContext = createContext();

// logs provider
export function LogsProvider({ children }) {
	const queryClient = useQueryClient();
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(20);
	const [filters, setFilters] = useState({ level: '', tag: '', q: '' });

	const queryKey = useMemo(
		() => ['logs', page, limit, filters.level, filters.tag, filters.q],
		[page, limit, filters.level, filters.tag, filters.q],
	);

	const logsQuery = useQuery({
		queryKey,
		queryFn: async () => {
			const params = new URLSearchParams();
			params.set('page', String(page));
			params.set('limit', String(limit));
			if (filters.level) params.set('level', filters.level);
			if (filters.tag) params.set('tag', filters.tag);
			if (filters.q) params.set('q', filters.q);

			const res = await API.get(`/logs?${params.toString()}`);
			return {
				logs: res.data?.data || [],
				pagination: res.data?.pagination || { page, limit, total: 0, pages: 1 },
			};
		},
		staleTime: 60 * 1000,
		gcTime: 30 * 60 * 1000,
		refetchOnWindowFocus: true,
		refetchOnReconnect: true,
		retry: 1,
		placeholderData: (previousData) => previousData,
	});

	const fetchLogs = useCallback(
		async (override = {}) => {
			const hasOverride = override && Object.keys(override).length > 0;
			if (!hasOverride) {
				await logsQuery.refetch();
				return;
			}

			if (Object.hasOwn(override, 'page')) {
				const nextPage = Number(override.page);
				if (Number.isFinite(nextPage) && nextPage > 0) setPage(nextPage);
			}

			if (Object.hasOwn(override, 'limit')) {
				const nextLimit = Number(override.limit);
				if (Number.isFinite(nextLimit) && nextLimit > 0) setLimit(nextLimit);
			}

			const nextFilters = {};
			if (Object.hasOwn(override, 'level')) nextFilters.level = override.level || '';
			if (Object.hasOwn(override, 'tag')) nextFilters.tag = override.tag || '';
			if (Object.hasOwn(override, 'q')) nextFilters.q = override.q || '';
			if (Object.keys(nextFilters).length > 0) {
				setFilters((prev) => ({ ...prev, ...nextFilters }));
			}
		},
		[logsQuery],
	);

	const updateFilters = (f) => {
		setFilters((prev) => ({ ...prev, ...f }));
		setPage(1);
	};

	const goToPage = (p) => {
		setPage(p);
	};

	const value = useMemo(() => {
		const pagination = logsQuery.data?.pagination;
		return {
			logs: logsQuery.data?.logs || [],
			loading: logsQuery.isLoading,
			fetching: logsQuery.isFetching,
			error:
				logsQuery.error?.response?.data?.message ||
				logsQuery.error?.message ||
				(logsQuery.isError ? 'Failed to fetch logs' : null),
			page: pagination?.page ?? page,
			limit: pagination?.limit ?? limit,
			pages: pagination?.pages ?? 1,
			total: pagination?.total ?? 0,
			filters,
			setLimit,
			updateFilters,
			goToPage,
			fetchLogs,
			invalidateLogs: () => queryClient.invalidateQueries({ queryKey: ['logs'] }),
		};
	}, [fetchLogs, filters, limit, logsQuery, page, queryClient]);

	return <LogsContext.Provider value={value}>{children}</LogsContext.Provider>;
}

export default LogsContext;

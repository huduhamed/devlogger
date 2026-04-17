import { useQuery, useQueryClient } from '@tanstack/react-query';

// internal imports
import API from '../services/api';

async function fetchOrg() {
	const res = await API.get('/organizations/me');
	return res.data?.data || null;
}

export function useOrgQuery() {
	const queryClient = useQueryClient();

	const query = useQuery({
		queryKey: ['org', 'me'],
		queryFn: fetchOrg,
		staleTime: 10 * 60 * 1000,
		gcTime: 30 * 60 * 1000,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		retry: 1,
	});

	const setOrg = (newOrg) => {
		queryClient.setQueryData(['org', 'me'], newOrg);
	};

	return {
		org: query.data ?? null,
		loading: query.isLoading,
		error: query.error ?? null,
		refresh: query.refetch,
		setOrg,
		isFetching: query.isFetching,
	};
}

export default useOrgQuery;

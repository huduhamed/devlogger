import { createContext, useCallback, useMemo, useState } from 'react';

// internal imports
import API from '../services/api';

const OrgContext = createContext();

export function OrgProvider({ children }) {
	const [org, setOrg] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const refresh = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await API.get('/organizations/me');
			setOrg(res.data?.data || null);
		} catch (err) {
			setError(err.response?.data?.message || err.message || 'Failed to load organization');
		} finally {
			setLoading(false);
		}
	}, []);

	const value = useMemo(
		() => ({ org, setOrg, loading, error, refresh }),
		[org, loading, error, refresh]
	);

	return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export default OrgContext;

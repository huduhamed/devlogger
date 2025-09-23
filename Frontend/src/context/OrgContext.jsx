import { createContext, useCallback, useMemo, useRef, useState } from 'react';

// internal imports
import API from '../services/api';

const OrgContext = createContext();

export function OrgProvider({ children }) {
	const [org, setOrg] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
  const inflight = useRef(false);

	const refresh = useCallback(async () => {
		if (inflight.current) return;
		inflight.current = true;
		setLoading(true);
		setError(null);
		try {
			const res = await API.get('/organizations/me');
			setOrg(res.data?.data || null);
		} catch (err) {
			setError(err.response?.data?.message || err.message || 'Failed to load organization');
		} finally {
			setLoading(false);
			inflight.current = false;
		}
	}, []);

	const value = useMemo(
		() => ({ org, setOrg, loading, error, refresh }),
		[org, loading, error, refresh]
	);

	return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export default OrgContext;

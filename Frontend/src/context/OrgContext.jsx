import { createContext, useMemo } from 'react';

// internal imports
import useOrgQuery from './useOrgQuery';

// org context
const OrgContext = createContext();

// org provider
export function OrgProvider({ children }) {
	const { org, setOrg, loading, error, refresh } = useOrgQuery();

	const value = useMemo(
		() => ({ org, setOrg, loading, error, refresh }),
		[org, setOrg, loading, error, refresh]
	);

	return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export default OrgContext;

import { useContext, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// internal imports
import AuthContext from '../context/AuthContext';
import OrgContext from '../context/OrgContext.jsx';

// private routes
function PrivateRoute() {
	const { auth } = useContext(AuthContext);
	const { refresh, org } = useContext(OrgContext);

	// bootstrap org on first entry
	useEffect(() => {
		if (auth?.token && !org) {
			refresh();
		}
	}, [auth?.token, org, refresh]);

	// route based on auth presence
	return auth?.token ? <Outlet /> : <Navigate to="/sign-in" replace />;
}

export default PrivateRoute;

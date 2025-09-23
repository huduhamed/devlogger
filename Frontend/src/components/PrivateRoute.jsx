import { useContext, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// internal imports
import AuthContext from '../context/AuthContext';
import OrgContext from '../context/OrgContext.jsx';

// private routes
function PrivateRoute() {
	const { auth } = useContext(AuthContext);
	const { refresh, org } = useContext(OrgContext);

	// if no token, redirect to sign-in
	if (!auth?.token) {
		return <Navigate to="/sign-in" replace />;
	}

	// bootstrap org on first entry
	useEffect(() => {
		if (auth?.token && !org) {
			refresh();
		}
	}, [auth?.token, org, refresh]);

	// if token exists
	return <Outlet />;
}

export default PrivateRoute;

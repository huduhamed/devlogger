import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// internal imports
import AuthContext from '../context/AuthContext';

// private routes
function PrivateRoute() {
	const { auth } = useContext(AuthContext);

	// if no token, redirect to sign-in
	if (!auth?.token) {
		return <Navigate to="/sign-in" replace />;
	}

	// if token exists
	return <Outlet />;
}

export default PrivateRoute;

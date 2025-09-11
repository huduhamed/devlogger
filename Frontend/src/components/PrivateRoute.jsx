import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// internal imports
import AuthContext from '../context/AuthContext';

// private routes
function PrivateRoute() {
	const { user } = useContext(AuthContext);

	return user ? <Outlet /> : <Navigate to="/" />;
}

export default PrivateRoute;

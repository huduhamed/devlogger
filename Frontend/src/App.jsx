import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute.jsx';
import { Dashboard, SignIn, SignUp } from './index';
import { isAuthenticated } from './services/auth.js';
import './index.css';

function App() {
	return (
		<Routes>
			<Route path="/" element={isAuthenticated() ? <Navigate to="/dashboard" /> : <SignIn />} />
			<Route path="/signup" element={<SignUp />} />
			<Route element={<PrivateRoute />}>
				<Route
					path="/dashboard"
					element={isAuthenticated() ? <Dashboard /> : <Navigate to="/" />}
				/>
			</Route>
		</Routes>
	);
}

export default App;

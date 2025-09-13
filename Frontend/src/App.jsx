import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute.jsx';
import { Dashboard, SignIn, SignUp } from './index';
// import { isAuthenticated } from './services/auth.js';
import './index.css';

function App() {
	return (
		<Routes>
			{/* public routes */}
			<Route path="/" element={<SignIn />} />
			<Route path="/sign-up" element={<SignUp />} />

			{/* private routes */}
			<Route element={<PrivateRoute />}>
				<Route path="/dashboard" element={<Dashboard />} />
			</Route>

			{/* redirect unknown routes */}
			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
}

export default App;

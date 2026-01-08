import { Routes, Route, Navigate } from 'react-router-dom';

// internal imports
import PrivateRoute from './components/PrivateRoute.jsx';
import { Dashboard, SignIn, SignUp, Navbar, LogsList, Pricing, Notifications } from './index';
import Settings from './pages/Settings.jsx';
import OrganizationSettings from './pages/OrganizationSettings.jsx';
import CreateLog from './pages/CreateLog.jsx';
import Home from './pages/Home.jsx';
import CheckoutSuccess from './pages/CheckoutSuccess.jsx';

function App() {
	return (
		<div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
			<Navbar />

			<div className="flex-1 p-6">
				<Routes>
					{/* public home pages */}
					<Route path="/" element={<Home />} />
					<Route path="/sign-in" element={<SignIn />} />
					<Route path="/sign-up" element={<SignUp />} />

					{/* private routes */}
					<Route element={<PrivateRoute />}>
						<Route path="/dashboard" element={<Dashboard />} />
						<Route path="/notifications" element={<Notifications />} />
						<Route path="/create-log" element={<CreateLog />} />
						<Route path="/logs" element={<LogsList />} />
						<Route path="/organization" element={<OrganizationSettings />} />
						<Route path="/settings" element={<Settings />} />
					</Route>

					{/* pricing */}
					<Route path="/pricing" element={<Pricing />} />
				<Route path="/checkout-success" element={<CheckoutSuccess />} />
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
			</div>
		</div>
	);
}

export default App;

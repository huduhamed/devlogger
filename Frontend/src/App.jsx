import { Routes, Route, Navigate } from 'react-router-dom';

// internal imports
import PrivateRoute from './components/PrivateRoute.jsx';
import { Dashboard, SignIn, SignUp, Navbar, LogsList, Pricing } from './index';
import Settings from './pages/Settings.jsx';
import OrganizationSettings from './pages/OrganizationSettings.jsx';
import CreateLog from './pages/CreateLog.jsx';
import Home from './pages/Home.jsx';

function App() {
	return (
		<div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
			{/* Navbar always at top, but hidden for guests */}
			<Navbar />

			<div className="flex-1 p-6">
				<Routes>
					{/* public home page */}
					<Route path="/" element={<Home />} />
					<Route path="/sign-in" element={<SignIn />} />
					<Route path="/sign-up" element={<SignUp />} />

					{/* private routes */}
					<Route element={<PrivateRoute />}> 
						<Route path="/dashboard" element={<Dashboard />} />
						<Route path="/create-log" element={<CreateLog />} />
						<Route path="/logs" element={<LogsList />} />
						<Route path="/organization" element={<OrganizationSettings />} />
						<Route path="/settings" element={<Settings />} />
					</Route>

					{/* public pricing */}
					<Route path="/pricing" element={<Pricing />} />

					{/* redirect unknown */}
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
			</div>
		</div>
	);
}

export default App;

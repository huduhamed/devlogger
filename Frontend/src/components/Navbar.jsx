import { NavLink, useNavigate } from 'react-router-dom';
import { useContext } from 'react';

// internal imports
import { AuthContext } from '../context/AuthContext';

// nav bar
function Navbar() {
	const { auth, logout } = useContext(AuthContext);
	const navigate = useNavigate();

	// handle log out
	const handleLogout = () => {
		logout();
		navigate('/');
	};

	const linkClasses = ({ isActive }) =>
		`px-4 py-2 rounded-lg transition-colors duration-200 ${
			isActive ? 'bg-blue-500 text-white shadow-md' : 'text-gray-700 hover:bg-blue-100'
		}`;

	// hide navbar if not signed in
	if (!auth?.user) return null;

	return (
		<nav className="bg-white shadow-md sticky top-0 z-50">
			<div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
				{/* Left side - app title */}
				<h1 className="text-xl font-bold text-blue-600">DevLogger</h1>

				{/* Middle links */}
				<div className="flex gap-4">
					<NavLink to="/dashboard" className={linkClasses}>
						Dashboard
					</NavLink>
					<NavLink to="/create-log" className={linkClasses}>
						Create Log
					</NavLink>
					<NavLink to="/logs" className={linkClasses}>
						View Logs
					</NavLink>
				</div>

				{/* Right side - user profile & logout */}
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-2">
						<div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
							{auth.user?.name?.[0]?.toUpperCase() || 'U'}
						</div>
						<span className="capitalize font-medium">{auth.user?.name}</span>
					</div>
					<button
						onClick={handleLogout}
						className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
					>
						Logout
					</button>
				</div>
			</div>
		</nav>
	);
}

export default Navbar;

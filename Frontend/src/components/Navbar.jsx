import { NavLink, useNavigate } from 'react-router-dom';
import { useContext } from 'react';

// internal imports
import AuthContext from '../context/AuthContext';
import ThemeContext from '../context/ThemeContext.jsx';
import Button from './ui/Button.jsx';
import OrgContext from '../context/OrgContext.jsx';

// nav bar
function Navbar() {
	const { auth, logout } = useContext(AuthContext);
	const { theme, toggle } = useContext(ThemeContext);
	const { org } = useContext(OrgContext);
	const navigate = useNavigate();

	// handle log out
	const handleLogout = () => {
		logout();
		navigate('/');
	};

	const linkClasses = ({ isActive }) =>
		`px-4 py-2 rounded-lg transition-colors duration-200 ${
			isActive
				? 'bg-blue-600 text-white shadow-md'
				: 'text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-gray-800'
		}`;

	// We show a minimal navbar for guests (pricing, sign in links could be added later)

	return (
		<nav className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-900/80 shadow-md sticky top-0 z-50">
			<div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
				{/* Left side - app title */}
				<h1 className="text-xl font-bold text-blue-600">DevLogger</h1>

				{/* Middle links */}
				<div className="flex gap-4">
					<NavLink to="/pricing" className={linkClasses}>
						Pricing
					</NavLink>
					{auth?.user && (
						<>
							<NavLink to="/dashboard" className={linkClasses}>
								Dashboard
							</NavLink>
							<NavLink to="/create-log" className={linkClasses}>
								Create Log
							</NavLink>
							<NavLink to="/logs" className={linkClasses}>
								View Logs
							</NavLink>
							<NavLink to="/organization" className={linkClasses}>
								Organization
							</NavLink>
						</>
					)}
				</div>

				{/* Right side - user profile & logout */}
				<div className="flex items-center gap-3">
					<Button variant="ghost" onClick={toggle} title="Toggle theme" className="mr-1">
						{theme === 'dark' ? '🌙' : '☀️'}
					</Button>
					{auth?.user ? (
						<div className="flex items-center gap-3">
							{org && (
								<div className="hidden md:flex flex-col items-end mr-2 text-xs text-gray-600 dark:text-gray-300">
									<span className="font-medium">{org.name}</span>
									<span className="capitalize">Plan: {org.plan}</span>
								</div>
							)}
							<NavLink to="/settings" className={linkClasses} title="Settings">⚙️</NavLink>
							<div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
								{auth.user?.name?.[0]?.toUpperCase() || 'U'}
							</div>
							<span className="capitalize font-medium mr-2">{auth.user?.name}</span>
							<Button variant="danger" onClick={handleLogout}>Logout</Button>
						</div>
					) : (
						<NavLink to="/sign-in" className="text-sm text-blue-600 hover:underline">Sign In</NavLink>
					)}
				</div>
			</div>
		</nav>
	);
}

export default Navbar;

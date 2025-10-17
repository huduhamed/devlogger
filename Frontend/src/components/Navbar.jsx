import { NavLink, useNavigate } from 'react-router-dom';
import { useContext } from 'react';

// internal imports
import AuthContext from '../context/AuthContext';
import ThemeContext from '../context/ThemeContext.jsx';
import Button from './ui/Button.jsx';
// no org context usage in navbar to keep UI minimal

// nav bar
function Navbar() {
	const { auth, logout } = useContext(AuthContext);
	const { theme, toggle } = useContext(ThemeContext);
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
		<nav className="glass-navbar glass-navbar--primary sticky top-0 z-50">
			<div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
				{/* Left side - app title (clickable logo) */}
				<NavLink to="/" title="Home">
					<h1
						className="text-2xl font-extrabold brand-text cursor-pointer select-none flex items-center gap-2 tracking-tight drop-shadow-sm hover:scale-105 dark:hover:text-blue-100 transition-transform duration-200"
						style={{ letterSpacing: '-1px' }}
					>
						<span className="inline-block brand-text">DevLogger</span>
					</h1>
				</NavLink>

				{/* Middle links */}
				<div className="flex gap-4">
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
							<NavLink to="/settings" className={linkClasses} title="Settings">
								⚙️
							</NavLink>
							<NavLink to="/settings" title="Profile Settings">
								<div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold overflow-hidden cursor-pointer">
									{auth.user?.avatarUrl ? (
										<img
											src={auth.user.avatarUrl}
											alt="avatar"
											className="w-full h-full object-cover"
										/>
									) : (
										auth.user?.name?.[0]?.toUpperCase() || 'U'
									)}
								</div>
							</NavLink>
							<span className="capitalize font-medium mr-2">{auth.user?.name}</span>
							<Button variant="danger" onClick={handleLogout}>
								Logout
							</Button>
						</div>
					) : (
						<div className="flex gap-2">
							<NavLink to="/pricing">
								<Button
									variant="ghost"
									size="sm"
									className="font-semibold border border-blue-400 px-4 py-1 hover:bg-blue-50 transition"
								>
									Pricing
								</Button>
							</NavLink>
							<NavLink to="/sign-up">
								<Button variant="primary" size="sm" className="font-semibold px-4 py-1">
									Sign Up
								</Button>
							</NavLink>
							<NavLink to="/sign-in">
								<Button variant="outline" size="sm" className="font-semibold px-4 py-1">
									Sign In
								</Button>
							</NavLink>
						</div>
					)}
				</div>
			</div>
		</nav>
	);
}

export default Navbar;

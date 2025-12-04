import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';

// internal imports
import AuthContext from '../context/AuthContext';
import ThemeContext from '../context/ThemeContext.jsx';
import Button from './ui/Button.jsx';
import Notification from './ui/Notification.jsx';

// nav bar
function Navbar() {
	const { auth, logout } = useContext(AuthContext);
	const { theme, toggle } = useContext(ThemeContext);
	const navigate = useNavigate();
	const location = useLocation();
	const [open, setOpen] = useState(false);

	// handle log out
	const handleLogout = () => {
		logout();
		navigate('/');
	};

	useEffect(() => {
		// close mobile menu on navigation
		setOpen(false);
	}, [location.pathname]);

	const linkClasses = ({ isActive }) =>
		`px-3 md:px-4 py-2 rounded-lg transition-colors duration-200 ${
			isActive
				? 'bg-blue-600 text-white shadow-md'
				: 'text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-gray-800'
		}`;

	return (
		<nav className="glass-navbar glass-navbar--primary sticky top-0 z-50">
			<div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between min-w-0 w-full">
				{/* Brand */}
				<NavLink to="/" title="Home" className="flex items-center gap-2 flex-shrink-0">
					<h1
						className="text-2xl font-extrabold brand-text cursor-pointer select-none tracking-tight drop-shadow-sm dark:hover:text-blue-100 transition-transform duration-200"
						style={{ letterSpacing: '-1px' }}
					>
						<span className="inline-block brand-text">Dev</span>
					</h1>
				</NavLink>

				{/* Desktop nav links */}
				<div className="hidden md:flex md:items-center md:gap-4 min-w-0">
					{auth?.user && (
						<>
							<NavLink to="/dashboard" className={linkClasses}>
								Dashboard
							</NavLink>
							<NavLink to="/create-log" className={linkClasses}>
								Create
							</NavLink>
							<NavLink to="/logs" className={linkClasses}>
								Logs
							</NavLink>
							<NavLink to="/organization" className={linkClasses}>
								Organization
							</NavLink>
						</>
					)}
				</div>

				{/* Right side - desktop actions */}
				<div className="hidden md:flex md:items-center md:gap-3 min-w-0">
					<Button
						variant="ghost"
						onClick={toggle}
						title="Toggle theme"
						className="mr-1 focus-brand"
					>
						{theme === 'dark' ? '🌙' : '☀️'}
					</Button>
					{auth?.user ? (
						<div className="flex items-center gap-3 min-w-0">
							<Notification />
							<NavLink to="/settings" className={linkClasses} title="Settings">
								⚙️
							</NavLink>
							<NavLink to="/settings" title="Profile Settings" className="flex-shrink-0">
								<div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold overflow-hidden cursor-pointer flex-shrink-0">
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
							<span className="capitalize font-medium mr-2 hidden lg:inline truncate max-w-[7rem]">
								{auth.user?.name}
							</span>
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

				{/* Mobile: Hamburger */}
				<div className="md:hidden border border-white flex items-center">
					<Button
						variant="ghost"
						onClick={() => setOpen((v) => !v)}
						aria-controls="mobile-menu"
						aria-expanded={open}
						aria-label={open ? 'Close menu' : 'Open menu'}
						className="p-2"
					>
						{open ? '✕' : '☰'}
					</Button>
				</div>
			</div>

			{/* Mobile menu panel */}
			<div
				id="mobile-menu"
				className={`md:hidden px-4 pb-4 transition-[max-height,opacity] ease-out duration-200 overflow-hidden ${
					open ? 'max-h-[900px] opacity-100' : 'max-h-0 opacity-0'
				}`}
			>
				<div className="flex flex-col gap-2">
					{auth?.user ? (
						<>
							<NavLink
								to="/dashboard"
								className={({ isActive }) => `${linkClasses({ isActive })} block`}
							>
								Dashboard
							</NavLink>
							<NavLink
								to="/create-log"
								className={({ isActive }) => `${linkClasses({ isActive })} block`}
							>
								Create
							</NavLink>
							<NavLink
								to="/logs"
								className={({ isActive }) => `${linkClasses({ isActive })} block`}
							>
								Logs
							</NavLink>
							<NavLink
								to="/organization"
								className={({ isActive }) => `${linkClasses({ isActive })} block`}
							>
								Organization
							</NavLink>
							<div className="flex items-center gap-2 mt-2">
								<Button variant="ghost" onClick={toggle} className="focus-brand">
									{theme === 'dark' ? '🌙' : '☀️'}
								</Button>
								<NavLink to="/settings" className={linkClasses} title="Settings">
									⚙️
								</NavLink>
								<Button variant="danger" onClick={handleLogout} className="ml-auto">
									Logout
								</Button>
							</div>
						</>
					) : (
						<>
							<NavLink
								to="/pricing"
								className={({ isActive }) => `${linkClasses({ isActive })} block`}
							>
								Pricing
							</NavLink>
							<NavLink
								to="/sign-up"
								className={({ isActive }) => `${linkClasses({ isActive })} block`}
							>
								Sign Up
							</NavLink>
							<NavLink
								to="/sign-in"
								className={({ isActive }) => `${linkClasses({ isActive })} block`}
							>
								Sign In
							</NavLink>
						</>
					)}
				</div>
			</div>
		</nav>
	);
}

export default Navbar;

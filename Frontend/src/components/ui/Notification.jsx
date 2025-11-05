import { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

// internal imports
import NotificationsContext from '../../context/NotificationsContext.jsx';

// notification bell comp
function Notification() {
	const [open, setOpen] = useState(false);
	const ref = useRef(null);
	const {
		notifications = [],
		unread = 0,
		loading = false,
		markAllRead,
	} = useContext(NotificationsContext);

	useEffect(() => {
		function onClick(e) {
			if (ref.current && !ref.current.contains(e.target)) {
				setOpen(false);
			}
		}
		window.addEventListener('click', onClick);

		// clean up
		return () => window.removeEventListener('click', onClick);
	}, []);

	const toggle = (e) => {
		e.stopPropagation();
		const willOpen = !open;
		setOpen(willOpen);
		if (willOpen) markAllRead();
	};

	const navigate = useNavigate();

	return (
		<div className="relative" ref={ref}>
			<button
				onClick={toggle}
				title="Notifications"
				className="relative p-2 rounded-md hover:bg-blue-100 dark:hover:bg-gray-800 transition"
			>
				{/* bell icon */}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className="h-6 w-6 text-gray-700 dark:text-gray-200"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
					/>
				</svg>

				{unread > 0 && (
					<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
						{unread}
					</span>
				)}
			</button>

			{/* dropdown */}
			{open && (
				<div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg overflow-hidden z-50">
					<div className="p-3 border-b border-gray-100 dark:border-gray-700 font-semibold">
						Notifications
					</div>
					<div className="max-h-64 overflow-auto">
						{loading ? (
							<div className="p-4 text-sm text-gray-500">Loading...</div>
						) : notifications.length === 0 ? (
							<div className="p-4 text-sm text-gray-500">No notifications</div>
						) : (
							notifications.map((n) => (
								<div
									key={n._id || n.id}
									className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-start"
									onClick={() => {
										// mark read optimistically and navigate to notifications page
										markAllRead();
										navigate('/notifications');
									}}
								>
									<div>
										<div className="text-sm text-gray-800 dark:text-gray-100">{n.text}</div>
										<div className="text-xs text-gray-500 dark:text-gray-400">
											{n.time || new Date(n.createdAt).toLocaleString()}
										</div>
									</div>
									<div className="ml-3">
										{!n.read && <span className="text-xs text-blue-600">New</span>}
									</div>
								</div>
							))
						)}
					</div>
					<div className="p-2 border-t border-gray-100 dark:border-gray-700 text-center">
						<button
							className="text-sm text-blue-600 dark:text-blue-400"
							onClick={() => navigate('/notifications')}
						>
							View all
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

export default Notification;

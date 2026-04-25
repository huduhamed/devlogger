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

	const formatDate = (value) => {
		if (!value) return 'Unknown time';
		const date = new Date(value);
		return Number.isNaN(date.getTime()) ? 'Unknown time' : date.toLocaleString();
	};

	useEffect(() => {
		function onClick(e) {
			if (ref.current && !ref.current.contains(e.target)) {
				setOpen(false);
			}
		}

		function onEscape(e) {
			if (e.key === 'Escape') {
				setOpen(false);
			}
		}
		window.addEventListener('click', onClick);
		window.addEventListener('keydown', onEscape);

		// clean up
		return () => {
			window.removeEventListener('click', onClick);
			window.removeEventListener('keydown', onEscape);
		};
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
				type="button"
				title="Notifications"
				aria-label="Notifications"
				aria-haspopup="menu"
				aria-expanded={open}
				aria-controls="notifications-menu"
				className="relative p-2 rounded-md hover:bg-slate-100 dark:hover:bg-gray-800 transition"
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
				<span className="sr-only">{`${unread} unread notifications`}</span>
			</button>

			{/* dropdown */}
			{open && (
				<div
					id="notifications-menu"
					role="menu"
					aria-label="Notifications"
					className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-1rem)] bg-stone-50 dark:bg-gray-800 border border-stone-200 dark:border-gray-700 rounded-md shadow-lg overflow-hidden z-50"
				>
					<div className="p-3 border-b border-stone-200 dark:border-gray-700 font-semibold">
						Notifications
					</div>
					<div className="max-h-64 overflow-auto">
						{loading ? (
							<div role="status" aria-live="polite" className="p-4 text-sm text-slate-500">
								Loading...
							</div>
						) : notifications.length === 0 ? (
							<div className="p-4 text-sm text-slate-500">No notifications</div>
						) : (
							notifications.map((n) => (
								<button
									type="button"
									role="menuitem"
									key={n._id || n.id}
									className="w-full p-3 hover:bg-stone-100 dark:hover:bg-gray-700 text-left cursor-pointer flex justify-between items-start"
									onClick={() => {
										// mark read optimistically
										markAllRead();
										navigate('/notifications');
									}}
								>
									<div>
										<div className="text-sm text-slate-800 dark:text-gray-100 break-words">
											{n.text}
										</div>
										<div className="text-xs text-slate-500 dark:text-gray-400">
											{n.time || formatDate(n.createdAt)}
										</div>
									</div>
									<div className="ml-3">
										{!n.read && <span className="text-xs text-blue-600">New</span>}
									</div>
								</button>
							))
						)}
					</div>
					<div className="p-2 border-t border-stone-200 dark:border-gray-700 text-center">
						<button
							type="button"
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

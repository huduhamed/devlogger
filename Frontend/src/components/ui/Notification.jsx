import { useState, useRef, useEffect } from 'react';

// notification bell comp
function Notification() {
	const [open, setOpen] = useState(false);
	const [notifications, setNotifications] = useState([]);
	const [unread, setUnread] = useState(0);
	const ref = useRef(null);

	useEffect(() => {
		// placeholder mock notifications; replace with real data later
		const mock = [
			{ id: 1, text: 'New log created in Project Alpha', time: '2m' },
			{ id: 2, text: 'Organization settings updated', time: '1h' },
			{ id: 3, text: 'Billing invoice ready', time: '1d' },
		];
		setNotifications(mock);
		setUnread(mock.length);
	}, []);

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

		setOpen((s) => !s);
		// marking unread as 0 for now when opening
		if (!open) setUnread(0);
	};

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
						{notifications.length === 0 ? (
							<div className="p-4 text-sm text-gray-500">No notifications</div>
						) : (
							notifications.map((n) => (
								<div
									key={n.id}
									className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
								>
									<div className="text-sm text-gray-800 dark:text-gray-100">{n.text}</div>
									<div className="text-xs text-gray-500 dark:text-gray-400">{n.time}</div>
								</div>
							))
						)}
					</div>
					<div className="p-2 border-t border-gray-100 dark:border-gray-700 text-center">
						<button className="text-sm text-blue-600 dark:text-blue-400">View all</button>
					</div>
				</div>
			)}
		</div>
	);
}

export default Notification;

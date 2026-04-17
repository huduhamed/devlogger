import { useContext } from 'react';

// internal imports
import NotificationsContext from '../context/NotificationsContext.jsx';

// notifications page
function Notifications() {
	const {
		notifications = [],
		loading,
		error,
		fetchNotifications,
		markRead,
	} = useContext(NotificationsContext);

	const formatDate = (value) => {
		if (!value) return 'Unknown time';
		const date = new Date(value);
		return Number.isNaN(date.getTime()) ? 'Unknown time' : date.toLocaleString();
	};

	return (
		<div className="max-w-3xl mx-auto px-4">
			<h2 className="text-2xl font-bold mb-4">Notifications</h2>

			<div className="bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
				{loading ? (
					<div className="p-4 text-sm text-gray-500">Loading...</div>
				) : error ? (
					<div className="p-4">
						<p className="text-sm text-red-600">{error}</p>
						<button
							className="mt-2 text-sm text-blue-600 hover:underline"
							onClick={fetchNotifications}
						>
							Retry
						</button>
					</div>
				) : notifications.length === 0 ? (
					<div className="p-6 text-center text-gray-500">You have no notifications.</div>
				) : (
					<ul>
						{notifications.map((n) => (
							<li
								key={n.id || n._id}
								className="p-4 border-b last:border-b-0 border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start gap-3"
							>
								<div>
									<div className="text-sm text-gray-900 dark:text-gray-100">{n.text}</div>
									<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
										{formatDate(n.createdAt)}
									</div>
								</div>
								<div className="ml-0 sm:ml-4 w-full sm:w-auto">
									{!n.read && (
										<button
											className="text-sm text-blue-600 hover:underline w-full sm:w-auto text-left sm:text-right"
											onClick={() => markRead(n.id || n._id)}
										>
											Mark read
										</button>
									)}
								</div>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}

export default Notifications;

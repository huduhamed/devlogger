import { useContext } from 'react';

// internal imports
import NotificationsContext from '../context/NotificationsContext.jsx';

// notifications page
function Notifications() {
	const { notifications = [], loading, markRead } = useContext(NotificationsContext);

	return (
		<div className="max-w-4xl mx-auto">
			<h2 className="text-2xl font-bold mb-4">Notifications</h2>

			<div className="bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
				{loading ? (
					<div className="p-4 text-sm text-gray-500">Loading...</div>
				) : notifications.length === 0 ? (
					<div className="p-6 text-center text-gray-500">You have no notifications.</div>
				) : (
					<ul>
						{notifications.map((n) => (
							<li
								key={n.id || n._id}
								className="p-4 border-b last:border-b-0 border-gray-100 dark:border-gray-700 flex justify-between items-start"
							>
								<div>
									<div className="text-sm text-gray-900 dark:text-gray-100">{n.text}</div>
									<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
										{new Date(n.createdAt).toLocaleString()}
									</div>
								</div>
								<div className="ml-4">
									{!n.read && (
										<button
											className="text-sm text-blue-600 hover:underline"
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

import { useContext } from 'react';

// internal imports
import NotificationsContext from '../context/NotificationsContext.jsx';
import Button from '../components/ui/Button.jsx';

// notifications page
function Notifications() {
	const {
		notifications = [],
		loading,
		error,
		fetchNotifications,
		markRead,
		markAllRead,
		unread,
	} = useContext(NotificationsContext);

	const formatDate = (value) => {
		if (!value) return 'Unknown time';
		const date = new Date(value);
		return Number.isNaN(date.getTime()) ? 'Unknown time' : date.toLocaleString();
	};

	return (
		<div className="max-w-3xl mx-auto px-4" role="main" aria-labelledby="notifications-heading">
			<h2 id="notifications-heading" className="text-2xl font-bold mb-4">
				Notifications
			</h2>

			<div className="bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
				{loading ? (
					<div className="p-4 text-sm text-gray-500" role="status" aria-live="polite">
						Loading...
					</div>
				) : error ? (
					<div className="p-4">
						<p className="text-sm text-red-600">{error}</p>
						<div className="mt-2">
							<Button
								size="sm"
								variant="outline"
								onClick={fetchNotifications}
								aria-label="Retry fetching notifications"
							>
								Retry
							</Button>
						</div>
					</div>
				) : notifications.length === 0 ? (
					<div className="p-6 text-center text-gray-500">You have no notifications.</div>
				) : (
					<>
						<div className="p-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
							<div className="text-sm text-gray-700">
								{unread > 0 ? `${unread} unread` : 'All caught up'}
							</div>
							{unread > 0 && (
								<div>
									<Button
										size="sm"
										variant="secondary"
										onClick={markAllRead}
										aria-label="Mark all notifications as read"
									>
										Mark all read
									</Button>
								</div>
							)}
						</div>

						<ul role="list" aria-labelledby="notifications-heading">
							{notifications.map((n) => (
								<li
									key={n.id || n._id}
									role="listitem"
									aria-labelledby={`notif-${n.id || n._id}-title`}
									tabIndex={0}
									className={`p-4 border-b last:border-b-0 border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start gap-3 ${n.read ? '' : 'bg-blue-50 dark:bg-gray-900/60'}`}
								>
									<article id={`notif-${n.id || n._id}`} role="article" className="flex-1">
										<div
											id={`notif-${n.id || n._id}-title`}
											className="text-sm text-gray-900 dark:text-gray-100"
										>
											{n.text}
										</div>
										<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
											{formatDate(n.createdAt)}
										</div>
									</article>
									<div className="ml-0 sm:ml-4 w-full sm:w-auto">
										{!n.read && (
											<Button
												size="sm"
												variant="primary"
												onClick={() => markRead(n.id || n._id)}
												aria-label={`Mark notification ${n.id || n._id} as read`}
											>
												Mark read
											</Button>
										)}
									</div>
								</li>
							))}
						</ul>
					</>
				)}
			</div>
		</div>
	);
}

export default Notifications;

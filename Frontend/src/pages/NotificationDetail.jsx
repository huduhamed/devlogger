import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import API from '../services/api';
import Card, { CardBody, CardHeader } from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import NotificationsContext from '../context/NotificationsContext.jsx';

function formatDate(value) {
	if (!value) return 'Unknown date';
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? 'Unknown date' : date.toLocaleString();
}

// Details rendering removed — keep only the message and date for simplicity

function NotificationDetail() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { notifications = [], markRead } = useContext(NotificationsContext);
	const [notification, setNotification] = useState(null);
	const [isMarkingRead, setIsMarkingRead] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const cachedNotification = useMemo(
		() => notifications.find((item) => (item._id || item.id) === id),
		[notifications, id],
	);

	useEffect(() => {
		let active = true;

		(async () => {
			setLoading(true);
			setError(null);
			try {
				const res = await API.get(`/notifications/${id}`);
				if (!active) return;
				const nextNotification = res.data?.data || null;
				setNotification(nextNotification);
				if (nextNotification && !nextNotification.read) {
					markRead?.(id);
				}
			} catch (err) {
				if (!active) return;
				setError(err?.response?.data?.message || 'Failed to load this notification.');
			} finally {
				if (active) setLoading(false);
			}
		})();

		return () => {
			active = false;
		};
	}, [id, markRead]);

	const data = notification || cachedNotification;
	// Keep a compact "Mark as read" action for quick dismissals

	const handleMarkRead = async () => {
		if (!data || data.read) return;
		setIsMarkingRead(true);
		try {
			await markRead?.(id);
			setNotification((prev) => (prev ? { ...prev, read: true } : prev));
		} catch {
			// swallow — context handles toasts
		} finally {
			setIsMarkingRead(false);
		}
	};

	return (
		<div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
			<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Notification</h1>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button variant="outline" onClick={() => navigate('/notifications')}>
						View all
					</Button>
					<Button variant="secondary" onClick={() => navigate('/notifications')}>
						Back
					</Button>
				</div>
			</div>

			<Card>
				<CardHeader
					title={loading ? 'Loading...' : data?.text || 'Notification not found'}
					subtitle={formatDate(data?.createdAt)}
					actions={
						<div className="flex items-center gap-2">
							{data && !data.read && (
								<Button
									size="sm"
									variant="outline"
									loading={isMarkingRead}
									onClick={handleMarkRead}
								>
									Mark as read
								</Button>
							)}
						</div>
					}
				/>
				<CardBody>
					{error ? (
						<p className="text-sm text-red-600">{error}</p>
					) : data ? (
						<div>
							<p className="text-base text-gray-800 dark:text-gray-200 leading-7">{data.text}</p>
						</div>
					) : (
						<p className="text-sm text-gray-500 dark:text-gray-400">
							No notification data available.
						</p>
					)}
				</CardBody>
			</Card>
		</div>
	);
}

export default NotificationDetail;

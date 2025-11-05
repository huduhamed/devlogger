import { useState, createContext, useEffect, useContext } from 'react';
import { io as ioClient } from 'socket.io-client';

// internal imports
import API from '../services/api';
import AuthContext from './AuthContext.jsx';

// create context
const NotificationsContext = createContext();

// notif provider
export function NotificationsProvider({ children }) {
	const { auth } = useContext(AuthContext);
	const [notifications, setNotifications] = useState([]);
	const [unread, setUnread] = useState(0);
	const [loading, setLoading] = useState(false);

	const fetchNotifications = async () => {
		setLoading(true);
		try {
			// if no auth token, use mock fallback so UI still shows something in dev
			if (!auth?.token) {
				const mock = [
					{ id: 1, text: 'New log created in Project Alpha', time: '2m', read: false },
					{ id: 2, text: 'Organization settings updated', time: '1h', read: false },
					{ id: 3, text: 'Billing invoice ready', time: '1d', read: false },
				];
				setNotifications(mock);
				setUnread(mock.filter((n) => !n.read).length);
			} else {
				const res = await API.get('notifications');
				const data = res?.data?.data || [];
				setNotifications(data);
				// support a meta.unread, fallback to counting unread flags
				const metaUnread = res?.data?.meta?.unread;
				setUnread(typeof metaUnread === 'number' ? metaUnread : data.filter((n) => !n.read).length);
			}
		} catch {
			// on error, keep UI usable with an empty list
			setNotifications([]);
			setUnread(0);
		} finally {
			setLoading(false);
		}
	};

	const markAllRead = async () => {
		// optimistic update
		setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
		setUnread(0);

		try {
			if (auth?.token) {
				await API.post('notifications/mark-all-read');
			}
		} catch {
			// ignore network errors for now
		}
	};

	const markRead = async (id) => {
		setNotifications((prev) =>
			prev.map((n) => (n._id === id || n.id === id ? { ...n, read: true } : n))
		);
		setUnread((u) => Math.max(0, u - 1));

		try {
			if (auth?.token) {
				await API.post(`notifications/${id}/mark-read`);
			}
		} catch {
			// ignore network errors for now
		}
	};

	const addNotification = (notification) => {
		setNotifications((prev) => [notification, ...prev]);
		setUnread((u) => u + (notification.read ? 0 : 1));
	};

	// fetch when a user signs in; clear when signed out and start polling
	useEffect(() => {
		let intervalId;
		if (auth?.user) {
			// initial fetch
			fetchNotifications();
			// poll every 30s
			intervalId = setInterval(fetchNotifications, 30 * 1000);
		} else {
			setNotifications([]);
			setUnread(0);
		}

		// clean up
		return () => {
			if (intervalId) clearInterval(intervalId);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [auth?.user]);

	// socket.io real-time connection: connect when authenticated
	useEffect(() => {
		let socket;
		if (auth?.token) {
			const url =
				import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || window.location.origin;
			socket = ioClient(url, { auth: { token: auth.token } });

			socket.on('connect', () => {
				// connected
			});

			socket.on('notification', (n) => {
				if (n) addNotification(n);
			});

			socket.on('connect_error', () => {
				// ignore for now
			});
		}

		return () => {
			if (socket) socket.disconnect();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [auth?.token]);

	return (
		<NotificationsContext.Provider
			value={{
				notifications,
				unread,
				loading,
				fetchNotifications,
				markAllRead,
				markRead,
				addNotification,
			}}
		>
			{children}
		</NotificationsContext.Provider>
	);
}

export default NotificationsContext;

import { useMemo, createContext, useEffect, useContext, useCallback } from 'react';
import { io as ioClient } from 'socket.io-client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// internal imports
import API from '../services/api';
import AuthContext from './AuthContext.jsx';

function toOrigin(value) {
	if (!value) return null;

	try {
		return new URL(value, window.location.origin).origin;
	} catch {
		return null;
	}
}

function getSocketServerUrl() {
	const apiOrigin = toOrigin(import.meta.env.VITE_API_URL);
	const configuredSocketOrigin = toOrigin(import.meta.env.VITE_SOCKET_URL);

	if (
		configuredSocketOrigin &&
		apiOrigin &&
		configuredSocketOrigin === window.location.origin &&
		apiOrigin !== window.location.origin
	) {
		return apiOrigin;
	}

	return configuredSocketOrigin || apiOrigin || window.location.origin;
}

// create context
const NotificationsContext = createContext();

// notif provider
export function NotificationsProvider({ children }) {
	const { auth } = useContext(AuthContext);
	const queryClient = useQueryClient();

	const notificationsQuery = useQuery({
		queryKey: ['notifications'],
		queryFn: async () => {
			const res = await API.get('notifications');
			return res?.data?.data || [];
		},
		enabled: Boolean(auth?.token),
		staleTime: 60 * 1000,
		gcTime: 30 * 60 * 1000,
		refetchOnWindowFocus: true,
		refetchOnReconnect: true,
		refetchInterval: auth?.token ? 120 * 1000 : false,
		retry: 1,
		placeholderData: (previousData) => previousData,
	});

	useEffect(() => {
		if (!auth?.token) {
			queryClient.setQueryData(['notifications'], []);
		}
	}, [auth?.token, queryClient]);

	const fetchNotifications = useCallback(async () => {
		await notificationsQuery.refetch();
	}, [notificationsQuery]);

	const markAllRead = useCallback(async () => {
		if (!auth?.token) return;

		const previous = queryClient.getQueryData(['notifications']) || [];
		queryClient.setQueryData(['notifications'], (prev = []) =>
			prev.map((n) => ({ ...n, read: true })),
		);

		try {
			await API.post('notifications/mark-all-read');
		} catch {
			queryClient.setQueryData(['notifications'], previous);
		}
	}, [auth?.token, queryClient]);

	const markRead = useCallback(
		async (id) => {
			if (!auth?.token) return;

			const previous = queryClient.getQueryData(['notifications']) || [];
			queryClient.setQueryData(['notifications'], (prev = []) =>
				prev.map((n) => (n._id === id || n.id === id ? { ...n, read: true } : n)),
			);

			try {
				await API.post(`notifications/${id}/mark-read`);
			} catch {
				queryClient.setQueryData(['notifications'], previous);
			}
		},
		[auth?.token, queryClient],
	);

	const addNotification = useCallback(
		(notification) => {
			if (!notification) return;
			queryClient.setQueryData(['notifications'], (prev = []) => {
				const exists = prev.some(
					(item) => (item._id || item.id) === (notification._id || notification.id),
				);
				if (exists) return prev;
				return [notification, ...prev];
			});
		},
		[queryClient],
	);

	// socket.io real-time connection: connect when authenticated
	useEffect(() => {
		let socket;
		if (auth?.token) {
			const url = getSocketServerUrl();
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
	}, [addNotification, auth?.token]);

	const notifications = useMemo(() => notificationsQuery.data ?? [], [notificationsQuery.data]);
	const unread = useMemo(
		() => notifications.filter((notification) => !notification.read).length,
		[notifications],
	);

	const value = useMemo(
		() => ({
			notifications,
			unread,
			loading: notificationsQuery.isLoading,
			fetching: notificationsQuery.isFetching,
			error:
				notificationsQuery.error?.response?.data?.message ||
				notificationsQuery.error?.message ||
				(notificationsQuery.isError ? 'Failed to load notifications.' : null),
			fetchNotifications,
			markAllRead,
			markRead,
			addNotification,
		}),
		[
			addNotification,
			fetchNotifications,
			markAllRead,
			markRead,
			notifications,
			notificationsQuery.error,
			notificationsQuery.isError,
			notificationsQuery.isFetching,
			notificationsQuery.isLoading,
			unread,
		],
	);

	return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export default NotificationsContext;

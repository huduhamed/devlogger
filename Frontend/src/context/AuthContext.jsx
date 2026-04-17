import { useState, createContext, useEffect, useRef, useCallback, useMemo } from 'react';

// internal imports
import API from '../services/api';

const AuthContext = createContext();
const activityEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];

// auth provider
export function AuthProvider({ children }) {
	const SESSION_TIMEOUT_MS = parseInt(import.meta.env.VITE_SESSION_TIMEOUT_MS || '900000', 10);

	const [auth, setAuth] = useState(() => {
		const token = sessionStorage.getItem('token');
		const user = sessionStorage.getItem('user');

		if (token) {
			API.defaults.headers.Authorization = `Bearer ${token}`;
		}

		return {
			token: token || null,
			user: user ? JSON.parse(user) : null,
		};
	});

	const idleTimerRef = useRef(null);
	const lastActivityRef = useRef(Number(sessionStorage.getItem('lastActivity') || Date.now()));

	const clearIdleTimer = useCallback(() => {
		if (idleTimerRef.current) {
			clearTimeout(idleTimerRef.current);
			idleTimerRef.current = null;
		}
	}, []);

	const logout = useCallback(() => {
		sessionStorage.removeItem('token');
		sessionStorage.removeItem('user');
		sessionStorage.removeItem('lastActivity');
		sessionStorage.removeItem('lastHiddenAt');

		setAuth({ token: null, user: null });

		delete API.defaults.headers.Authorization;
		clearIdleTimer();
	}, [clearIdleTimer]);

	const handleIdleTimeout = useCallback(() => {
		logout();
	}, [logout]);

	const resetIdleTimer = useCallback(() => {
		lastActivityRef.current = Date.now();
		sessionStorage.setItem('lastActivity', String(lastActivityRef.current));
		clearIdleTimer();
		idleTimerRef.current = setTimeout(() => {
			handleIdleTimeout();
		}, SESSION_TIMEOUT_MS);
	}, [SESSION_TIMEOUT_MS, clearIdleTimer, handleIdleTimeout]);

	// signin
	const signin = useCallback(
		(token, user) => {
			sessionStorage.setItem('token', token);
			sessionStorage.setItem('user', JSON.stringify(user));
			sessionStorage.setItem('lastActivity', String(Date.now()));

			lastActivityRef.current = Date.now();

			setAuth({ token, user });

			API.defaults.headers.Authorization = `Bearer ${token}`;
			resetIdleTimer();
		},
		[resetIdleTimer],
	);

	const onVisibilityChange = useCallback(() => {
		if (document.visibilityState === 'hidden') {
			// store when user left
			sessionStorage.setItem('lastHiddenAt', String(Date.now()));
		} else {
			// when returning, check inactivity
			const lastHidden = Number(sessionStorage.getItem('lastHiddenAt') || 0);
			const sinceLast = Date.now() - Math.max(lastHidden, lastActivityRef.current || 0);
			if (sinceLast > SESSION_TIMEOUT_MS) {
				handleIdleTimeout();
			} else {
				resetIdleTimer();
			}
		}
	}, [SESSION_TIMEOUT_MS, handleIdleTimeout, resetIdleTimer]);

	// if auth.token changes, sync Axios header
	useEffect(() => {
		if (auth.token) {
			API.defaults.headers.Authorization = `Bearer ${auth.token}`;
		}
	}, [auth.token]);

	// setup activity listeners and visibility handling for idle logout
	useEffect(() => {
		const handleActivity = () => {
			if (!auth?.token) return;
			resetIdleTimer();
		};

		// attach events
		activityEvents.forEach((ev) => window.addEventListener(ev, handleActivity));
		document.addEventListener('visibilitychange', onVisibilityChange);

		// start timer if already signed in
		if (auth?.token) resetIdleTimer();

		return () => {
			activityEvents.forEach((ev) => window.removeEventListener(ev, handleActivity));
			document.removeEventListener('visibilitychange', onVisibilityChange);
			clearIdleTimer();
		};
	}, [auth?.token, clearIdleTimer, onVisibilityChange, resetIdleTimer]);

	const value = useMemo(() => ({ auth, setAuth, signin, logout }), [auth, signin, logout]);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;

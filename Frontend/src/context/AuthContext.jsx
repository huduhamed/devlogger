import { useState, createContext, useEffect, useRef } from 'react';

// internal imports
import API from '../services/api';

const AuthContext = createContext();

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

	// signin
	const signin = (token, user) => {
		sessionStorage.setItem('token', token);
		sessionStorage.setItem('user', JSON.stringify(user));
		sessionStorage.setItem('lastActivity', String(Date.now()));

		lastActivityRef.current = Date.now();

		setAuth({ token, user });

		API.defaults.headers.Authorization = `Bearer ${token}`;
		resetIdleTimer();
	};

	// logout
	const logout = () => {
		sessionStorage.removeItem('token');
		sessionStorage.removeItem('user');
		sessionStorage.removeItem('lastActivity');
		sessionStorage.removeItem('lastHiddenAt');

		setAuth({ token: null, user: null });

		delete API.defaults.headers.Authorization;
		clearIdleTimer();
	};

	const clearIdleTimer = () => {
		if (idleTimerRef.current) {
			clearTimeout(idleTimerRef.current);
			idleTimerRef.current = null;
		}
	};

	const handleIdleTimeout = () => {
		logout();
	};

	const resetIdleTimer = () => {
		lastActivityRef.current = Date.now();
		sessionStorage.setItem('lastActivity', String(lastActivityRef.current));
		clearIdleTimer();
		idleTimerRef.current = setTimeout(() => {
			handleIdleTimeout();
		}, SESSION_TIMEOUT_MS);
	};

	const activityEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];

	const onVisibilityChange = () => {
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
	};

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
	}, [auth?.token]);

	return (
		<AuthContext.Provider value={{ auth, setAuth, signin, logout }}>
			{children}
		</AuthContext.Provider>
	);
}

export default AuthContext;

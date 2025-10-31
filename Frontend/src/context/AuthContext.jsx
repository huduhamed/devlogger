import { useState, createContext, useEffect } from 'react';

// internal imports
import API from '../services/api';

const AuthContext = createContext();

// auth provider
export function AuthProvider({ children }) {
	const [auth, setAuth] = useState(() => {
		const token = localStorage.getItem('token');
		const user = localStorage.getItem('user');

		if (token) {
			API.defaults.headers.Authorization = `Bearer ${token}`;
		}

		return {
			token: token || null,
			user: user ? JSON.parse(user) : null,
		};
	});

	// signin
	const signin = (token, user) => {
		localStorage.setItem('token', token);
		localStorage.setItem('user', JSON.stringify(user));

		setAuth({ token, user });

		API.defaults.headers.Authorization = `Bearer ${token}`;
	};

	// logout
	const logout = () => {
		localStorage.removeItem('token');
		localStorage.removeItem('user');

		setAuth({ token: null, user: null });

		delete API.defaults.headers.Authorization;
	};

	// if auth.token changes, sync Axios header
	useEffect(() => {
		if (auth.token) {
			API.defaults.headers.Authorization = `Bearer ${auth.token}`;
		}
	}, [auth.token]);

	return (
		<AuthContext.Provider value={{ auth, setAuth, signin, logout }}>
			{children}
		</AuthContext.Provider>
	);
}

export default AuthContext;

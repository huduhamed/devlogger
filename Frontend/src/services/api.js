import axios from 'axios';

const API = axios.create({
	baseURL: import.meta?.env?.VITE_API_URL || 'http://localhost:5500/api/v1/',
	headers: { 'Content-Type': 'application/json' },
	withCredentials: false,
});

// add token to interceptor
API.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem('token');
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error)
);

export default API;

// Normalize error messages (e.g., 401)
API.interceptors.response.use(
	(res) => res,
	(error) => {
		const status = error?.response?.status;
		if (status === 401) {
			error.message = error.response?.data?.message || 'Unauthorized. Please sign in again.';
		} else if (status === 403) {
			error.message = error.response?.data?.message || 'Forbidden. You do not have access.';
		}
		return Promise.reject(error);
	}
);

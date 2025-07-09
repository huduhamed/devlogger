import axios from 'axios';

const API = axios.create({
	baseURL: 'http://localhost:5000/api/auth',
	headers: {
		'Content-Type': 'application/json',
	},
	withCredentials: false,
});

export default API;

import axios from 'axios';

const API = axios.create({
	baseURL: 'http://localhost:5000/api/v1/auth',
	headers: {
		'Content-Type': 'application/json',
	},
	withCredentials: false,
});

export default API;

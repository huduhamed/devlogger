import axios from 'axios';

const API = axios.create({
	baseURL: 'http://localhost:5500',
	headers: {
		'Content-Type': 'application/json',
	},
	withCredentials: false,
});

export default API;

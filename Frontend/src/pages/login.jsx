import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// internal imports
import API from '../services/api';

function Login() {
	const [form, setForm] = useState({ email: '', password: '' });
	const navigate = useNavigate();

	// handleChange
	function handleChange(e) {
		setForm({ ...form, [e.target.name]: e.target.value });
	}

	// handleSubmit
	async function handleSubmit(e) {
		e.preventDefault();

		try {
			const res = await API.post('/login', form);
			localStorage.setItem('token', res.data.token);
			navigate('/dashboard');
		} catch (error) {
			alert('Login failed. Please try again.', error);
		}
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="max-w-sm mx-auto mt-20 w-[400px] space-y-6 flex items-center justify-center min-h-screen flex-col"
		>
			<h3 className="text-center text-blue-700 text-xl font-semibold">Login to Dashboard</h3>
			<input
				type="email"
				name="email"
				value={form.email}
				onChange={handleChange}
				placeholder="Email"
				className="w-full p-2 border border-gray-300 rounded"
			/>
			<input
				type="password"
				name="password"
				value={form.password}
				onChange={handleChange}
				placeholder="Password"
				autoComplete="false"
				className="w-full p-2 border border-gray-300 rounded"
			/>
			<button className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded transition">
				Login
			</button>

			<p className="text-center text-sm">
				Don’t have an account?{' '}
				<Link to="/signup" className="text-blue-600 hover:underline">
					Sign up here
				</Link>
			</p>
		</form>
	);
}

export default Login;

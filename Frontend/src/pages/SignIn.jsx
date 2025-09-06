import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';

function SignIn() {
	const [form, setForm] = useState({ email: '', password: '' });
	const navigate = useNavigate();

	const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

	const handleSubmit = async (e) => {
		e.preventDefault();
		console.log('Form submitted:', form); // check form values

		try {
			const res = await API.post('/sign-in', form);

			const token = res.data.token;
			if (!token) throw new Error('No token returned from API');

			localStorage.setItem('token', res.data.token);
			navigate('/dashboard');
		} catch (error) {
			alert('Signin failed: ' + (error.response?.data?.message || error.message));
			console.error(error);
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="w-full max-w-sm mx-auto mt-20 space-y-6 flex flex-col items-center justify-center min-h-screen"
		>
			<h3 className="text-center text-blue-700 text-xl font-semibold">Sign-in to Dashboard</h3>

			<input
				type="email"
				name="email"
				value={form.email}
				onChange={handleChange}
				placeholder="Email"
				className="w-full p-2 border border-gray-300 rounded"
				autoComplete="email"
			/>

			<input
				type="password"
				name="password"
				value={form.password}
				onChange={handleChange}
				placeholder="Password"
				className="w-full p-2 border border-gray-300 rounded"
				autoComplete="current-password"
			/>

			<button className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded transition">
				Sign In
			</button>

			<p className="text-center text-sm">
				Don’t have an account?{' '}
				<Link to="/sign-up" className="text-blue-600 hover:underline">
					Sign up here
				</Link>
			</p>
		</form>
	);
}

export default SignIn;

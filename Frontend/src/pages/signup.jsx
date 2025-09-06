import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

//internal imports
import API from '../services/api';

function SignUp() {
	const [form, setForm] = useState({ name: '', email: '', password: '' });
	const navigate = useNavigate();

	// handle form change
	const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

	// handle submit
	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			const res = await API.post('/sign-up', form);

			const token = res.data.token;
			if (!token) throw new Error('No token returned from API');

			localStorage.setItem('token', res.data.token);
			navigate('/dashboard');
		} catch (err) {
			alert('Signup failed: ' + (err.response?.data?.message || err.message));
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="mx-auto mt-20 w-[400px] space-y-6 flex items-center justify-center min-h-screen flex-col"
		>
			<h3 className="text-center text-blue-500 text-xl font-semibold">Sign up</h3>
			<div className="space-y-4 w-full flex flex-col">
				<input
					name="name"
					onChange={handleChange}
					placeholder="Name"
					className="w-full p-2 border"
				/>
				<input
					name="email"
					onChange={handleChange}
					placeholder="Email"
					className="w-full p-2 border"
				/>
				<input
					name="password"
					onChange={handleChange}
					placeholder="Password"
					type="password"
					className="w-full p-2 border"
				/>
				<button className="w-80 bg-blue-500 text-white rounded p-2 self-center">Sign Up</button>
			</div>
		</form>
	);
}

export default SignUp;

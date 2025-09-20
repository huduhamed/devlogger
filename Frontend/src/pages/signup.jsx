import { useContext, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

//internal imports
import API from '../services/api';
import AuthContext from '../context/AuthContext';

function SignUp() {
	const [form, setForm] = useState({ name: '', email: '', password: '' });
	const { signin, auth } = useContext(AuthContext);
	const navigate = useNavigate();

	// redirect if already logged in
	useEffect(() => {
		if (auth?.token) {
			navigate('/dashboard', { replace: true });
		}
	}, [auth, navigate]);

	// handle form change
	const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

	// handle submit
	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			const res = await API.post('/auth/sign-up', form);
			const { token, user } = res.data;

			if (!token || !user) throw new Error('Invalid response from API');
			signin(token, user);

			navigate('/dashboard', { replace: true });
		} catch (err) {
			toast.error('Signup failed: ' + (err.response?.data?.message || err.message));
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="mx-auto  w-[400px] space-y-6 flex items-center justify-center min-h-screen flex-col"
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
				<button className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded transition">
					Sign Up
				</button>

				<div className="text-center text-sm">
					Already have an account?{' '}
					<Link to="/sign-in" className="text-blue-600 hover:underline">
						Sign In
					</Link>
				</div>
			</div>
		</form>
	);
}

export default SignUp;

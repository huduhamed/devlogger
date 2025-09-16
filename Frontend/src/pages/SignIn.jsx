import { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
// internal imoports
import API from '../services/api';
import AuthContext from '../context/AuthContext';

// sign-in logic
function SignIn() {
	const [form, setForm] = useState({ email: '', password: '' });
	const navigate = useNavigate();

	const { signin } = useContext(AuthContext);

	// handle chnGE
	const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

	// handle submit
	const handleSubmit = async (e) => {
		e.preventDefault();

		try {
			const res = await API.post('/auth/sign-in', form);

			const { token, user } = res.data;
			if (!token || !user) throw new Error('Invalid response from API');

			// save user & token into context & localstaorage
			signin(token, user);

			// redirect user to dashboard
			navigate('/dashboard', { replace: true });
		} catch (error) {
			toast.error('Signin failed: ' + (error.response?.data?.message || error.message));
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="w-full max-w-sm mx-auto space-y-6 flex flex-col items-center justify-center min-h-screen"
		>
			<h3 className="text-center text-blue-500 text-xl font-semibold">Sign-in to Dashboard</h3>

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

			<div className="text-center text-sm">
				Don’t have an account?{' '}
				<Link to="/sign-up" className="text-blue-600 hover:underline">
					Sign up
				</Link>
			</div>
		</form>
	);
}

export default SignIn;

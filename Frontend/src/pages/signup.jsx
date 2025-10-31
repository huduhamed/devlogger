import { useContext, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

//internal imports
import API from '../services/api';
import AuthContext from '../context/AuthContext';
import Card, { CardBody, CardHeader } from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import GoogleIcon from '../components/ui/GoogleIcon.jsx';

// sign-up
function SignUp() {
	const [form, setForm] = useState({ name: '', email: '', password: '' });
	const { signin, auth } = useContext(AuthContext);
	const navigate = useNavigate();

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

	// Google sign-Up handler
	const [loading, setLoading] = useState(false);

	const handleGoogleSignUp = () => {
		setLoading(true);
		const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

		if (!window.google || !clientId) {
			toast.error('Google API or Client ID not available');
			setLoading(false);
			return;
		}

		window.google.accounts.id.initialize({
			client_id: clientId,
			callback: async (response) => {
				if (!response.credential) {
					toast.error('Google Sign-Up failed: No credential');
					setLoading(false);
					return;
				}
				try {
					const res = await API.post('/auth/google', { idToken: response.credential });
					const { token, user } = res.data;
					if (!token || !user) throw new Error('Invalid response from API');
					signin(token, user);
					navigate('/dashboard', { replace: true });
				} catch (error) {
					toast.error('Google Sign-Up failed: ' + (error.response?.data?.message || error.message));
				} finally {
					setLoading(false);
				}
			},
		});
		window.google.accounts.id.prompt();
	};

	return (
		<div className="min-h-[80vh] flex items-center justify-center px-4">
			<Card className="w-full max-w-md">
				<CardHeader title="Create your account" subtitle="Start logging and monitoring events" />
				<CardBody>
					<form onSubmit={handleSubmit} className="space-y-4">
						<Input
							name="name"
							onChange={handleChange}
							placeholder="Jane Doe"
							label="Full name"
							required
						/>
						<Input
							name="email"
							type="email"
							onChange={handleChange}
							placeholder="you@example.com"
							label="Email"
							required
						/>
						<Input
							name="password"
							type="password"
							onChange={handleChange}
							placeholder="••••••••"
							label="Password"
							required
						/>
						<Button type="submit" className="w-full">
							Sign Up
						</Button>
					</form>
					<div className="flex items-center my-4">
						<div className="flex-grow border-t border-gray-200 dark:border-gray-700" />
						<span className="mx-2 text-xs text-gray-500">or</span>
						<div className="flex-grow border-t border-gray-200 dark:border-gray-700" />
					</div>
					<Button
						className="w-full flex items-center justify-center gap-2"
						type="button"
						variant="outline"
						onClick={handleGoogleSignUp}
						loading={loading}
					>
						<GoogleIcon className="w-5 h-5" /> Sign up with Google
					</Button>
					<div className="text-center text-sm mt-4">
						Already have an account?{' '}
						<Link to="/sign-in" className="text-blue-600 hover:underline">
							Sign In
						</Link>
					</div>
				</CardBody>
			</Card>
		</div>
	);
}

export default SignUp;

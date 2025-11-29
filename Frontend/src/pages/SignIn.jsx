import { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

// internal imoports
import API from '../services/api';
import AuthContext from '../context/AuthContext';
import Card, { CardBody, CardHeader } from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import GoogleAuthButton from '../components/Auth.jsx';

// sign-in logic
function SignIn() {
	const [form, setForm] = useState({ email: '', password: '' });
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const { auth, signin } = useContext(AuthContext);

	// redirect if already logged in
	if (auth?.token && auth?.user) {
		navigate('/dashboard', { replace: true });
		return null;
	}

	// handle change
	const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

	// handle submit
	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);

		try {
			const res = await API.post('/auth/sign-in', form);
			const { token, user } = res.data;
			if (!token || !user) throw new Error('Invalid response from API');
			signin(token, user);
			navigate('/dashboard', { replace: true });
		} catch (error) {
			toast.error('Signin failed: ' + (error.response?.data?.message || error.message));
		} finally {
			setLoading(false);
		}
	};

	// Google sign-in handled by `GoogleAuthButton` (react-google-login)
	const handleGoogleSuccess = async (googleData) => {
		setLoading(true);
		try {
			// react-google-login returns an id_token in `tokenId`
			const idToken = googleData.tokenId;
			if (!idToken) throw new Error('No token received from Google');
			const res = await API.post('/auth/google', { idToken });
			const { token, user } = res.data;
			if (!token || !user) throw new Error('Invalid response from API');
			signin(token, user);
			navigate('/dashboard', { replace: true });
		} catch (error) {
			toast.error('Google Sign-In failed: ' + (error.response?.data?.message || error.message));
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleFailure = (error) => {
		toast.error('Google Sign-In failed');
	};

	return (
		<div className="min-h-[80vh] flex items-center justify-center px-4">
			<Card className="w-full max-w-md">
				<CardHeader title="Welcome back" subtitle="Sign in to access your DevLogger dashboard" />
				<CardBody>
					<form onSubmit={handleSubmit} className="space-y-4">
						<Input
							type="email"
							name="email"
							value={form.email}
							onChange={handleChange}
							placeholder="you@example.com"
							label="Email"
							autoComplete="email"
							required
						/>
						<Input
							type="password"
							name="password"
							value={form.password}
							onChange={handleChange}
							placeholder="••••••••"
							label="Password"
							autoComplete="current-password"
							required
						/>
						<Button className="w-full" type="submit" variant="primary" loading={loading}>
							Sign In
						</Button>
					</form>
					<div className="flex items-center my-4">
						<div className="flex-grow border-t border-gray-200 dark:border-gray-700" />
						<span className="mx-2 text-xs text-gray-500">or</span>
						<div className="flex-grow border-t border-gray-200 dark:border-gray-700" />
					</div>
					<GoogleAuthButton
						onSuccess={handleGoogleSuccess}
						onFailure={handleGoogleFailure}
						loading={loading}
					/>
					<div className="text-center text-sm mt-4">
						Don’t have an account?{' '}
						<Link to="/sign-up" className="text-blue-600 hover:underline">
							Sign up
						</Link>
					</div>
				</CardBody>
			</Card>
		</div>
	);
}

export default SignIn;

import { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
// internal imoports
import API from '../services/api';
import AuthContext from '../context/AuthContext';
import Card, { CardBody, CardHeader } from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import GoogleIcon from '../components/ui/GoogleIcon.jsx';

// sign-in logic
function SignIn() {
	const [form, setForm] = useState({ email: '', password: '' });
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const { signin } = useContext(AuthContext);

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

	// Google Sign-In handler
	const handleGoogleSignIn = async () => {
		setLoading(true);
		try {
			// Use Google Identity Services (popup)
			if (!window.google) {
				toast.error('Google API not loaded');
				setLoading(false);
				return;
			}
			const client = window.google.accounts.id;
			client.prompt((notification) => {
				if (notification.isNotDisplayed()) {
					toast.error('Google Sign-In not available');
					setLoading(false);
				}
			});
		} catch (error) {
			toast.error('Google Sign-In failed: ' + error.message);
			setLoading(false);
		}
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
					<Button
						className="w-full flex items-center justify-center gap-2"
						type="button"
						variant="outline"
						onClick={handleGoogleSignIn}
						loading={loading}
					>
						<GoogleIcon className="w-5 h-5" /> Sign in with Google
					</Button>
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

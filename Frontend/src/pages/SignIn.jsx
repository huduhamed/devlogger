import { useContext, useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// internal imoports
import API from '../services/api';
import AuthContext from '../context/AuthContext';
import Card, { CardBody, CardHeader } from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import GoogleAuthButton from '../components/Auth.jsx';
import { getFieldError } from '../utils/validation.js';

// sign-in logic
function SignIn() {
	const [form, setForm] = useState({ email: '', password: '' });
	const [errors, setErrors] = useState({ email: null, password: null });
	const [touched, setTouched] = useState({ email: false, password: false });
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const navigate = useNavigate();
	const { auth, signin } = useContext(AuthContext);

	// redirect if already logged in
	if (auth?.token && auth?.user) {
		return <Navigate to="/dashboard" replace />;
	}

	// handle change
	const handleChange = (e) => {
		const { name, value } = e.target;
		setForm({ ...form, [name]: value });

		// Live-validate only after field was touched.
		if (touched[name]) {
			const error = getFieldError(name, value);
			setErrors({ ...errors, [name]: error });
		}
	};

	const handleBlur = (e) => {
		const { name, value } = e.target;
		const normalizedValue = name === 'email' ? value.trim().toLowerCase() : value;
		setForm((prev) => ({ ...prev, [name]: normalizedValue }));
		setTouched((prev) => ({ ...prev, [name]: true }));
		setErrors((prev) => ({ ...prev, [name]: getFieldError(name, normalizedValue) }));
	};

	// handle submit
	const handleSubmit = async (e) => {
		e.preventDefault();
		setTouched({ email: true, password: true });

		const normalizedForm = {
			...form,
			email: form.email.trim().toLowerCase(),
		};

		// validate all fields before submit
		const emailError = getFieldError('email', normalizedForm.email);
		const passwordError = getFieldError('password', normalizedForm.password);

		if (emailError || passwordError) {
			setErrors({ email: emailError, password: passwordError });
			return;
		}

		setLoading(true);

		try {
			const res = await API.post('/auth/sign-in', normalizedForm);
			const { token, user } = res.data;
			if (!token || !user) throw new Error('An error occured, please try again.');
			signin(token, user);
			navigate('/dashboard', { replace: true });
		} catch (error) {
			toast.error(
				error.response?.data?.message || 'Sign-in failed. Please check your details and try again.',
			);
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
			if (!idToken) throw new Error('An error occured, please try again.');
			const res = await API.post('/auth/google', { idToken });
			const { token, user } = res.data;
			if (!token || !user) throw new Error('An error occured, please try again.');
			signin(token, user);
			navigate('/dashboard', { replace: true });
		} catch (error) {
			toast.error(error.response?.data?.message || 'An error occured, please try again.');
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleFailure = () => {
		toast.error('An error occured, please try again.');
	};

	// pass visibility
	const togglePasswordVisibility = () => {
		setShowPassword((prev) => !prev);
	};

	const passwordToggleButton = (
		<button
			type="button"
			onClick={togglePasswordVisibility}
			className="rounded p-1 text-slate-500 hover:text-slate-700 dark:text-gray-300 dark:hover:text-white"
			aria-label={showPassword ? 'Hide password' : 'Show password'}
			title={showPassword ? 'Hide password' : 'Show password'}
		>
			{showPassword ? (
				<svg
					viewBox="0 0 24 24"
					className="h-5 w-5"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
				>
					<path d="M3 3l18 18" />
					<path d="M10.6 10.6A3 3 0 0013.4 13.4" />
					<path d="M9.9 5.1A10.2 10.2 0 0112 4c5 0 9.3 3.1 11 8-0.6 1.8-1.6 3.3-2.9 4.5" />
					<path d="M6.6 6.6C4.9 7.8 3.5 9.7 3 12c1.7 4.9 6 8 11 8a10.5 10.5 0 003.1-.5" />
				</svg>
			) : (
				<svg
					viewBox="0 0 24 24"
					className="h-5 w-5"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
				>
					<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
					<circle cx="12" cy="12" r="3" />
				</svg>
			)}
		</button>
	);

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
							onBlur={handleBlur}
							placeholder="you@example.com"
							label="Email"
							autoComplete="email"
							error={errors.email}
							required
						/>
						<Input
							type={showPassword ? 'text' : 'password'}
							name="password"
							value={form.password}
							onChange={handleChange}
							onBlur={handleBlur}
							placeholder="••••••••"
							label="Password"
							autoComplete="current-password"
							rightAdornment={passwordToggleButton}
							error={errors.password}
							required
						/>
						<Button
							className="w-full"
							type="submit"
							variant="primary"
							loading={loading}
							disabled={errors.email || errors.password}
						>
							Sign In
						</Button>
						<div className="text-right">
							<Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
								Forgot password?
							</Link>
						</div>
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

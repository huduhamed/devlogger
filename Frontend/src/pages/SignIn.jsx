import { useContext, useState, useEffect } from 'react';
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
import { setPageMeta } from '../utils/seo.js';

// sign-in logic
function SignIn() {
	const [form, setForm] = useState({ email: '', password: '' });
	const [errors, setErrors] = useState({ email: null, password: null });
	const [touched, setTouched] = useState({ email: false, password: false });
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const navigate = useNavigate();
	const { auth, signin } = useContext(AuthContext);

	// Set SEO on mount
	useEffect(() => {
		setPageMeta(
			'Sign In',
			'Sign in to your Devlogger account and start tracking, sharing, and learning from team events.',
			'https://devlogger.io/sign-in',
		);
	}, []);

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

	const trustPoints = [
		'Secure team access with one sign-in flow',
		'Fast access to logs, timelines and org context',
		'Real-time collaboration without extra setup',
	];

	return (
		<div className="relative isolate overflow-hidden">
			<div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.14),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.08),_transparent_28%),linear-gradient(to_bottom,_rgba(248,250,252,0.96),_rgba(241,245,249,0.9))] dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(148,163,184,0.12),_transparent_28%),linear-gradient(to_bottom,_rgba(3,7,18,0.96),_rgba(15,23,42,0.98))]" />
			<div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
				<div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
					<div className="flex flex-col justify-center">
						<div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200/80 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-blue-700 shadow-sm backdrop-blur dark:border-blue-400/20 dark:bg-slate-900/70 dark:text-blue-200">
							<span className="h-2 w-2 rounded-full bg-blue-600" />
							Secure access
						</div>
						<h1 className="mt-5 max-w-2xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
							Welcome back to the operational timeline.
						</h1>
						<p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl dark:text-slate-300">
							Sign in to Devlogger to review recent events, coordinate with your team and move from
							signal to action without losing context.
						</p>

						<div className="mt-8 grid gap-3 sm:grid-cols-3 lg:max-w-3xl">
							{trustPoints.map((point) => (
								<div
									key={point}
									className="rounded-2xl border border-white/70 bg-white/75 p-4 text-sm leading-6 text-slate-700 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300"
								>
									{point}
								</div>
							))}
						</div>
					</div>

					<Card className="w-full border-white/70 bg-white/85 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
						<CardHeader
							title="Sign in"
							subtitle="Access your dashboard, logs and organization resource"
							className="border-slate-200/80 dark:border-slate-800"
						/>
						<CardBody className="p-6 sm:p-8">
							<form onSubmit={handleSubmit} className="space-y-4">
								<Input
									type="email"
									name="email"
									value={form.email}
									onChange={handleChange}
									onBlur={handleBlur}
									placeholder="email@example.com"
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
								<div className="flex items-center justify-between gap-3">
									<label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
										<input
											type="checkbox"
											className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700"
										/>
										Remember this device
									</label>
									<Link
										to="/forgot-password"
										className="text-sm font-medium text-blue-700 hover:underline dark:text-blue-300"
									>
										Forgot password?
									</Link>
								</div>
								<Button
									className="w-full rounded-full py-3 text-base font-semibold"
									type="submit"
									variant="primary"
									loading={loading}
									disabled={errors.email || errors.password}
								>
									Sign in
								</Button>
							</form>

							<div className="my-6 flex items-center gap-3">
								<div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
								<span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
									Or continue with
								</span>
								<div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
							</div>

							<GoogleAuthButton
								onSuccess={handleGoogleSuccess}
								onFailure={handleGoogleFailure}
								loading={loading}
							/>

							<div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
								Don’t have an account?{' '}
								<Link
									to="/sign-up"
									className="font-semibold text-blue-700 hover:underline dark:text-blue-300"
								>
									Create one now
								</Link>
							</div>
						</CardBody>
					</Card>
				</div>
			</div>
		</div>
	);
}

export default SignIn;

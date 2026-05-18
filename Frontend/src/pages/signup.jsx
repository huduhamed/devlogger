import { useContext, useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

//internal imports
import API from '../services/api';
import AuthContext from '../context/AuthContext';
import Card, { CardBody, CardHeader } from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import GoogleAuthButton from '../components/Auth.jsx';
import { getFieldError } from '../utils/validation.js';
import { setPageMeta } from '../utils/seo.js';

// sign-up
function SignUp() {
	const [form, setForm] = useState({ name: '', email: '', password: '' });
	const [errors, setErrors] = useState({ name: null, email: null, password: null });
	const [touched, setTouched] = useState({ name: false, email: false, password: false });
	const [invite, setInvite] = useState(null);
	const [inviteLoading, setInviteLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [googleLoading, setGoogleLoading] = useState(false);
	const { signin, auth } = useContext(AuthContext);
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const inviteToken = searchParams.get('inviteToken') || '';
	const inviteEmail = searchParams.get('email') || '';

	useEffect(() => {
		// Set SEO on mount
		setPageMeta(
			'Sign Up',
			'Create your free Devlogger account. Start logging events and collaborating with your team today.',
			'https://devlogger.io/sign-up',
		);
	}, []);

	useEffect(() => {
		if (auth?.token) {
			navigate('/dashboard', { replace: true });
		}
	}, [auth, navigate]);

	useEffect(() => {
		let ignore = false;

		if (inviteEmail) {
			setForm((prev) => ({ ...prev, email: inviteEmail }));
		}

		if (!inviteToken) {
			setInvite(null);
			return () => {
				ignore = true;
			};
		}

		(async () => {
			setInviteLoading(true);
			try {
				const res = await API.get(`/auth/invitations/${encodeURIComponent(inviteToken)}`);
				if (ignore) return;
				const inviteData = res.data?.data || null;
				setInvite(inviteData);
				if (inviteData?.email) {
					setForm((prev) => ({ ...prev, email: inviteData.email }));
				}
			} catch (err) {
				if (ignore) return;
				setInvite(null);
				toast.error(
					err.response?.data?.message || 'This invitation link is invalid or has expired.',
				);
			} finally {
				if (!ignore) setInviteLoading(false);
			}
		})();

		return () => {
			ignore = true;
		};
	}, [inviteEmail, inviteToken]);

	// handle form change
	const handleChange = (e) => {
		const { name, value } = e.target;
		let nextValue = value;

		if (name === 'name') {
			nextValue = value.replace(/[^a-zA-Z\s\-']/g, '');
			if (value !== nextValue) {
				setErrors((prev) => ({
					...prev,
					name: 'Name can only contain letters, spaces, hyphens, and apostrophes',
				}));
			}
		}

		setForm({ ...form, [name]: nextValue });

		// Live-validate only after field was touched.
		if (touched[name]) {
			const error = getFieldError(name, nextValue);
			setErrors({ ...errors, [name]: error });
		}
	};

	const handleBlur = (e) => {
		const { name, value } = e.target;
		let normalizedValue = value;
		if (name === 'name') normalizedValue = value.trim();
		if (name === 'email') normalizedValue = value.trim().toLowerCase();
		setForm((prev) => ({ ...prev, [name]: normalizedValue }));
		setTouched((prev) => ({ ...prev, [name]: true }));
		setErrors((prev) => ({ ...prev, [name]: getFieldError(name, normalizedValue) }));
	};

	// handle submit
	const handleSubmit = async (e) => {
		e.preventDefault();
		setTouched({ name: true, email: true, password: true });

		const normalizedForm = {
			...form,
			name: form.name.trim(),
			email: form.email.trim().toLowerCase(),
		};

		// validate all fields before submit
		const nameError = getFieldError('name', normalizedForm.name);
		const emailError = getFieldError('email', normalizedForm.email);
		const passwordError = getFieldError('password', normalizedForm.password);

		if (nameError || emailError || passwordError) {
			setErrors({ name: nameError, email: emailError, password: passwordError });
			return;
		}

		if (inviteToken && !invite) {
			toast.error('This invitation link is invalid or has expired.');
			return;
		}

		setSubmitting(true);

		try {
			const payload = inviteToken && invite ? { ...normalizedForm, inviteToken } : normalizedForm;
			const res = await API.post('/auth/sign-up', payload);
			const { token, user } = res.data;

			if (!token || !user)
				throw new Error(
					'Sorry, We could not create your account right now, please try again later.',
				);
			signin(token, user);

			navigate('/dashboard', { replace: true });
		} catch (err) {
			toast.error(
				err.response?.data?.message || 'Sign-up failed. Please review your details and try again.',
			);
		} finally {
			setSubmitting(false);
		}
	};

	// Google sign-Up handler
	const handleGoogleSuccess = async (googleData) => {
		setGoogleLoading(true);
		try {
			if (inviteToken && !invite)
				throw new Error('This invitation link is invalid or has expired.');
			const idToken = googleData.tokenId;
			if (!idToken) throw new Error('Google sign-up error, please try again.');
			const payload = inviteToken && invite ? { idToken, inviteToken } : { idToken };
			const res = await API.post('/auth/google', payload);
			const { token, user } = res.data;
			if (!token || !user)
				throw new Error('Sorry, We could not complete Google sign-up right now.');
			signin(token, user);
			navigate('/dashboard', { replace: true });
		} catch (error) {
			toast.error(error.response?.data?.message || 'Google sign-up failed. Please try again.');
		} finally {
			setGoogleLoading(false);
		}
	};

	const handleGoogleFailure = () => {
		toast.error('Google sign-up was not completed, please try again.');
	};

	// password visibility
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
		<div className="relative isolate overflow-hidden">
			<div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.14),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.08),_transparent_28%),linear-gradient(to_bottom,_rgba(248,250,252,0.96),_rgba(241,245,249,0.9))] dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(148,163,184,0.12),_transparent_28%),linear-gradient(to_bottom,_rgba(3,7,18,0.96),_rgba(15,23,42,0.98))]" />
			<div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
				<div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
					<div className="flex flex-col justify-center">
						<div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200/80 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-blue-700 shadow-sm backdrop-blur dark:border-blue-400/20 dark:bg-slate-900/70 dark:text-blue-200">
							<span className="h-2 w-2 rounded-full bg-blue-600" />
							Create your workspace
						</div>
						<h1 className="mt-5 max-w-2xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
							Start a shared timeline for your team
						</h1>
						<p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl dark:text-slate-300">
							Create a Devlogger account to capture context, invite teammates and build a reliable
							operational history from day one.
						</p>

						<div className="mt-8 grid gap-3 sm:grid-cols-3 lg:max-w-3xl">
							{[
								'Structure events from the start',
								'Invite teammates instantly',
								'Keep history and decisions together',
							].map((point) => (
								<div
									key={point}
									className="rounded-2xl border border-white/70 bg-white/75 p-4 text-sm leading-6 text-slate-700 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300"
								>
									{point}
								</div>
							))}
						</div>
						<div className="mt-8 rounded-3xl border border-white/70 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
							<div className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
								What you get
							</div>
							<ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
								<li>• Team-wide logging with clear ownership.</li>
								<li>• Invitation-aware onboarding for organizations.</li>
								<li>• A timeline that keeps context attached to action.</li>
							</ul>
						</div>
					</div>

					<Card className="w-full border-white/70 bg-white/85 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
						<CardHeader
							title={invite ? `Join ${invite.organization?.name}` : 'Create your account'}
							subtitle={
								invite
									? `You've been invited${invite.inviter?.name ? ` by ${invite.inviter.name}` : ''}.`
									: 'Start logging and collaborating in minutes'
							}
							className="border-slate-200/80 dark:border-slate-800"
						/>
						<CardBody className="p-6 sm:p-8">
							{inviteLoading && (
								<div className="mb-4 text-sm text-slate-500 dark:text-slate-400">
									Loading invitation...
								</div>
							)}
							{invite && (
								<div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-100">
									You’re accepting an invitation to join{' '}
									<strong>{invite.organization?.name}.</strong>
								</div>
							)}
							<form onSubmit={handleSubmit} className="space-y-4">
								<Input
									name="name"
									value={form.name}
									onChange={handleChange}
									onBlur={handleBlur}
									placeholder="John Doe"
									label="Full name"
									error={errors.name}
									required
								/>
								<Input
									name="email"
									type="email"
									value={form.email}
									onChange={handleChange}
									onBlur={handleBlur}
									placeholder="email@example.com"
									label="Email"
									disabled={Boolean(invite?.email)}
									error={errors.email}
									required
								/>
								<Input
									name="password"
									type={showPassword ? 'text' : 'password'}
									value={form.password}
									onChange={handleChange}
									onBlur={handleBlur}
									placeholder="••••••••"
									label="Password"
									rightAdornment={passwordToggleButton}
									error={errors.password}
									required
								/>
								<Button
									type="submit"
									className="w-full rounded-full py-3 text-base font-semibold"
									loading={submitting || inviteLoading}
									disabled={errors.name || errors.email || errors.password}
								>
									Create account
								</Button>
							</form>

							<div className="my-6 flex items-center gap-3">
								<div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
								<span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
									Or use Google
								</span>
								<div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
							</div>

							<div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
								<GoogleAuthButton
									onSuccess={handleGoogleSuccess}
									onFailure={handleGoogleFailure}
									loading={googleLoading || inviteLoading}
								/>
							</div>

							<div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
								Already have an account?{' '}
								<Link
									to="/sign-in"
									className="font-semibold text-blue-700 hover:underline dark:text-blue-300"
								>
									Sign in
								</Link>
							</div>
						</CardBody>
					</Card>
				</div>
			</div>
		</div>
	);
}

export default SignUp;

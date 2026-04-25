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

// sign-up
function SignUp() {
	const [form, setForm] = useState({ name: '', email: '', password: '' });
	const [errors, setErrors] = useState({ name: null, email: null, password: null });
	const [touched, setTouched] = useState({ name: false, email: false, password: false });
	const [invite, setInvite] = useState(null);
	const [inviteLoading, setInviteLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const { signin, auth } = useContext(AuthContext);
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const inviteToken = searchParams.get('inviteToken') || '';
	const inviteEmail = searchParams.get('email') || '';

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
		}
	};

	// Google sign-Up handler
	const [loading, setLoading] = useState(false);

	const handleGoogleSuccess = async (googleData) => {
		setLoading(true);
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
			setLoading(false);
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
		<div className="min-h-[80vh] flex items-center justify-center px-4">
			<Card className="w-full max-w-md">
				<CardHeader
					title={invite ? `Join ${invite.organization?.name}` : 'Create your account'}
					subtitle={
						invite
							? `You've been invited${invite.inviter?.name ? ` by ${invite.inviter.name}` : ''}.`
							: 'Start logging and monitoring events'
					}
				/>
				<CardBody>
					{inviteLoading && <div className="mb-4 text-sm text-gray-500">Loading invitation...</div>}
					{invite && (
						<div className="mb-4 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
							You’re accepting an invitation to join <strong>{invite.organization?.name}.</strong>
						</div>
					)}
					<form onSubmit={handleSubmit} className="space-y-4">
						<Input
							name="name"
							value={form.name}
							onChange={handleChange}
							onBlur={handleBlur}
							placeholder="Jane Doe"
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
							placeholder="you@example.com"
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
							className="w-full"
							loading={inviteLoading}
							disabled={errors.name || errors.email || errors.password}
						>
							Sign Up
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
						loading={loading || inviteLoading}
					/>
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

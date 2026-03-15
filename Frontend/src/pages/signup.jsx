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

// sign-up
function SignUp() {
	const [form, setForm] = useState({ name: '', email: '', password: '' });
	const [invite, setInvite] = useState(null);
	const [inviteLoading, setInviteLoading] = useState(false);
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
				toast.error(err.response?.data?.message || 'Invitation is invalid or expired');
			} finally {
				if (!ignore) setInviteLoading(false);
			}
		})();

		return () => {
			ignore = true;
		};
	}, [inviteEmail, inviteToken]);

	// handle form change
	const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

	// handle submit
	const handleSubmit = async (e) => {
		e.preventDefault();
		if (inviteToken && !invite) {
			toast.error('This invitation is invalid or has expired.');
			return;
		}

		try {
			const payload = inviteToken && invite ? { ...form, inviteToken } : form;
			const res = await API.post('/auth/sign-up', payload);
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

	const handleGoogleSuccess = async (googleData) => {
		setLoading(true);
		try {
			if (inviteToken && !invite) throw new Error('This invitation is invalid or has expired.');
			const idToken = googleData.tokenId;
			if (!idToken) throw new Error('No token received from Google');
			const payload = inviteToken && invite ? { idToken, inviteToken } : { idToken };
			const res = await API.post('/auth/google', payload);
			const { token, user } = res.data;
			if (!token || !user) throw new Error('Invalid response from API');
			signin(token, user);
			navigate('/dashboard', { replace: true });
		} catch (error) {
			toast.error('Google Sign-Up failed: ' + (error.response?.data?.message || error.message));
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleFailure = () => {
		toast.error('Google Sign-Up failed');
	};

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
							You’re accepting an invitation to join <strong>{invite.organization?.name}</strong>
							as <strong>{invite.role}</strong>.
						</div>
					)}
					<form onSubmit={handleSubmit} className="space-y-4">
						<Input
							name="name"
							value={form.name}
							onChange={handleChange}
							placeholder="Jane Doe"
							label="Full name"
							required
						/>
						<Input
							name="email"
							type="email"
							value={form.email}
							onChange={handleChange}
							placeholder="you@example.com"
							label="Email"
							disabled={Boolean(invite?.email)}
							required
						/>
						<Input
							name="password"
							type="password"
							value={form.password}
							onChange={handleChange}
							placeholder="••••••••"
							label="Password"
							required
						/>
						<Button type="submit" className="w-full" loading={inviteLoading}>
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

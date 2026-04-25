import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link, useSearchParams, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// internal imports
import API from '../services/api';
import AuthContext from '../context/AuthContext';
import Card, { CardBody, CardHeader } from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';

// reset password
function ResetPassword() {
	const [form, setForm] = useState({ password: '', confirmPassword: '' });
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [success, setSuccess] = useState(false);
	const navigate = useNavigate();
	const { auth } = useContext(AuthContext);
	const [searchParams] = useSearchParams();
	const token = searchParams.get('token');
	const email = searchParams.get('email');
	const isAuthenticated = Boolean(auth?.token && auth?.user);

	// validate URL params on mount
	useEffect(() => {
		if (!token || !email) {
			toast.error('This reset link is invalid. Please request a new one.');
			navigate('/forgot-password', { replace: true });
		}
	}, [token, email, navigate]);

	const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

	const togglePasswordVisibility = () => {
		setShowPassword((prev) => !prev);
	};

	const toggleConfirmPasswordVisibility = () => {
		setShowConfirmPassword((prev) => !prev);
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

	const confirmPasswordToggleButton = (
		<button
			type="button"
			onClick={toggleConfirmPasswordVisibility}
			className="rounded p-1 text-slate-500 hover:text-slate-700 dark:text-gray-300 dark:hover:text-white"
			aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
			title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
		>
			{showConfirmPassword ? (
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

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!form.password || !form.confirmPassword) {
			toast.error('Please enter your new password and confirm it.');
			return;
		}

		if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(form.password)) {
			toast.error(
				'Password must be at least 8 characters and include at least one letter and one number.',
			);
			return;
		}

		if (form.password !== form.confirmPassword) {
			toast.error('Those passwords do not match. Please try again.');
			return;
		}

		setLoading(true);

		try {
			const res = await API.post('/auth/reset-password', {
				token,
				email,
				newPassword: form.password,
			});
			toast.success(res.data?.message || 'Your password has been reset successfully.');
			setSuccess(true);
		} catch (error) {
			toast.error(
				error.response?.data?.message ||
					'An error occured. Please request a new link and try again.',
			);
		} finally {
			setLoading(false);
		}
	};

	if (isAuthenticated) {
		return <Navigate to="/dashboard" replace />;
	}

	return (
		<div className="min-h-[80vh] flex items-center justify-center px-4">
			<Card className="w-full max-w-md">
				<CardHeader title="Set new password" subtitle="Enter your new password below" />
				<CardBody>
					{success ? (
						<div className="text-center space-y-4">
							<div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900">
								<p className="font-medium">Password reset successful!</p>
								<p className="text-green-800 mt-1">You can now sign in with your new password.</p>
							</div>
							<div className="text-center text-sm mt-4">
								<Link to="/sign-in" className="inline-block text-blue-600 hover:underline">
									Go to sign in
								</Link>
							</div>
						</div>
					) : (
						<form onSubmit={handleSubmit} className="space-y-4">
							<Input
								name="password"
								type={showPassword ? 'text' : 'password'}
								value={form.password}
								onChange={handleChange}
								placeholder="••••••••"
								label="New password"
								rightAdornment={passwordToggleButton}
								required
							/>
							<Input
								name="confirmPassword"
								type={showConfirmPassword ? 'text' : 'password'}
								value={form.confirmPassword}
								onChange={handleChange}
								placeholder="••••••••"
								label="Confirm password"
								rightAdornment={confirmPasswordToggleButton}
								required
							/>
							<Button className="w-full" type="submit" variant="primary" loading={loading}>
								Reset password
							</Button>
							<div className="text-center text-sm">
								<Link to="/sign-in" className="text-blue-600 hover:underline">
									Back to sign in
								</Link>
							</div>
						</form>
					)}
				</CardBody>
			</Card>
		</div>
	);
}

export default ResetPassword;

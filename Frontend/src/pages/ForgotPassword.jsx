import { useState, useContext } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// internal imports
import API from '../services/api';
import AuthContext from '../context/AuthContext';
import Card, { CardBody, CardHeader } from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';

// forgot password
function ForgotPassword() {
	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const { auth } = useContext(AuthContext);

	// redirect if already logged in
	if (auth?.token && auth?.user) {
		return <Navigate to="/dashboard" replace />;
	}

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!email) {
			toast.error('Please enter your email address');
			return;
		}

		setLoading(true);

		try {
			const res = await API.post('/auth/forgot-password', { email });
			toast.success(res.data?.message || 'Check your inbox, we sent a reset link.');
			setSubmitted(true);
		} catch (error) {
			toast.error(error.response?.data?.message || 'An error occured, please try again.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-[80vh] flex items-center justify-center px-4">
			<Card className="w-full max-w-md">
				<CardHeader
					title="Reset your password"
					subtitle="Enter your email address to receive a reset link"
				/>
				<CardBody>
					{submitted ? (
						<div className="text-center space-y-4">
							<div
								role="status"
								aria-live="polite"
								className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900"
							>
								<p className="font-medium mb-2">Check your email</p>
								<p className="text-green-800">
									If an account exists with that email, you'll receive a password reset link
									shortly. The link will expire in 1 hour.
								</p>
							</div>
							<div className="text-center text-sm mt-4 space-y-2">
								<p className="text-gray-600">
									<Link to="/sign-in" className="text-blue-600 hover:underline">
										Back to sign in
									</Link>
								</p>
								<p className="text-gray-600 text-xs">
									Didn't receive the email? Check your spam folder or{' '}
									<button
										type="button"
										onClick={() => setSubmitted(false)}
										className="text-blue-600 hover:underline"
									>
										try again
									</button>
									.
								</p>
							</div>
						</div>
					) : (
						<form onSubmit={handleSubmit} className="space-y-4">
							<Input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="you@example.com"
								label="Email address"
								autoComplete="email"
								required
							/>
							<Button className="w-full" type="submit" variant="primary" loading={loading}>
								Send reset link
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

export default ForgotPassword;

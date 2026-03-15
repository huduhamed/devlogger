import { useEffect, useState, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

// internal imports
import API from '../services/api';
import Card, { CardBody, CardHeader } from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import OrgContext from '../context/OrgContext.jsx';
import AuthContext from '../context/AuthContext.jsx';

export default function CheckoutSuccess() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const [loading, setLoading] = useState(true);
	const [status, setStatus] = useState('processing');
	const [error, setError] = useState(null);
	const { refresh: refreshOrg } = useContext(OrgContext);
	const { auth } = useContext(AuthContext);

	const sessionId = searchParams.get('session_id');
	const firstName = auth?.user?.name?.trim()?.split(/\s+/)?.[0] || 'there';

	useEffect(() => {
		if (!sessionId) {
			setStatus('error');
			setError('No session ID found');
			setLoading(false);
			return;
		}

		const verifySession = async () => {
			try {
				// verify the checkout session with Stripe
				const res = await API.post('/billing/verify-session', { sessionId });

				if (res.data?.success) {
					setStatus('success');
					// refresh organization context to get updated billing info
					refreshOrg?.();
				} else {
					setStatus('pending');
				}
			} catch (err) {
				setStatus('error');
				setError(err?.response?.data?.message || 'Failed to verify session');
				toast.error('Failed to verify checkout session');
			} finally {
				setLoading(false);
			}
		};

		verifySession();
	}, [sessionId, refreshOrg]);

	if (loading) {
		return (
			<div className="max-w-2xl mx-auto flex items-center justify-center min-h-96">
				<Spinner />
			</div>
		);
	}

	return (
		<div className="max-w-2xl mx-auto">
			{status === 'success' && (
				<Card className="overflow-hidden border-blue-200 dark:border-blue-900/70 shadow-lg">
					<div className="border-b border-blue-200 bg-blue-50 px-6 py-8 text-blue-950 dark:border-blue-900/70 dark:bg-blue-950/40 dark:text-blue-50">
						<p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-200/85">
							Subscription Confirmed
						</p>
						<h1 className="mt-2 text-3xl font-bold leading-tight">Thank you {firstName}.</h1>
						<p className="mt-3 max-w-xl text-sm text-blue-900/80 dark:text-blue-100/85 sm:text-base">
							We appreciate your subscription and the trust you are placing in our products. Your
							plan is active now and we are glad to have you onboard with us.
						</p>
					</div>
					<CardBody className="space-y-6 px-6 py-6">
						<div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-800 dark:border-gray-800 dark:bg-gray-900/70 dark:text-gray-100">
							<p className="font-semibold">What happens next!</p>
							<p className="mt-1">
								Your organization settings will reflect the active plan and you can manage billing
								at any time from your organization page.
							</p>
						</div>
						<div className="flex flex-col gap-3 sm:flex-row">
							<Button onClick={() => navigate('/organization')} variant="primary">
								Go to Organization Settings
							</Button>
							<Button onClick={() => navigate('/dashboard')} variant="outline">
								Open Dashboard
							</Button>
						</div>
					</CardBody>
				</Card>
			)}

			{status === 'pending' && (
				<Card>
					<CardHeader title="⏳ Processing" subtitle="Your payment is being processed" />
					<CardBody>
						<p className="text-gray-700 dark:text-gray-300 mb-6">
							Your payment is being processed. This usually takes a few moments. You'll receive a
							confirmation email shortly.
						</p>
						<Button onClick={() => navigate('/organization')} variant="secondary">
							Go to Organization Settings
						</Button>
					</CardBody>
				</Card>
			)}

			{status === 'error' && (
				<Card>
					<CardHeader
						title="✕ Something went wrong"
						subtitle={error || 'Payment verification failed'}
					/>
					<CardBody>
						<p className="text-gray-700 dark:text-gray-300 mb-6">
							There was an issue processing your payment. Please try again or contact support.
						</p>
						<div className="flex gap-3">
							<Button onClick={() => navigate('/pricing')} variant="secondary">
								Back to Pricing
							</Button>
							<Button onClick={() => navigate('/organization')} variant="primary">
								Go to Settings
							</Button>
						</div>
					</CardBody>
				</Card>
			)}
		</div>
	);
}

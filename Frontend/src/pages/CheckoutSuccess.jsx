import { useEffect, useState, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

// internal imports
import API from '../services/api';
import Card, { CardBody, CardHeader } from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import OrgContext from '../context/OrgContext.jsx';

export default function CheckoutSuccess() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const [loading, setLoading] = useState(true);
	const [status, setStatus] = useState('processing');
	const [error, setError] = useState(null);
	const { refresh: refreshOrg } = useContext(OrgContext);

	const sessionId = searchParams.get('session_id');

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
				<Card>
					<CardHeader title="✓ Payment Successful" subtitle="Your subscription is now active" />
					<CardBody>
						<p className="text-gray-700 dark:text-gray-300 mb-6">
							Thank you for upgrading! Your subscription is now active and you can start using all
							premium features immediately.
						</p>
						<Button onClick={() => navigate('/organization')} variant="primary">
							Go to Organization Settings
						</Button>
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

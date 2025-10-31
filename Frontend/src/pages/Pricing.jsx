import { useEffect, useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// internal imports
import { toast } from 'react-toastify';
import { PLANS } from '../config/plans.js';
import Card, { CardBody, CardHeader } from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import API from '../services/api';
import AuthContext from '../context/AuthContext.jsx';

// pricing comp
export default function Pricing() {
	const { auth } = useContext(AuthContext);
	const navigate = useNavigate();
	const location = useLocation();
	const [loadingPlan, setLoadingPlan] = useState(null);
	const [error, setError] = useState(null);
	const [config, setConfig] = useState({
		configured: true,
		prices: { pro: true, enterprise: true },
	});

	// fetch billing config
	useEffect(() => {
		if (!auth?.token) return;
		(async () => {
			try {
				const res = await API.get('/billing/config');
				setConfig(res.data || { configured: false, prices: { pro: false, enterprise: false } });
				if (!res.data?.configured)
					setError('Stripe is not fully configured. Please set STRIPE keys and price IDs.');
			} catch {
				/* ignore */
			}
		})();
	}, [auth?.token]);

	const startCheckout = async (plan) => {
		if (!auth?.token) {
			navigate(`/sign-in?next=${encodeURIComponent('/pricing?plan=' + plan)}`);
			return;
		}
		setError(null);
		setLoadingPlan(plan);

		try {
			const res = await API.post('/billing/checkout', { plan });
			if (res.data?.url) {
				window.location.assign(res.data.url);
			} else {
				setError('Failed to start checkout.');
			}
		} catch (err) {
			const msg =
				err?.response?.data?.message ||
				'Stripe is not configured. Please set your Stripe keys and price IDs.';
			setError(msg);
			toast.error(msg);
		} finally {
			setLoadingPlan(null);
		}
	};

	// if returning with ?plan=... after login, checkout automatically
	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const desired = params.get('plan');
		if (desired && auth?.token && ['pro', 'enterprise'].includes(desired)) {
			startCheckout(desired);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [location.search, auth?.token]);

	return (
		<div className="max-w-6xl mx-auto">
			<div className="mb-6">
				<h1 className="text-3xl font-bold">Choose your plan</h1>
				<p className="text-gray-600">
					Pick the plan that fits your team and usage. You can manage or cancel anytime.
				</p>
			</div>

			{error && (
				<div className="mb-4 p-3 border border-red-300 bg-red-50 text-red-800 rounded">{error}</div>
			)}

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{['free', 'pro', 'enterprise'].map((id) => {
					const p = PLANS[id];
					const isFree = id === 'free';
					return (
						<Card key={id} className={id === 'pro' ? 'border-blue-400' : ''}>
							<CardHeader title={p.name} subtitle={p.blurb} />
							<CardBody>
								<div className="text-3xl font-bold">
									{p.priceMonthly ? `$${p.priceMonthly}/mo` : 'Free'}
								</div>
								<ul className="mt-4 space-y-1 text-sm text-gray-700 dark:text-gray-300">
									<li>• {p.logsPerMonth.toLocaleString()} logs / month</li>
									<li>• Up to {p.members.toLocaleString()} members</li>
									<li>• {p.apiKeys.toLocaleString()} API keys</li>
								</ul>
								<div className="mt-6">
									{isFree ? (
										<Button variant="outline" disabled>
											Current
										</Button>
									) : (
										<Button
											onClick={() => startCheckout(id)}
											loading={loadingPlan === id}
											disabled={!config.configured || !config.prices[id]}
										>
											{id === 'pro' ? 'Choose Pro' : 'Choose Enterprise'}
										</Button>
									)}
								</div>
							</CardBody>
						</Card>
					);
				})}
			</div>

			<p className="mt-6 text-xs text-gray-500">
				Payments are handled securely by Stripe. You’ll be redirected to Stripe Checkout.
			</p>
		</div>
	);
}

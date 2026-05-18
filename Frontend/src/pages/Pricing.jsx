import { useEffect, useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// internal imports
import { toast } from 'react-toastify';
import { PLANS } from '../config/plans.js';
import Card, { CardBody, CardHeader } from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import API from '../services/api';
import AuthContext from '../context/AuthContext.jsx';
import { setPageMeta } from '../utils/seo.js';

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

	// Set SEO on mount
	useEffect(() => {
		setPageMeta(
			'Pricing Plans',
			'Simple, transparent pricing for team logging. Choose Freemium, Pro, or Enterprise to get started with Devlogger.',
			'https://devlogger.io/pricing',
		);
	}, []);

	// fetch billing config
	useEffect(() => {
		if (!auth?.token) return;
		(async () => {
			try {
				const res = await API.get('/billing/config');
				setConfig(res.data || { configured: false, prices: { pro: false, enterprise: false } });
				if (!res.data?.configured)
					setError('An error occured. Please try again in a little while.');
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
				setError('An error occured, please try again.');
			}
		} catch (err) {
			const msg = err?.response?.data?.message || 'An error occured, please try again.';
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
		<div className="max-w-6xl mx-auto px-4">
			<header className="text-center max-w-2xl mx-auto py-12">
				<h1 className="text-4xl font-extrabold">Simple and transparent pricing</h1>
				<p className="mt-3 text-lg text-gray-600">
					Pick a plan that fits your team — upgrade anytime.
				</p>
			</header>

			{error && (
				<div role="alert" className="mb-6 p-3 border border-red-300 bg-red-50 text-red-800 rounded">
					{error}
				</div>
			)}

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
				{['free', 'pro', 'enterprise'].map((id) => {
					const p = PLANS[id];
					const isFree = id === 'free';

					return (
						<div
							key={id}
							className={`transform hover:scale-[1.01] transition ${p.popular ? 'z-10 -mt-2' : ''}`}
						>
							<Card className={`h-full shadow-md ${id === 'pro' ? 'ring-2 ring-blue-300' : ''}`}>
								<CardHeader
									title={p.name}
									subtitle={p.blurb}
									actions={
										p.popular ? (
											<span className="text-xs font-semibold bg-blue-600 text-white px-3 py-1 rounded">
												Popular
											</span>
										) : null
									}
								/>
								<CardBody>
									<div className="flex items-baseline gap-3">
										<div className="text-4xl font-extrabold">
											{p.priceMonthly ? `$${p.priceMonthly}` : 'Free'}
										</div>
										<div className="text-sm text-gray-500 mt-1">{p.priceMonthly ? '/mo' : ''}</div>
									</div>

									<ul className="mt-6 space-y-3 text-sm text-gray-700 dark:text-gray-300">
										<li className="flex items-start gap-3">
											<svg
												className="w-5 h-5 text-green-500 mt-1"
												viewBox="0 0 20 20"
												fill="currentColor"
												aria-hidden
											>
												<path
													fillRule="evenodd"
													d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 111.414-1.414L8.414 12.172l7.293-7.293a1 1 0 011.414 0z"
													clipRule="evenodd"
												/>
											</svg>
											<span>{p.logsPerMonth.toLocaleString()} logs / month</span>
										</li>
										<li className="flex items-start gap-3">
											<svg
												className="w-5 h-5 text-green-500 mt-1"
												viewBox="0 0 20 20"
												fill="currentColor"
												aria-hidden
											>
												<path
													fillRule="evenodd"
													d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 111.414-1.414L8.414 12.172l7.293-7.293a1 1 0 011.414 0z"
													clipRule="evenodd"
												/>
											</svg>
											<span>Up to {p.members.toLocaleString()} members</span>
										</li>
										<li className="flex items-start gap-3">
											<svg
												className="w-5 h-5 text-green-500 mt-1"
												viewBox="0 0 20 20"
												fill="currentColor"
												aria-hidden
											>
												<path
													fillRule="evenodd"
													d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 111.414-1.414L8.414 12.172l7.293-7.293a1 1 0 011.414 0z"
													clipRule="evenodd"
												/>
											</svg>
											<span>{p.apiKeys.toLocaleString()} API keys</span>
										</li>
									</ul>

									<div className="mt-6">
										{isFree ? (
											<Button variant="outline" disabled className="w-full">
												Current
											</Button>
										) : (
											<Button
												onClick={() => startCheckout(id)}
												loading={loadingPlan === id}
												disabled={!config.configured || !config.prices[id]}
												className="w-full"
											>
												{id === 'pro' ? 'Get Pro' : 'Get enterprise'}
											</Button>
										)}
									</div>
								</CardBody>
							</Card>
						</div>
					);
				})}
			</div>

			<div className="mt-8 text-center text-sm text-gray-500">
				Payments are handled securely by Stripe. You’ll be redirected to Stripe Checkout.
			</div>
		</div>
	);
}

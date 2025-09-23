import { toast } from 'react-toastify';
import { useState } from 'react';

// internal imports
import API from '../services/api';
import Button from './ui/Button.jsx';

export default function UpgradeBanner({ org, className = '' }) {
	const [loading, setLoading] = useState(false);
	if (!org) return null;

	const usage = org?.usage?.logCount ?? 0;
	const limit = org?.limits?.logsPerMonth ?? 0;
	if (!limit) return null;
	const pct = Math.min(100, Math.round((usage / limit) * 100));

	const shouldShow = pct >= 80 || org.plan === 'free';
	if (!shouldShow) return null;

	const startCheckout = async (plan) => {
		setLoading(true);
		try {
			const res = await API.post('/billing/checkout', { plan });
			if (res.data?.url) window.location.assign(res.data.url);
		} catch (err) {
			toast.error(err.response?.data?.message || 'Failed to start checkout');
		} finally {
			setLoading(false);
		}
	};

	const nextPlan = org.plan === 'free' ? 'pro' : org.plan === 'pro' ? 'enterprise' : null;
	const ctaText = nextPlan
		? `Upgrade to ${nextPlan[0].toUpperCase() + nextPlan.slice(1)}`
		: 'Manage Billing';

	return (
		<div
			className={`border rounded-lg p-4 bg-yellow-50 border-yellow-200 text-yellow-900 ${className}`}
		>
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
				<div>
					<div className="font-semibold">You are at {pct}% of your monthly log quota</div>
					<div className="text-sm">
						{usage} / {limit} logs used this month
					</div>
				</div>
				<div className="flex gap-2">
					{nextPlan ? (
						<Button loading={loading} onClick={() => startCheckout(nextPlan)}>
							{ctaText}
						</Button>
					) : (
						<a href="/organization">
							<Button variant="outline">Manage Billing</Button>
						</a>
					)}
				</div>
			</div>
		</div>
	);
}

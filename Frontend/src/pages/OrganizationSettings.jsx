import { useEffect, useState, useContext, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';

// internal imports
import API from '../services/api';
import Card, { CardBody, CardHeader } from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import OrgContext from '../context/OrgContext.jsx';
import { PLANS } from '../config/plans.js';

function OrganizationSettings() {
	const { refresh: refreshOrg, org: orgCtx } = useContext(OrgContext);
	const [org, setOrg] = useState(null);
	const [members, setMembers] = useState([]);
	const [apiKeys, setApiKeys] = useState([]);
	const [loading, setLoading] = useState(true);
	const [newMemberEmail, setNewMemberEmail] = useState('');
	const [newKeyName, setNewKeyName] = useState('');
	const [createdKey, setCreatedKey] = useState(null);

	// fetch org
	const fetchOrg = useCallback(async () => {
		try {
			const res = await API.get('/organizations/me');
			setOrg(res.data?.data ?? null);
		} catch (err) {
			toast.error(err?.response?.data?.message || 'Failed to load organization');
		}
	}, []);

	// fetch members
	const fetchMembers = useCallback(async () => {
		try {
			const res = await API.get('/organizations/members');
			setMembers(res.data?.data ?? []);
		} catch {
			// non-critical: ignore
		}
	}, []);

	// fetch keys
	const fetchApiKeys = useCallback(async () => {
		try {
			const res = await API.get('/organizations/api-keys');
			setApiKeys(res.data?.data ?? []);
		} catch {
			// non-critical: ignore
		}
	}, []);

	useEffect(() => {
		let isMounted = true;

		(async () => {
			setLoading(true);
			await Promise.all([fetchOrg(), fetchMembers(), fetchApiKeys()]);
			if (isMounted) setLoading(false);
		})();

		return () => {
			isMounted = false;
		};
	}, [fetchOrg, fetchMembers, fetchApiKeys]);

	// If returning from Stripe checkout, refresh org data
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const sessionId = params.get('session_id');
		if (!sessionId) return;

		// If returning from Stripe checkout, refresh org data
		(async () => {
			refreshOrg?.();
			await fetchOrg();
			toast.success('Subscription updated');

			const url = new URL(window.location.href);
			url.searchParams.delete('session_id');
			window.history.replaceState({}, '', url.toString());
		})();
	}, [refreshOrg, fetchOrg]);

	// adding member
	const addMember = useCallback(
		async (e) => {
			e.preventDefault();
			if (!newMemberEmail) return;
			try {
				await API.post('/organizations/members', { email: newMemberEmail });
				setNewMemberEmail('');
				fetchMembers();
				toast.success('Member added');
			} catch (err) {
				toast.error(err?.response?.data?.message || 'Failed to add member');
			}
		},
		[newMemberEmail, fetchMembers]
	);

	// removing a member
	const removeMember = useCallback(
		async (userId) => {
			if (!window.confirm('Remove this member?')) return;
			try {
				await API.delete(`/organizations/members/${userId}`);
				fetchMembers();
				toast.success('Member removed');
			} catch (err) {
				toast.error(err?.response?.data?.message || 'Failed to remove member');
			}
		},
		[fetchMembers]
	);

	// creating a key
	const createKey = useCallback(
		async (e) => {
			e.preventDefault();
			if (!newKeyName) return;
			try {
				const res = await API.post('/organizations/api-keys', { name: newKeyName });
				setCreatedKey(res.data?.apiKey ?? null);
				setNewKeyName('');
				fetchApiKeys();
				toast.success('API key created (copy now!)');
			} catch (err) {
				toast.error(err?.response?.data?.message || 'Failed to create key');
			}
		},
		[newKeyName, fetchApiKeys]
	);

	// revoke key
	const revokeKey = useCallback(
		async (keyId) => {
			if (!window.confirm('Revoke this API key?')) return;
			try {
				await API.post(`/organizations/api-keys/${encodeURIComponent(keyId)}/revoke`);
				fetchApiKeys();
				toast.success('Key revoked');
			} catch (err) {
				toast.error(err?.response?.data?.message || 'Failed to revoke key');
			}
		},
		[fetchApiKeys]
	);

	// checkout
	const startCheckout = useCallback(async (plan) => {
		try {
			const res = await API.post('/billing/checkout', { plan });
			const url = res.data?.url;
			if (url) {
				window.location.assign(url);
			} else {
				toast.error('Failed to start checkout');
			}
		} catch (err) {
			toast.error(err?.response?.data?.message || 'Failed to start checkout');
		}
	}, []);

	const openBillingPortal = useCallback(async () => {
		try {
			const res = await API.post('/billing/portal');
			const url = res.data?.url;
			if (url) {
				window.location.assign(url);
			} else {
				toast.error('Failed to open billing portal');
			}
		} catch (err) {
			toast.error(err?.response?.data?.message || 'Failed to open billing portal');
		}
	}, []);

	const copyCreatedKey = useCallback(async () => {
		if (!createdKey) return;
		try {
			await navigator.clipboard.writeText(createdKey);
			toast.success('Copied API key to clipboard');
		} catch {
			toast.error('Failed to copy');
		}
	}, [createdKey]);

	const usagePct = useMemo(() => {
		if (!org?.usage || !org?.limits) return 0;
		const pct = org.limits.logsPerMonth ? (org.usage.logCount / org.limits.logsPerMonth) * 100 : 0;
		return Math.min(100, Math.round(pct));
	}, [org]);

	// billing status
	const billingStatus = useMemo(() => {
		const status = org?.billing?.status;
		if (!status) return null;
		const statusEnd = org.billing?.currentPeriodEnd
			? new Date(org.billing.currentPeriodEnd).toLocaleDateString()
			: null;

		switch (status) {
			case 'active':
				return `Active${statusEnd ? ` • renews ${statusEnd}` : ''}`;
			case 'trialing':
				return `Trialing${statusEnd ? ` • ends ${statusEnd}` : ''}`;
			case 'past_due':
				return `Past due${statusEnd ? ` • since ${statusEnd}` : ''}`;
			case 'canceled':
				return `Canceled${statusEnd ? ` • ended ${statusEnd}` : ''}`;
			default:
				return status;
		}
	}, [org]);

	if (loading) return <div className="p-6">Loading organization...</div>;
	if (!org) return <div className="p-6 text-red-500">Organization not found</div>;

	return (
		<div className="max-w-6xl mx-auto p-4 space-y-6">
			<Card>
				<CardHeader title="Organization" subtitle="Overview of your plan and usage" />
				<CardBody>
					<div className="grid md:grid-cols-2 gap-4">
						<div>
							<p className="text-sm text-gray-600">
								Name: <span className="font-medium">{org.name}</span>
							</p>
							<p className="text-sm text-gray-600">
								Plan: <span className="font-medium capitalize">{org.plan}</span>
							</p>
							{billingStatus && (
								<p className="text-sm text-gray-600">
									Billing: <span className="font-medium">{billingStatus}</span>
								</p>
							)}
							<p className="text-sm text-gray-600">
								Monthly Logs: {org.usage?.logCount || 0} / {org.limits?.logsPerMonth}
							</p>
							<div className="w-full bg-gray-200 h-3 rounded mt-2">
								<div
									className="h-3 rounded bg-blue-500 transition-all"
									style={{ width: usagePct + '%' }}
								/>
							</div>
							<div className="mt-4 flex flex-wrap gap-2">
								{org.plan === 'free' && (
									<>
										<Button onClick={() => startCheckout('pro')}>Upgrade to Pro</Button>
										<Button variant="secondary" onClick={() => startCheckout('enterprise')}>
											Upgrade to Enterprise
										</Button>
									</>
								)}
								{(org.billing?.customerId || orgCtx?.billing?.customerId) && (
									<Button variant="outline" onClick={openBillingPortal}>
										Manage Billing
									</Button>
								)}
							</div>
						</div>
						<div className="space-y-3">
							<p className="text-sm text-gray-600 font-medium">Plans</p>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div className="border rounded-lg p-3 bg-white dark:bg-gray-900">
									<h4 className="font-semibold">
										{PLANS.pro.name}{' '}
										<span className="text-sm text-gray-500 font-normal">
											${PLANS.pro.priceMonthly}/mo
										</span>
									</h4>
									<ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 mt-1">
										<li>Higher monthly log limit</li>
										<li>Email support</li>
									</ul>
									<div className="mt-2">
										<Button
											size="sm"
											onClick={() => startCheckout('pro')}
											disabled={org.plan === 'pro'}
										>
											{org.plan === 'pro' ? 'Current Plan' : 'Choose Pro'}
										</Button>
									</div>
								</div>
								<div className="border rounded-lg p-3 bg-white dark:bg-gray-900">
									<h4 className="font-semibold">
										{PLANS.enterprise.name}{' '}
										<span className="text-sm text-gray-500 font-normal">
											${PLANS.enterprise.priceMonthly}/mo
										</span>
									</h4>
									<ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 mt-1">
										<li>Custom limits</li>
										<li>Priority support</li>
									</ul>
									<div className="mt-2">
										<Button
											size="sm"
											variant="secondary"
											onClick={() => startCheckout('enterprise')}
											disabled={org.plan === 'enterprise'}
										>
											{org.plan === 'enterprise' ? 'Current Plan' : 'Choose Enterprise'}
										</Button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</CardBody>
			</Card>

			<Card>
				<CardHeader title="Members" />
				<CardBody>
					<form onSubmit={addMember} className="flex gap-2 mb-4 flex-wrap">
						<div className="flex-1 min-w-[220px]">
							<Input
								value={newMemberEmail}
								onChange={(e) => setNewMemberEmail(e.target.value)}
								placeholder="user@example.com"
							/>
						</div>
						<Button type="submit">Add Member</Button>
					</form>
					<ul className="space-y-2">
						{members.map((m) => (
							<li
								key={m.user._id}
								className="flex justify-between items-center border rounded p-2 bg-white dark:bg-gray-900"
							>
								<div>
									<span className="font-medium">{m.user.name}</span>{' '}
									<span className="text-xs text-gray-500">{m.user.email}</span>{' '}
									<span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
										{m.role}
									</span>
								</div>
								{m.role !== 'owner' && (
									<button
										onClick={() => removeMember(m.user._id)}
										className="text-red-600 text-sm hover:underline"
									>
										Remove
									</button>
								)}
							</li>
						))}
					</ul>
				</CardBody>
			</Card>

			<Card>
				<CardHeader title="API Keys" />
				<CardBody>
					<form onSubmit={createKey} className="flex gap-2 mb-4 flex-wrap">
						<div className="flex-1 min-w-[200px]">
							<Input
								value={newKeyName}
								onChange={(e) => setNewKeyName(e.target.value)}
								placeholder="Key Name"
							/>
						</div>
						<Button type="submit" variant="secondary">
							Create Key
						</Button>
					</form>
					{createdKey && (
						<div className="p-3 bg-yellow-100 border border-yellow-300 rounded text-sm mb-4">
							<div className="flex items-start justify-between gap-4">
								<div className="flex-1">
									<p className="font-medium">New Key (copy now):</p>
									<code className="break-all text-xs">{createdKey}</code>
								</div>
								<div className="shrink-0">
									<Button size="sm" onClick={copyCreatedKey} variant="secondary">
										Copy
									</Button>
								</div>
							</div>
						</div>
					)}
					<ul className="space-y-2">
						{apiKeys.map((k) => (
							<li
								key={k.keyId || k.name}
								className="flex justify-between items-center border rounded p-2 bg-white dark:bg-gray-900"
							>
								<div>
									<span className="font-medium">{k.name}</span>
									{k.keyId && <span className="ml-2 text-xs text-gray-400">id: {k.keyId}</span>}
									<span className="ml-2 text-xs text-gray-500">
										{k.revoked ? 'revoked' : 'active'}
									</span>
									{k.lastUsedAt && (
										<span className="ml-2 text-xs text-gray-400">
											last used {new Date(k.lastUsedAt).toLocaleString()}
										</span>
									)}
								</div>
								{!k.revoked && (
									<button
										onClick={() => revokeKey(k.keyId)}
										className="text-red-600 text-sm hover:underline"
									>
										Revoke
									</button>
								)}
							</li>
						))}
					</ul>
				</CardBody>
			</Card>
		</div>
	);
}

export default OrganizationSettings;

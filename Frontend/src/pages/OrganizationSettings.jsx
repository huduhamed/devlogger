import { useEffect, useState } from 'react';
import { useContext } from 'react';
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
	const fetchOrg = async () => {
		try {
			const res = await API.get('/organizations/me');
			setOrg(res.data.data);
		} catch {
			toast.error('Failed to load organization');
		}
	};

	// fetch members
	const fetchMembers = async () => {
		try {
			const res = await API.get('/organizations/members');
			setMembers(res.data.data || []);
		} catch {
			/* ignore */
		}
	};

	// fetch keys
	const fetchApiKeys = async () => {
		try {
			const res = await API.get('/organizations/api-keys');
			setApiKeys(res.data.data || []);
		} catch {
			/* ignore */
		}
	};

	useEffect(() => {
		(async () => {
			setLoading(true);
			await Promise.all([fetchOrg(), fetchMembers(), fetchApiKeys()]);
			setLoading(false);
		})();
	}, []);

	// If returning from Stripe checkout, refresh org data
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const sessionId = params.get('session_id');
		if (sessionId) {
			refreshOrg?.();
			fetchOrg();
			toast.success('Subscription updated');

			const url = new URL(window.location.href);
			url.searchParams.delete('session_id');
			window.history.replaceState({}, '', url.toString());
		}
	}, [refreshOrg]);

	// adding member
	const addMember = async (e) => {
		e.preventDefault();
		if (!newMemberEmail) return;
		try {
			await API.post('/organizations/members', { email: newMemberEmail });
			setNewMemberEmail('');
			fetchMembers();
			toast.success('Member added');
		} catch (err) {
			toast.error(err.response?.data?.message || 'Failed');
		}
	};

	// removing a member
	const removeMember = async (userId) => {
		if (!window.confirm('Remove this member?')) return;
		try {
			await API.delete(`/organizations/members/${userId}`);
			fetchMembers();
			toast.success('Member removed');
		} catch (err) {
			toast.error(err.response?.data?.message || 'Failed');
		}
	};

	// creating a key
	const createKey = async (e) => {
		e.preventDefault();
		if (!newKeyName) return;
		try {
			const res = await API.post('/organizations/api-keys', { name: newKeyName });
			setCreatedKey(res.data.apiKey);
			setNewKeyName('');
			fetchApiKeys();
			toast.success('API key created (copy now!)');
		} catch (err) {
			toast.error(err.response?.data?.message || 'Failed');
		}
	};

	// revoke key
	const revokeKey = async (keyId) => {
		if (!window.confirm('Revoke this API key?')) return;
		try {
			await API.post(`/organizations/api-keys/${encodeURIComponent(keyId)}/revoke`);
			fetchApiKeys();
			toast.success('Key revoked');
		} catch (err) {
			toast.error(err.response?.data?.message || 'Failed');
		}
	};

	// checkout
	const startCheckout = async (plan) => {
		try {
			const res = await API.post('/billing/checkout', { plan });
			if (res.data?.url) {
				window.location.assign(res.data.url);
			} else {
				toast.error('Failed to start checkout');
			}
		} catch (err) {
			toast.error(err.response?.data?.message || 'Failed to start checkout');
		}
	};

	const openBillingPortal = async () => {
		try {
			const res = await API.post('/billing/portal');
			if (res.data?.url) {
				window.location.assign(res.data.url);
			} else {
				toast.error('Failed to open billing portal');
			}
		} catch (err) {
			toast.error(err.response?.data?.message || 'Failed to open billing portal');
		}
	};

	if (loading) return <div className="p-6">Loading organization...</div>;
	if (!org) return <div className="p-6 text-red-500">Organization not found</div>;

	const usagePct =
		org.usage && org.limits
			? Math.min(100, Math.round((org.usage.logCount / org.limits.logsPerMonth) * 100))
			: 0;

	const status = org.billing?.status;
	const statusEnd = org.billing?.currentPeriodEnd
		? new Date(org.billing.currentPeriodEnd).toLocaleDateString()
		: null;

	let billingStatus = null;
	if (status) {
		switch (status) {
			case 'active':
				billingStatus = `Active${statusEnd ? ` • renews ${statusEnd}` : ''}`;
				break;
			case 'trialing':
				billingStatus = `Trialing${statusEnd ? ` • ends ${statusEnd}` : ''}`;
				break;
			case 'past_due':
				billingStatus = `Past due${statusEnd ? ` • since ${statusEnd}` : ''}`;
				break;
			case 'canceled':
				billingStatus = `Canceled${statusEnd ? ` • ended ${statusEnd}` : ''}`;
				break;
			default:
				billingStatus = status;
		}
	}

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
							<p className="font-medium">New Key (copy now):</p>
							<code className="break-all text-xs">{createdKey}</code>
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

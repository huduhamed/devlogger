import { useContext, useState, useEffect } from 'react';

// internal imports
import AuthContext from '../context/AuthContext.jsx';
import OrgContext from '../context/OrgContext.jsx';
import Card, { CardBody, CardHeader } from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import { toast } from 'react-toastify';
import API from '../services/api';
import Spinner from '../components/ui/Spinner.jsx';

export default function Settings() {
	const { auth, setAuth } = useContext(AuthContext);
	const { org, refresh: refreshOrg } = useContext(OrgContext);
	const user = auth?.user;

	const [profile, setProfile] = useState({
		name: user?.name || '',
		email: user?.email || '',
		password: '',
		avatarUrl: user?.avatarUrl || '',
	});
	const [orgForm, setOrgForm] = useState({ name: org?.name || '' });
	const [loading, setLoading] = useState(false);
	const [orgLoading, setOrgLoading] = useState(false);

	useEffect(() => {
		setOrgForm({ name: org?.name || '' });
	}, [org?.name]);

	const onProfileChange = (e) => setProfile((p) => ({ ...p, [e.target.name]: e.target.value }));
	const onOrgChange = (e) => setOrgForm((p) => ({ ...p, [e.target.name]: e.target.value }));

	const saveProfile = async (e) => {
		e.preventDefault();
		setLoading(true);
		try {
			const payload = { name: profile.name, email: profile.email };
			if (profile.password) payload.password = profile.password;
			if (profile.avatarUrl) payload.avatarUrl = profile.avatarUrl;
			const res = await API.patch('/users/me', payload);
			// update auth context user
			const updated = res.data.data;
			const token = auth.token;
			localStorage.setItem('user', JSON.stringify(updated));
			setAuth({ token, user: updated });
			toast.success('Profile updated');
			setProfile((p) => ({ ...p, password: '' }));
		} catch (err) {
			toast.error(err.response?.data?.message || 'Failed to update profile');
		} finally {
			setLoading(false);
		}
	};

	const saveOrg = async (e) => {
		e.preventDefault();
		setOrgLoading(true);
		try {
			const res = await API.patch('/organizations/me', { name: orgForm.name });
			toast.success('Organization updated');
			await refreshOrg?.();
			setOrgForm({ name: res.data.data.name });
		} catch (err) {
			toast.error(err.response?.data?.message || 'Failed to update organization');
		} finally {
			setOrgLoading(false);
		}
	};

	const handleAvatarFile = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (!file.type.startsWith('image/')) {
			toast.error('Please select an image file');
			return;
		}
		const reader = new FileReader();
		reader.onload = (ev) => {
			setProfile((p) => ({ ...p, avatarUrl: ev.target.result }));
		};
		reader.readAsDataURL(file);
	};

	return (
		<div className="max-w-5xl mx-auto space-y-6">
			<div className="flex items-center gap-3 mb-2">
				<span className="text-2xl font-bold">Settings</span>
				<span className="text-gray-500">Manage your profile & organization</span>
			</div>

			<div className="grid md:grid-cols-2 gap-6">
				<Card>
					<CardHeader title="Profile" subtitle="Personal information & security" />
					<CardBody>
						<form onSubmit={saveProfile} className="space-y-4">
							<div className="flex items-center gap-4">
								<div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
									{profile.avatarUrl ? (
										<img
											src={profile.avatarUrl}
											alt="avatar"
											className="w-full h-full object-cover"
										/>
									) : (
										<span className="text-gray-500 text-sm">No Avatar</span>
									)}
								</div>
								<div>
									<label className="block text-xs font-medium mb-1">Avatar</label>
									<input
										type="file"
										accept="image/*"
										onChange={handleAvatarFile}
										className="text-xs"
									/>
								</div>
							</div>
							<Input
								label="Name"
								name="name"
								value={profile.name}
								onChange={onProfileChange}
								required
							/>
							<Input
								label="Email"
								type="email"
								name="email"
								value={profile.email}
								onChange={onProfileChange}
								required
							/>
							<Input
								label="New Password"
								type="password"
								name="password"
								value={profile.password}
								onChange={onProfileChange}
								placeholder="Leave blank to keep current"
							/>
							<Input
								label="Avatar URL"
								name="avatarUrl"
								value={profile.avatarUrl}
								onChange={onProfileChange}
								placeholder="https://..."
							/>
							<div className="flex justify-end">
								<Button type="submit" loading={loading}>
									Save Profile
								</Button>
							</div>
						</form>
					</CardBody>
				</Card>

				<Card>
					<CardHeader title="Organization" subtitle="Name & identity" />
					<CardBody>
						{!org ? (
							<div className="flex items-center gap-2 text-sm text-gray-600">
								<Spinner /> Loading organization...
							</div>
						) : (
							<form onSubmit={saveOrg} className="space-y-4">
								<Input
									label="Organization Name"
									name="name"
									value={orgForm.name}
									onChange={onOrgChange}
									required
								/>
								<p className="text-xs text-gray-500">Slug auto-updates from the name.</p>
								<div className="flex justify-end">
									<Button type="submit" loading={orgLoading}>
										Save Organization
									</Button>
								</div>
							</form>
						)}
					</CardBody>
				</Card>
			</div>

			<Card>
				<CardHeader title="Advanced" subtitle="Additional controls" />
				<CardBody>
					<ul className="text-sm list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
						<li>
							Password changes immediately invalidate old credential (token refresh handled on next
							login).
						</li>
						<li>
							Avatar is stored client-side (base64) for now. For production, move to object storage
							(S3, etc.).
						</li>
						<li>Org name changes propagate to members on next refresh.</li>
					</ul>
				</CardBody>
			</Card>
		</div>
	);
}

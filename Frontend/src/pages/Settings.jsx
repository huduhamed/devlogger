import { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// internal imports
import AuthContext from '../context/AuthContext.jsx';
import OrgContext from '../context/OrgContext.jsx';
import Card, { CardBody, CardHeader } from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import { toast } from 'react-toastify';
import API from '../services/api';

// settings comp
export default function Settings() {
	const { auth, setAuth, logout } = useContext(AuthContext);
	const { org, refresh: refreshOrg } = useContext(OrgContext);
	const navigate = useNavigate();
	const user = auth?.user;

	const [profile, setProfile] = useState({
		name: user?.name || '',
		email: user?.email || '',
		password: '',
		avatarUrl: user?.avatarUrl || '',
	});

	const [orgForm, setOrgForm] = useState({ name: org?.name || '' });
	const isOwner = org?.owner?._id && user?._id && org.owner._id === user._id;
	const [loading, setLoading] = useState(false);
	const [orgLoading, setOrgLoading] = useState(false);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(false);

	useEffect(() => {
		setOrgForm({ name: org?.name || '' });
	}, [org?.name]);

	useEffect(() => {
		if (!deleteModalOpen) return;

		const onKeyDown = (event) => {
			if (event.key === 'Escape' && !deleteLoading) {
				setDeleteModalOpen(false);
			}
		};

		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [deleteModalOpen, deleteLoading]);

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
			sessionStorage.setItem('user', JSON.stringify(updated));
			if (token) sessionStorage.setItem('token', token);
			setAuth({ token, user: updated });
			toast.success('Profile updated');
			setProfile((p) => ({ ...p, password: '' }));
		} catch (err) {
			let msg = 'An error occured updating your profile, please try again.';

			if (err.response) {
				msg = err.response.data?.message || 'An error occured, please try again.';
			} else if (err.message) {
				msg = 'Something went wrong while saving your profile. Please try again.';
			}

			toast.error(msg);
			console.error('Profile update error:', err);
		} finally {
			setLoading(false);
		}
	};

	// save org
	const saveOrg = async (e) => {
		e.preventDefault();
		setOrgLoading(true);

		try {
			const res = await API.patch('/organizations/me', { name: orgForm.name });
			toast.success('Organization updated');
			await refreshOrg?.();
			setOrgForm({ name: res.data.data.name });
		} catch (err) {
			toast.error(err.response?.data?.message || 'We could not update the workspace right now.');
		} finally {
			setOrgLoading(false);
		}
	};

	// delete acc
	const deleteAccount = async () => {
		setDeleteLoading(true);

		try {
			await API.delete(`/users/${user._id}`);
			logout();
			toast.success('Account deleted');
			navigate('/', { replace: true });
		} catch (err) {
			toast.error(
				err.response?.data?.message ||
					'An error occured deleting your account right now, please try again.',
			);
		} finally {
			setDeleteLoading(false);
			setDeleteModalOpen(false);
		}
	};

	// avatar
	const handleAvatarFile = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith('image/')) {
			toast.error('Please choose a valid image file.');
			return;
		}

		const reader = new FileReader();
		reader.onload = (ev) => {
			setProfile((p) => ({ ...p, avatarUrl: ev.target.result }));
		};
		reader.readAsDataURL(file);
	};

	return (
		<div className="max-w-3xl sm:max-w-5xl mx-auto px-4 space-y-6">
			<div className="flex items-center flex-wrap gap-3 mb-2">
				<span className="text-2xl font-bold">Settings</span>
				<span className="text-gray-500">Manage your profile & organization</span>
				{org && (
					<div className="ml-auto flex items-center gap-2">
						<Badge color="blue" className="font-medium">
							{org.name}
						</Badge>
						<Badge className="capitalize">Plan: {org.plan}</Badge>
					</div>
				)}
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card>
					<CardHeader title="Profile" subtitle="Personal information & security" />
					<CardBody>
						<form onSubmit={saveProfile} className="space-y-4">
							<div className="flex flex-col sm:flex-row sm:items-center gap-4">
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
								<Button type="submit" loading={loading} className="w-full sm:w-auto">
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
							<form
								onSubmit={async (e) => {
									e.preventDefault();
									setOrgLoading(true);
									try {
										await API.post('/organizations', { name: orgForm.name });
										toast.success('Organization created');
										await refreshOrg?.();
									} catch (err) {
										toast.error(
											err.response?.data?.message || 'We could not create a workspace right now.',
										);
									} finally {
										setOrgLoading(false);
									}
								}}
								className="space-y-4"
							>
								<Input
									label="Organization Name"
									name="name"
									value={orgForm.name}
									onChange={onOrgChange}
									required
								/>
								<div className="flex justify-end">
									<Button type="submit" loading={orgLoading} className="w-full sm:w-auto">
										Create Organization
									</Button>
								</div>
							</form>
						) : !isOwner ? (
							<div className="text-sm text-gray-600">
								You are not the owner. Only the owner can rename the organization.
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
									<Button type="submit" loading={orgLoading} className="w-full sm:w-auto">
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
							Password changes immediately invalidate old credentials (fresh token on next login).
						</li>
						<li>Avatar stored client-side base64 now; prefer object storage in production.</li>
						<li>Org rename propagates on next member refresh.</li>
					</ul>
				</CardBody>
			</Card>

			<Card>
				<CardHeader title="Danger Zone" subtitle="Irreversible actions" />
				<CardBody>
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 border border-red-300 rounded bg-red-50 dark:bg-red-900/20 dark:border-red-700">
						<div className="text-sm text-red-700 dark:text-red-300">
							<strong>Delete Account:</strong> This permanently removes your user and cannot be
							undone.
						</div>
						<Button variant="danger" onClick={() => setDeleteModalOpen(true)}>
							Delete Account
						</Button>
					</div>
				</CardBody>
			</Card>

			{deleteModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div
						className="absolute inset-0 bg-black/50"
						onClick={() => {
							if (!deleteLoading) setDeleteModalOpen(false);
						}}
					/>
					<div className="relative w-full max-w-md">
						<Card className="border-red-200 dark:border-red-800">
							<CardHeader
								title="Delete Account"
								subtitle="This action is permanent and cannot be undone."
							/>
							<CardBody className="space-y-4">
								<div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
									<p>
										Your account will be permanently deleted and you will not be able to access it
										again.
									</p>
									<p>Your organization and its related data will also be removed.</p>
								</div>
								<div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
									<Button
										variant="outline"
										onClick={() => setDeleteModalOpen(false)}
										disabled={deleteLoading}
									>
										Cancel
									</Button>
									<Button variant="danger" onClick={deleteAccount} loading={deleteLoading}>
										Yes, Delete My Account
									</Button>
								</div>
							</CardBody>
						</Card>
					</div>
				</div>
			)}
		</div>
	);
}

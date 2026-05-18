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
		<div className="max-w-4xl mx-auto px-4 py-8">
			{/* Header */}
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-2">Settings</h1>
				<p className="text-gray-600 dark:text-gray-400">
					Manage your account and workspace preferences
				</p>
				{org && (
					<div className="mt-4 flex items-center flex-wrap gap-2">
						<Badge color="blue" className="font-medium">
							{org.name}
						</Badge>
						<Badge className="capitalize">Plan: {org.plan}</Badge>
					</div>
				)}
			</div>

			{/* Two-column layout */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
				<Card>
					<CardHeader title="Profile Settings" subtitle="Manage your account details" />
					<CardBody>
						<form onSubmit={saveProfile} className="space-y-5">
							{/* Avatar Section */}
							<div className="flex flex-col sm:flex-row sm:items-end gap-4">
								<div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-md">
									{profile.avatarUrl ? (
										<img
											src={profile.avatarUrl}
											alt="avatar"
											className="w-full h-full object-cover"
										/>
									) : (
										<span className="text-white text-3xl font-bold">
											{user?.name?.charAt(0)?.toUpperCase() || 'U'}
										</span>
									)}
								</div>
								<div className="flex-1">
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Profile Picture
									</label>
									<input
										type="file"
										accept="image/*"
										onChange={handleAvatarFile}
										className="text-sm file:mr-2 file:py-2 file:px-3 file:rounded file:border-0 file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-900/30 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50 cursor-pointer"
									/>
									<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
										JPG, PNG or GIF (max. 2MB)
									</p>
								</div>
							</div>

							{/* Divider */}
							<hr className="border-gray-200 dark:border-gray-700" />

							{/* Name Field */}
							<Input
								label="Name"
								name="name"
								value={profile.name}
								onChange={onProfileChange}
								required
							/>

							{/* Email Field */}
							<Input
								label="Email"
								type="email"
								name="email"
								value={profile.email}
								onChange={onProfileChange}
								required
							/>

							{/* Password Field */}
							<Input
								label="New Password"
								type="password"
								name="password"
								value={profile.password}
								onChange={onProfileChange}
								placeholder="Leave blank to keep your current password"
							/>

							{/* Save Button */}
							<div className="flex justify-end">
								<Button
									type="submit"
									loading={loading}
									className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700"
								>
									Save Profile
								</Button>
							</div>
						</form>
					</CardBody>
				</Card>

				{/* Organization Card */}
				<Card>
					<CardHeader title="Workspace Settings" subtitle="Manage organization details" />
					<CardBody>
						{!org ? (
							<form
								onSubmit={async (e) => {
									e.preventDefault();
									setOrgLoading(true);
									try {
										const res = await API.post('/organizations', { name: orgForm.name });
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
									label="Workspace Name"
									name="name"
									value={orgForm.name}
									onChange={onOrgChange}
									required
								/>
								<div className="flex justify-end">
									<Button
										type="submit"
										loading={orgLoading}
										className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700"
									>
										Create Organization
									</Button>
								</div>
							</form>
						) : !isOwner ? (
							<div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300">
								Contact owner for organization's related changes.
							</div>
						) : (
							<form onSubmit={saveOrg} className="space-y-4">
								<Input
									label="Workspace Name"
									name="name"
									value={orgForm.name}
									onChange={onOrgChange}
									required
								/>
								<p className="text-xs text-gray-500 dark:text-gray-400">
									The workspace URL slug will automatically update based on the name.
								</p>
								<div className="flex justify-end">
									<Button
										type="submit"
										loading={orgLoading}
										className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700"
									>
										Save Organization
									</Button>
								</div>
							</form>
						)}
					</CardBody>
				</Card>
			</div>

			{/* Advanced Info Card */}
			<Card>
				<CardHeader title="Information" subtitle="Important notes about your account" />
				<CardBody>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
							<p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
								Password Updates
							</p>
							<p className="text-xs text-gray-500 dark:text-gray-400">
								Changes take effect after your next login.
							</p>
						</div>
						<div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
							<p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
								Avatar Storage
							</p>
							<p className="text-xs text-gray-500 dark:text-gray-400">
								Profile pictures are stored securely with your account.
							</p>
						</div>
						<div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
							<p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
								Workspace Changes
							</p>
							<p className="text-xs text-gray-500 dark:text-gray-400">
								Changes sync across all members in real-time.
							</p>
						</div>
					</div>
				</CardBody>
			</Card>

			{/* Danger Zone Card */}

			{/* Danger Zone Card */}
			<Card>
				<CardHeader title="Danger Zone" subtitle="Irreversible actions that require confirmation" />
				<CardBody>
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/10 dark:border-red-800">
						<div className="text-sm">
							<p className="font-semibold text-red-700 dark:text-red-400">Delete Your Account</p>
							<p className="text-red-600 dark:text-red-300 text-xs mt-1">
								Permanently delete your account and all associated data. This action cannot be
								undone.
							</p>
						</div>
						<Button
							variant="danger"
							onClick={() => setDeleteModalOpen(true)}
							className="w-full sm:w-auto flex-shrink-0"
						>
							Delete Account
						</Button>
					</div>
				</CardBody>
			</Card>

			{deleteModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div
						className="absolute inset-0 bg-black/50"
						aria-hidden="true"
						onClick={() => {
							if (!deleteLoading) setDeleteModalOpen(false);
						}}
					/>
					<div
						role="alertdialog"
						aria-modal="true"
						aria-labelledby="delete-account-title"
						aria-describedby="delete-account-description"
						className="relative w-full max-w-md"
					>
						<Card className="border-red-200 dark:border-red-800">
							<div id="delete-account-title">
								<CardHeader
									title="Delete Account"
									subtitle="This action is permanent and cannot be undone."
								/>
							</div>
							<CardBody className="space-y-4">
								<div
									id="delete-account-description"
									className="text-sm text-gray-700 dark:text-gray-300 space-y-2"
								>
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
										className="w-full sm:w-auto"
									>
										Cancel
									</Button>
									<Button
										variant="danger"
										onClick={deleteAccount}
										loading={deleteLoading}
										className="w-full sm:w-auto"
									>
										Yes, delete My Account
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

import { useState, useEffect } from 'react';
import Input from './Input';
import Button from './Button';

function InviteMemberModal({ isOpen, onClose, onInvite, initialName = '', initialEmail = '' }) {
	const [name, setName] = useState(initialName);
	const [email, setEmail] = useState(initialEmail);

	useEffect(() => {
		setName(initialName || '');
		setEmail(initialEmail || '');
	}, [initialName, initialEmail]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div className="fixed inset-0 bg-black/40" onClick={onClose} />
			<div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md z-10">
				<h2 className="text-lg font-semibold mb-3">Invite Member</h2>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						if (!name || !email) return;
						onInvite({ name: name.trim(), email: email.trim().toLowerCase() });
					}}
				>
					<div className="mb-3">
						<label className="sr-only">Name</label>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Name of member"
							aria-label="Member name"
						/>
					</div>
					<div className="mb-4">
						<label className="sr-only">Email</label>
						<Input
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="Email of member"
							aria-label="Member email"
						/>
					</div>
					<div className="flex justify-end gap-2">
						<Button type="button" variant="secondary" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit">Invite</Button>
					</div>
				</form>
			</div>
		</div>
	);
}

export default InviteMemberModal;

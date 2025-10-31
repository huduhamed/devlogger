import { useState } from 'react';

// internal imports
import LogForm from './LogForm.jsx';
import Card, { CardBody, CardHeader } from './ui/Card.jsx';

// edit modal
export default function EditLogModal({ open, onClose, initial }) {
	const [visible, setVisible] = useState(open);
	if (!open) return null;
	const close = () => {
		setVisible(false);
		setTimeout(onClose, 150);
	};
	return (
		<div
			className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
				visible ? '' : 'opacity-0'
			}`}
		>
			<div className="absolute inset-0 bg-black/50" onClick={close} />
			<div className="relative w-full max-w-xl">
				<Card>
					<CardHeader title="Edit Log" />
					<CardBody>
						<LogForm initialData={initial} onCancel={close} onSubmit={initial.onSubmit} />
					</CardBody>
				</Card>
			</div>
		</div>
	);
}

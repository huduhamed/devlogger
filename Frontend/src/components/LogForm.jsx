import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

function LogForm({ onSubmit, initialData = null, onCancel }) {
	// form state
	const [form, setForm] = useState({
		title: '',
		description: '',
		tags: '',
	});

	// loading state for submit button
	const [loading, setLoading] = useState(false);

	// initialize form if editing
	useEffect(() => {
		if (initialData) {
			setForm({
				title: initialData.title || '',
				description: initialData.description || '',
				tags: initialData.tags?.join(', ') || '',
			});
		}
	}, [initialData]);

	// handle input changes
	const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

	// handle form submit
	const handleSubmit = async (e) => {
		e.preventDefault();

		const payload = {
			...form,
			tags: form.tags.split(',').map((t) => t.trim()),
		};

		setLoading(true);
		try {
			if (!onSubmit) throw new Error('No submit handler provided');

			await onSubmit(payload, initialData?._id);

			// reset form after successful submit
			setForm({ title: '', description: '', tags: '' });

			// call cancel handler if editing
			if (onCancel) onCancel();
		} catch (err) {
			toast.error(err.response?.data?.message || err.message || 'Failed to save log');
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<h1 className="text-2xl font-bold mb-4">Create Log</h1>
			<form onSubmit={handleSubmit} className="space-y-3">
				<input
					name="title"
					value={form.title}
					onChange={handleChange}
					placeholder="Title ..."
					className="w-full p-2 border"
					required
				/>
				<textarea
					name="description"
					value={form.description}
					onChange={handleChange}
					placeholder="Description ..."
					className="w-full p-2 border"
					required
				/>
				<input
					name="tags"
					value={form.tags}
					onChange={handleChange}
					placeholder="Tags (comma-separated) ..."
					className="w-full p-2 border"
				/>
				<div className="flex justify-between items-center">
					<button
						type="submit"
						disabled={loading}
						className={`px-4 py-2 rounded text-white ${
							loading ? 'bg-gray-400' : 'bg-indigo-500 hover:bg-indigo-600'
						}`}
					>
						{loading
							? initialData
								? 'Updating...'
								: 'Adding...'
							: initialData
							? 'Update Log'
							: 'Add Log'}
					</button>
					{initialData && onCancel && (
						<button
							type="button"
							onClick={onCancel}
							className="text-red-500 px-3 py-1 border border-red-500 rounded hover:bg-red-50"
						>
							Cancel
						</button>
					)}
				</div>
			</form>
		</>
	);
}

export default LogForm;

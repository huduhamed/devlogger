import { useState } from 'react';

// internal imports
import API from '../services/api';

function LogForm({ onSuccess, initialData = null, onCancel }) {
	const [form, setForm] = useState({
		title: initialData?.title || '',
		description: initialData?.description || '',
		tags: initialData?.tags?.join(', ') || '',
	});

	// handle change
	const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

	// handle submit
	const handleSubmit = async (e) => {
		e.preventDefault();
		const tagsArray = form.tags.split(',').map((t) => t.trim());

		// if editing
		if (initialData) {
			await API.put(`/logs/${initialData._id}`, { ...form, tags: tagsArray });
		} else {
			await API.post('/logs', { ...form, tags: tagsArray });
		}

		setForm({ title: '', description: '', tags: '' });
		onSuccess();
		if (onCancel) onCancel();
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-3">
			<input
				name="title"
				value={form.title}
				onChange={handleChange}
				placeholder="title ..."
				className="w-full p-2 border"
			/>
			<textarea
				name="description"
				value={form.description}
				onChange={handleChange}
				placeholder="description ..."
				className="w-full p-2 border"
			/>
			<input
				name="tags"
				value={form.tags}
				onChange={handleChange}
				placeholder="tags ..."
				className="w-full p-2 border"
			/>
			<div className="flex justify-between">
				<button className="bg-indigo-500 text-white px-4 py-2">
					{initialData ? 'Update' : 'Add'} Log
				</button>
				{initialData && (
					<button type="button" onClick={onCancel} className="text-red-500">
						Cancel
					</button>
				)}
			</div>
		</form>
	);
}

export default LogForm;

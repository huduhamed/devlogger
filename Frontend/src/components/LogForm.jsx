import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

// internal imports
import Input from './ui/Input.jsx';
import Textarea from './ui/Textarea.jsx';
import Select from './ui/Select.jsx';
import Button from './ui/Button.jsx';

const TITLE_MAX_LENGTH = 50;

// logform
function LogForm({ onSubmit, initialData = null, onCancel }) {
	const [form, setForm] = useState({
		title: '',
		description: '',
		tags: '',
		level: 'info',
	});
	const [loading, setLoading] = useState(false);

	// initialize form if editing
	useEffect(() => {
		if (initialData) {
			setForm({
				title: initialData.title || '',
				description: initialData.description || '',
				tags: initialData.tags?.join(', ') || '',
				level: initialData.level || 'info',
			});
		}
	}, [initialData]);

	// handle input changes
	const handleChange = (e) => {
		const { name, value } = e.target;
		if (name === 'title') {
			setForm({ ...form, title: value.slice(0, TITLE_MAX_LENGTH) });
			return;
		}

		setForm({ ...form, [name]: value });
	};

	// handle form submit
	const handleSubmit = async (e) => {
		e.preventDefault();

		const normalizedTitle = form.title.trim();
		if (!normalizedTitle) {
			toast.error('Please enter a title.');
			return;
		}

		const payload = {
			...form,
			title: normalizedTitle,
			tags: form.tags
				.split(',')
				.map((t) => t.trim())
				.filter(Boolean),
		};
		setLoading(true);

		try {
			if (!onSubmit) throw new Error('No submit handler provided');
			await onSubmit(payload, initialData?._id);

			setForm({ title: '', description: '', tags: '', level: 'info' });

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
			<h1 className="text-xl sm:text-2xl font-bold mb-4">
				{initialData ? 'Edit Log' : 'Create Log'}
			</h1>
			<form onSubmit={handleSubmit} className="space-y-3">
				<Input
					name="title"
					value={form.title}
					onChange={handleChange}
					placeholder="Title"
					label="Title"
					hint={`${form.title.length}/${TITLE_MAX_LENGTH} characters`}
					maxLength={TITLE_MAX_LENGTH}
					aria-describedby="log-title-counter"
					required
				/>
				<p id="log-title-counter" aria-live="polite" className="sr-only">
					{`${TITLE_MAX_LENGTH - form.title.length} characters remaining`}
				</p>
				<Textarea
					name="description"
					value={form.description}
					onChange={handleChange}
					placeholder="Describe what happened..."
					label="Description"
					required
				/>
				<Select name="level" value={form.level} onChange={handleChange} label="Level">
					<option value="debug">Debug</option>
					<option value="info">Info</option>
					<option value="warn">Warn</option>
					<option value="error">Error</option>
				</Select>
				<Input
					name="tags"
					value={form.tags}
					onChange={handleChange}
					placeholder="ui, api, auth"
					label="Tags (comma separated)"
				/>
				<div className="flex flex-col sm:flex-row sm:items-center gap-2">
					<Button type="submit" loading={loading} className="w-full sm:w-auto">
						{initialData ? 'Update Log' : 'Add Log'}
					</Button>
					{initialData && onCancel && (
						<Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
							Cancel
						</Button>
					)}
				</div>
			</form>
		</>
	);
}

export default LogForm;

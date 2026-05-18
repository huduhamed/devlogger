import { useContext } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// internal imports
import API from '../services/api';
import LogsContext from '../context/LogsContext';
import OrgContext from '../context/OrgContext.jsx';
import LogForm from '../components/LogForm.jsx';
import Card, { CardBody } from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';

// create log
function CreateLog() {
	const navigate = useNavigate();
	const { fetchLogs } = useContext(LogsContext);
	const { refresh: refreshOrg } = useContext(OrgContext);
	const queryClient = useQueryClient();

	const handleSubmit = async (payload) => {
		try {
			await API.post('/logs', payload);
			toast.success('Log created');
		} catch (err) {
			toast.error(err.response?.data?.message || 'Failed to create log');
			throw err;
		}

		// refresh list and org usage (non-blocking)
		try {
			// prefer query invalidation so all log views update
			queryClient.invalidateQueries({ queryKey: ['logs'] });
			if (fetchLogs) await fetchLogs();

			if (refreshOrg) await refreshOrg();
		} catch (err) {
			// non-blocking: inform but continue
			console.warn('Post-create refresh failed:', err);
		}

		navigate('/logs');
	};

	return (
		<div className="max-w-7xl mx-auto px-4 py-6">
			<div className="grid gap-6 lg:grid-cols-[1fr_300px]">
				<main role="main" aria-labelledby="create-log-heading">
					<div className="mb-4 flex items-center justify-between">
						<h1 id="create-log-heading" className="text-2xl font-bold">
							Create Log
						</h1>
						<Button size="sm" variant="outline" onClick={() => navigate(-1)} aria-label="Go back">
							Back
						</Button>
					</div>
					<Card>
						<CardBody>
							<LogForm onSubmit={handleSubmit} />
						</CardBody>
					</Card>
				</main>

				<aside className="sticky top-6">
					<Card>
						<CardBody>
							<h3 className="text-sm font-semibold mb-2">Tips</h3>
							<ul className="text-sm list-disc list-inside text-gray-600">
								<li>Keep titles short and descriptive.</li>
								<li>Use tags to group related logs (comma separated).</li>
								<li>Use level to prioritize attention (error, warn, info).</li>
							</ul>
							<hr className="my-3" />
							<h4 className="text-sm font-medium">Templates</h4>
							<div className="mt-2 text-sm text-gray-600">
								<p className="mb-2">Quick templates you can copy:</p>
								<pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded break-words">
									Error connecting to upstream service
								</pre>
								<pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded break-words mt-2">
									User login failed: invalid token
								</pre>
							</div>
						</CardBody>
					</Card>
				</aside>
			</div>
		</div>
	);
}

export default CreateLog;

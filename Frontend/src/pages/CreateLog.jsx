import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// internal imports
import API from '../services/api';
import LogsContext from '../context/LogsContext';
import OrgContext from '../context/OrgContext.jsx';
import LogForm from '../components/LogForm.jsx';
import Card, { CardBody } from '../components/ui/Card.jsx';

// create log
function CreateLog() {
	const navigate = useNavigate();
	const { fetchLogs } = useContext(LogsContext);
	const { refresh: refreshOrg } = useContext(OrgContext);

	const handleSubmit = async (payload) => {
		try {
			await API.post('/logs', payload);
			toast.success('Log created');
		} catch (err) {
			toast.error(err.response?.data?.message || 'Failed to create log');
			throw err;
		}

		// try to refresh list and org usage (non-blocking)
		try {
			await fetchLogs();

			if (refreshOrg) await refreshOrg();
		} catch (err) {
			// non-blocking: inform but continue
			console.warn('Post-create refresh failed:', err);
		}

		navigate('/logs');
	};

	return (
		<div className="max-w-3xl mx-auto">
			<Card>
				<CardBody>
					<LogForm onSubmit={handleSubmit} />
				</CardBody>
			</Card>
		</div>
	);
}

export default CreateLog;

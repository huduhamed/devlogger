import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// internal imports
import API from '../services/api';
import LogsContext from '../context/LogsContext';
import LogForm from '../components/LogForm.jsx';

// create log
function CreateLog() {
	const navigate = useNavigate();
	const { fetchLogs } = useContext(LogsContext);

	const handleSubmit = async (payload) => {
		try {
			await API.post('/logs', payload);
			toast.success('Log created');
			await fetchLogs();

			navigate('/logs');
		} catch (err) {
			toast.error(err.response?.data?.message || 'Failed to create log');
			throw err;
		}
	};

	return <LogForm onSubmit={handleSubmit} />;
}

export default CreateLog;

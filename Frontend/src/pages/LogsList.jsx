import { useContext, useState, useRef } from 'react';
import { toast } from 'react-toastify';

// internal imports
import API from '../services/api';
import AuthContext from '../context/AuthContext';
import LogsContext from '../context/LogsContext.jsx';
import Card, { CardBody } from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import Pagination from '../components/Pagination.jsx';
import EditLogModal from '../components/EditLogModal.jsx';
import OrgContext from '../context/OrgContext.jsx';

// log list
function LogsList() {
	const { auth } = useContext(AuthContext);
	const { org } = useContext(OrgContext);
	const {
		logs,
		loading,
		error,
		page,
		pages,
		limit,
		total,
		filters,
		updateFilters,
		goToPage,
		setLimit,
		fetchLogs,
	} = useContext(LogsContext);

	const [editing, setEditing] = useState(null);
	const debounceTimer = useRef(null);

	// debounce search input (only fetch after user stops typing for 500ms)
	const handleSearchChange = (value) => {
		updateFilters({ q: value });
		clearTimeout(debounceTimer.current);
		debounceTimer.current = setTimeout(() => {
			fetchLogs({ page: 1 });
		}, 500);
	};

	// handle delete
	const handleDelete = async (id) => {
		if (!window.confirm('Are you sure you want to delete this log?')) return;
		try {
			await API.delete(`/logs/${id}`);
			fetchLogs();
		} catch (err) {
			console.error(err);
			toast.error('Failed to delete log');
		}
	};

	// filter
	const applyFilters = (e) => {
		e.preventDefault();
		clearTimeout(debounceTimer.current);
		fetchLogs({ page: 1 });
	};

	return (
		<div className="max-w-6xl mx-auto mt-6">
			<div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
				<div>
					<h2 className="text-2xl font-bold">Logs</h2>
					<p className="text-sm text-gray-600">Filter your logs</p>
				</div>
				<Card className="w-full">
					<CardBody>
						<form
							onSubmit={applyFilters}
							className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2 text-sm"
						>
							<div className="sm:col-span-2 md:col-span-2">
								<Input
									placeholder="Search..."
									value={filters.q}
									onChange={(e) => handleSearchChange(e.target.value)}
								/>
							</div>
							<Select
								value={filters.level}
								onChange={(e) => {
									updateFilters({ level: e.target.value });
									clearTimeout(debounceTimer.current);
									debounceTimer.current = setTimeout(() => fetchLogs({ page: 1 }), 300);
								}}
							>
								<option value="">Level</option>
								<option value="debug">Debug</option>
								<option value="info">Info</option>
								<option value="warn">Warn</option>
								<option value="error">Error</option>
							</Select>
							<Input
								placeholder="Tag"
								value={filters.tag}
								onChange={(e) => {
									updateFilters({ tag: e.target.value });
									clearTimeout(debounceTimer.current);
									debounceTimer.current = setTimeout(() => fetchLogs({ page: 1 }), 300);
								}}
							/>
							<Select value={limit} onChange={(e) => setLimit(parseInt(e.target.value, 10))}>
								<option value={10}>10</option>
								<option value={20}>20</option>
								<option value={50}>50</option>
								<option value={100}>100</option>
							</Select>
							<Button className="col-span-1 sm:col-span-2 md:col-span-1" type="submit">
								Apply
							</Button>
						</form>
					</CardBody>
				</Card>
			</div>

			{loading && (
				<div className="flex items-center gap-2 text-gray-600">
					<Spinner /> Loading logs...
				</div>
			)}
			{error && <p className="text-red-500">{error}</p>}

			<div className="text-sm text-gray-600 mb-2">
				Showing page {page} of {pages} • {total} total
			</div>

			<ul className="space-y-4">
				{logs.map((log) => {
					const levelColor =
						log.level === 'error'
							? 'red'
							: log.level === 'warn'
							? 'yellow'
							: log.level === 'debug'
							? 'gray'
							: 'blue';
					return (
						<li key={log._id}>
							<Card>
								<CardBody>
									<div className="flex flex-col sm:flex-row sm:justify-between items-start gap-4">
										<div>
											<h3 className="text-lg font-semibold flex items-center gap-2">
												{log.title}
												{log.level && (
													<Badge color={levelColor} className="capitalize">
														{log.level}
													</Badge>
												)}
											</h3>
											<p className="text-gray-700 dark:text-gray-300">{log.description}</p>
											<small className="block text-gray-500 mt-1">
												By: <span className="capitalize">{log.user?.name}</span> •{' '}
												{new Date(log.createdAt).toLocaleString()}
											</small>
											{log.tags?.length > 0 && (
												<div className="mt-2 text-sm text-blue-600">#{log.tags.join(' #')}</div>
											)}
										</div>
										{auth?.user?._id === log.user?._id && (
											<div className="flex gap-2 mt-3 sm:mt-0 sm:ml-4">
												<Button onClick={() => setEditing(log)} variant="primary">
													Edit
												</Button>
												<Button onClick={() => handleDelete(log._id)} variant="danger">
													Delete
												</Button>
											</div>
										)}
									</div>
								</CardBody>
							</Card>
						</li>
					);
				})}
			</ul>

			<div className="mt-6">
				<Pagination
					page={page}
					pages={pages}
					onPage={(p) => {
						goToPage(p);
						fetchLogs({ page: p });
					}}
				/>
			</div>

			{editing && (
				<EditLogModal
					open={!!editing}
					initial={{
						...editing,
						onSubmit: async (payload) => {
							try {
								await API.put(`/logs/${editing._id}`, payload);
								setEditing(null);
								fetchLogs();
							} catch (err) {
								toast.error('Failed to update log');
								throw err;
							}
						},
					}}
					onClose={() => setEditing(null)}
				/>
			)}
		</div>
	);
}

export default LogsList;

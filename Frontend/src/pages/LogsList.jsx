import { useContext } from 'react';
import { toast } from 'react-toastify';

// internal imports
import API from '../services/api';
import AuthContext from '../context/AuthContext';
import LogsContext from '../context/LogsContext.jsx';

function LogsList() {
	const { auth } = useContext(AuthContext);
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

	const applyFilters = (e) => {
		e.preventDefault();
		fetchLogs({ page: 1 });
	};

	return (
		<div className="max-w-5xl mx-auto mt-6">
			<div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
				<h2 className="text-2xl font-bold">All Logs</h2>
				<form
					onSubmit={applyFilters}
					className="grid grid-cols-2 md:grid-cols-6 gap-2 text-sm w-full md:w-auto"
				>
					<input
						placeholder="Search..."
						value={filters.q}
						onChange={(e) => updateFilters({ q: e.target.value })}
						className="border p-2 col-span-2 md:col-span-2"
					/>
					<select
						value={filters.level}
						onChange={(e) => updateFilters({ level: e.target.value })}
						className="border p-2"
					>
						<option value="">Level</option>
						<option value="debug">Debug</option>
						<option value="info">Info</option>
						<option value="warn">Warn</option>
						<option value="error">Error</option>
					</select>
					<input
						placeholder="Tag"
						value={filters.tag}
						onChange={(e) => updateFilters({ tag: e.target.value })}
						className="border p-2"
					/>
					<select
						value={limit}
						onChange={(e) => setLimit(parseInt(e.target.value, 10))}
						className="border p-2"
					>
						<option value={10}>10</option>
						<option value={20}>20</option>
						<option value={50}>50</option>
						<option value={100}>100</option>
					</select>
					<button className="bg-blue-500 text-white px-3 py-2 rounded col-span-2 md:col-span-1">
						Apply
					</button>
				</form>
			</div>

			{loading && <p>Loading logs...</p>}
			{error && <p className="text-red-500">{error}</p>}

			<div className="text-sm text-gray-600 mb-2">
				Showing page {page} of {pages} • {total} total
			</div>

			<ul className="space-y-4">
				{logs.map((log) => (
					<li
						key={log._id}
						className="p-4 bg-gray-100 rounded-lg shadow flex justify-between items-start"
					>
						<div>
							<h3 className="text-lg font-semibold flex items-center gap-2">
								{log.title}
								{log.level && (
									<span
										className={`text-xs px-2 py-0.5 rounded-full capitalize border ${
											log.level === 'error'
												? 'bg-red-100 text-red-700 border-red-300'
												: log.level === 'warn'
												? 'bg-yellow-100 text-yellow-700 border-yellow-300'
												: log.level === 'debug'
												? 'bg-gray-200 text-gray-700 border-gray-400'
												: 'bg-blue-100 text-blue-700 border-blue-300'
										}`}
									>
										{log.level}
									</span>
								)}
							</h3>
							<p className="text-gray-700">{log.description}</p>
							<small className="block text-gray-500 mt-1">
								By: <span className="capitalize">{log.user?.name}</span> •{' '}
								{new Date(log.createdAt).toLocaleString()}
							</small>
							{log.tags?.length > 0 && (
								<div className="mt-2 text-sm text-blue-600">#{log.tags.join(' #')}</div>
							)}
						</div>

						{auth?.user?._id === log.user?._id && (
							<div className="flex gap-2 ml-4">
								<button
									onClick={() => console.log('Edit log:', log._id)}
									className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
								>
									Edit
								</button>
								<button
									onClick={() => handleDelete(log._id)}
									className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
								>
									Delete
								</button>
							</div>
						)}
					</li>
				))}
			</ul>

			{/* pagination controls */}
			{pages > 1 && (
				<div className="flex flex-wrap gap-2 mt-6 items-center">
					<button
						disabled={page === 1}
						onClick={() => {
							goToPage(page - 1);
							fetchLogs({ page: page - 1 });
						}}
						className="px-3 py-1 border rounded disabled:opacity-40"
					>
						Prev
					</button>
					{Array.from({ length: pages }).map((_, i) => (
						<button
							key={i}
							onClick={() => {
								goToPage(i + 1);
								fetchLogs({ page: i + 1 });
							}}
							className={`px-3 py-1 border rounded ${
								page === i + 1 ? 'bg-blue-500 text-white' : ''
							}`}
						>
							{i + 1}
						</button>
					))}
					<button
						disabled={page === pages}
						onClick={() => {
							goToPage(page + 1);
							fetchLogs({ page: page + 1 });
						}}
						className="px-3 py-1 border rounded disabled:opacity-40"
					>
						Next
					</button>
				</div>
			)}
		</div>
	);
}

export default LogsList;

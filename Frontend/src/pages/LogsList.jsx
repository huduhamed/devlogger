import { useContext, useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useSearchParams } from 'react-router-dom';

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

// log list
function LogsList() {
	const { auth } = useContext(AuthContext);
	const {
		logs,
		loading,
		fetching,
		error,
		page,
		pages,
		limit,
		total,
		filters,
		goToPage,
		setLimit,
		fetchLogs,
	} = useContext(LogsContext);

	const [editing, setEditing] = useState(null);
	const [deleteConfirm, setDeleteConfirm] = useState(null);
	const [searchValue, setSearchValue] = useState(filters.q || '');
	const [searchParams, setSearchParams] = useSearchParams();
	const debounceTimer = useRef(null);
	const creatorId = searchParams.get('userId') || filters.userId || '';
	const creatorName = searchParams.get('userName') || '';

	useEffect(() => {
		return () => {
			clearTimeout(debounceTimer.current);
		};
	}, []);

	useEffect(() => {
		const nextUserId = searchParams.get('userId') || '';
		if (nextUserId !== filters.userId) {
			fetchLogs({ page: 1, userId: nextUserId });
		}
	}, [fetchLogs, filters.userId, searchParams]);

	// debounce search input (only fetch after user stops typing for 500ms)
	const handleSearchChange = (value) => {
		setSearchValue(value);
		clearTimeout(debounceTimer.current);
		debounceTimer.current = setTimeout(() => {
			fetchLogs({ page: 1, q: value });
		}, 500);
	};

	const formatDate = (value) => {
		if (!value) return 'Unknown time';
		const date = new Date(value);
		return Number.isNaN(date.getTime()) ? 'Unknown time' : date.toLocaleString();
	};

	const isEditedLog = (log) => {
		if (!log?.updatedAt || !log?.createdAt) return false;
		return new Date(log.updatedAt).getTime() > new Date(log.createdAt).getTime();
	};

	// handle delete - show confirmation dialog
	const handleDelete = (id) => {
		setDeleteConfirm(id);
	};

	// confirm and execute delete
	const confirmDelete = async () => {
		if (!deleteConfirm) return;
		const id = deleteConfirm;
		setDeleteConfirm(null);

		try {
			await API.delete(`/logs/${id}`);
			toast.success('Log deleted successfully');
			fetchLogs();
		} catch (err) {
			console.error(err);
			toast.error(err?.response?.data?.message || 'Failed to delete log');
		}
	};

	// filter
	const applyFilters = (e) => {
		e.preventDefault();
		clearTimeout(debounceTimer.current);
		fetchLogs({
			page: 1,
			level: filters.level,
			tag: filters.tag,
			q: searchValue,
			userId: creatorId,
		});
	};

	const clearCreatorFilter = () => {
		const nextParams = new URLSearchParams(searchParams);
		nextParams.delete('userId');
		nextParams.delete('userName');
		setSearchParams(nextParams, { replace: true });
		fetchLogs({ page: 1, userId: '' });
	};

	return (
		<div className="max-w-7xl mx-auto mt-6 px-4 sm:px-6 lg:px-8">
			<div className="grid gap-6 lg:grid-cols-[1fr_320px]">
				<main>
					<div className="mb-6 flex items-center justify-between">
						<div>
							<h2 id="logs-heading" className="text-2xl font-bold">
								Logs
							</h2>
							<p className="text-sm text-gray-600">
								Filter, search, and manage your event timeline
							</p>
						</div>
						<div className="text-sm text-gray-600" aria-live="polite">
							Showing page {page} of {pages} • {total} total
						</div>
					</div>

					<Card className="mb-6">
						<CardBody>
							<form
								onSubmit={applyFilters}
								className="grid grid-cols-1 md:grid-cols-3 gap-3"
								aria-labelledby="logs-heading"
							>
								<div className="md:col-span-2">
									<Input
										name="q"
										aria-label="Search logs"
										placeholder="Search logs, messages, tags..."
										value={searchValue}
										onChange={(e) => handleSearchChange(e.target.value)}
									/>
								</div>
								<div className="flex gap-2">
									<Select
										name="level"
										aria-label="Filter by level"
										value={filters.level}
										onChange={(e) => {
											const level = e.target.value;
											fetchLogs({ page: 1, level });
										}}
									>
										<option value="">Level</option>
										<option value="debug">Debug</option>
										<option value="info">Info</option>
										<option value="warn">Warn</option>
										<option value="error">Error</option>
									</Select>
								</div>
								<div className="md:col-span-1">
									<div className="flex gap-2">
										<Input
											name="tag"
											aria-label="Filter by tag"
											placeholder="Tag"
											value={filters.tag}
											onChange={(e) => {
												const tag = e.target.value;
												fetchLogs({ page: 1, tag });
											}}
										/>
										<Select
											name="limit"
											aria-label="Select logs per page"
											value={limit}
											onChange={(e) => {
												const nextLimit = parseInt(e.target.value, 10);
												setLimit(nextLimit);
												goToPage(1);
											}}
										>
											<option value={10}>10</option>
											<option value={20}>20</option>
											<option value={50}>50</option>
											<option value={100}>100</option>
										</Select>
										<Button aria-label="Apply filters" type="submit">
											Apply
										</Button>
									</div>
								</div>
							</form>
						</CardBody>
					</Card>

					{loading ? (
						<div role="status" aria-live="polite" className="flex items-center gap-2 text-gray-600">
							<Spinner /> Loading logs...
						</div>
					) : (
						<ul className="space-y-4" role="list" aria-labelledby="logs-heading">
							{!error && logs.length === 0 && (
								<li>
									<Card>
										<CardBody>
											<p className="text-sm text-gray-600">
												No logs match your filters yet. Try clearing filters or create a new log.
											</p>
										</CardBody>
									</Card>
								</li>
							)}

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
									<li key={log._id} role="listitem">
										<article
											id={`log-${log._id}`}
											role="article"
											tabIndex={0}
											aria-labelledby={`log-title-${log._id}`}
											className="rounded-xl border border-stone-200 bg-white/70 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
										>
											<div className="flex flex-col sm:flex-row sm:justify-between gap-3">
												<div className="min-w-0">
													<div className="flex items-center gap-3">
														<h3
															id={`log-title-${log._id}`}
															className="text-lg font-semibold truncate"
														>
															{log.title}
														</h3>
														{log.level && (
															<Badge color={levelColor} className="capitalize">
																{log.level}
															</Badge>
														)}
														{log.tags?.length > 0 && (
															<span className="ml-2 text-xs text-slate-500">
																{log.tags.map((t) => `#${t}`).join(' ')}
															</span>
														)}
													</div>
													<p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
														{log.description}
													</p>
													<div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
														<span>{formatDate(log.createdAt)}</span>
														{log.user?.name && <span>• {log.user.name}</span>}
														{isEditedLog(log) && <span>• Edited</span>}
													</div>
												</div>
												{auth?.user?._id === log.user?._id && (
													<div className="flex gap-2 items-center mt-3 sm:mt-0">
														<Button
															aria-label={`Edit log ${log.title}`}
															onClick={() => setEditing(log)}
															variant="primary"
														>
															Edit
														</Button>
														<Button
															aria-label={`Delete log ${log.title}`}
															onClick={() => handleDelete(log._id)}
															variant="danger"
														>
															Delete
														</Button>
													</div>
												)}
											</div>
										</article>
									</li>
								);
							})}
						</ul>
					)}

					<div className="mt-6">
						<Pagination page={page} pages={pages} onPage={(p) => goToPage(p)} />
					</div>

					{editing && (
						<EditLogModal
							open={!!editing}
							initial={{
								...editing,
								onSubmit: async (payload) => {
									try {
										await API.put(`/logs/${editing._id}`, payload);
										toast.success('Log updated successfully');
										setEditing(null);
										fetchLogs();
									} catch (err) {
										toast.error(err?.response?.data?.message || 'Failed to update log');
										throw err;
									}
								},
							}}
							onClose={() => setEditing(null)}
						/>
					)}

					{/* Delete Confirmation Dialog */}
					{deleteConfirm && (
						<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
							<div
								className="absolute inset-0 bg-black/50"
								onClick={() => setDeleteConfirm(null)}
							/>
							<div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 max-w-sm mx-2">
								<h3 className="text-lg font-semibold mb-2">Delete Log</h3>
								<p className="text-gray-600 dark:text-gray-300 mb-6">
									Are you sure you want to delete this log? This action cannot be undone.
								</p>
								<div className="flex gap-3 justify-end">
									<Button
										variant="outline"
										onClick={() => setDeleteConfirm(null)}
										className="w-full sm:w-auto"
									>
										Cancel
									</Button>
									<Button variant="danger" onClick={confirmDelete} className="w-full sm:w-auto">
										Delete Log
									</Button>
								</div>
							</div>
						</div>
					)}
				</main>

				<aside>
					<div className="sticky top-6 space-y-4">
						<Card>
							<CardBody>
								<div className="flex items-center justify-between">
									<div>
										<div className="text-sm text-slate-500">Total</div>
										<div className="text-2xl font-bold">{total}</div>
									</div>
									<div>
										<div className="text-sm text-slate-500">Per page</div>
										<div className="text-lg">{limit}</div>
									</div>
								</div>
								{creatorId && (
									<div className="mt-4 text-sm text-slate-600">
										Filtering by:{' '}
										<span className="font-medium">{creatorName || 'Selected user'}</span>
										<div className="mt-2">
											<Button size="sm" variant="secondary" onClick={clearCreatorFilter}>
												Clear
											</Button>
										</div>
									</div>
								)}
							</CardBody>
						</Card>

						<Card>
							<CardBody>
								<h4 className="text-sm font-semibold mb-2">Quick filters</h4>
								<div className="flex flex-col gap-2">
									<Button onClick={() => fetchLogs({ page: 1, level: 'error' })} size="sm">
										Errors
									</Button>
									<Button onClick={() => fetchLogs({ page: 1, level: 'warn' })} size="sm">
										Warnings
									</Button>
									<Button onClick={() => fetchLogs({ page: 1, level: 'info' })} size="sm">
										Info
									</Button>
								</div>
							</CardBody>
						</Card>

						{fetching && !loading && (
							<Card>
								<CardBody>
									<div className="flex items-center gap-2 text-sm text-slate-600">
										<Spinner /> Refreshing...
									</div>
								</CardBody>
							</Card>
						)}
					</div>
				</aside>
			</div>
		</div>
	);
}

export default LogsList;

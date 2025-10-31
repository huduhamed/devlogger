// handle empty state
export default function EmptyState({ title = 'Nothing here yet', description, action }) {
	return (
		<div className="text-center py-16 border-2 border-dashed rounded-xl bg-white dark:bg-gray-900">
			<div className="mx-auto mb-3 h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
				ℹ
			</div>
			<h3 className="text-lg font-semibold">{title}</h3>
			{description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
			{action && <div className="mt-4">{action}</div>}
		</div>
	);
}

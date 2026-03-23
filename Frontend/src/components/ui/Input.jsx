// input comp
export default function Input({
	className = '',
	label,
	hint,
	error,
	rightAdornment = null,
	...props
}) {
	return (
		<label className="block text-sm">
			{label && (
				<span className="mb-1 block font-medium text-slate-700 dark:text-gray-200">{label}</span>
			)}
			<div className="relative">
				<input
					className={`w-full rounded-md border border-stone-300 dark:border-gray-700 bg-stone-50 dark:bg-gray-900 px-3 py-2 text-slate-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${rightAdornment ? 'pr-11' : ''} ${className}`}
					{...props}
				/>
				{rightAdornment && (
					<div className="absolute inset-y-0 right-0 flex items-center pr-2">{rightAdornment}</div>
				)}
			</div>
			{hint && !error && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
			{error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
		</label>
	);
}

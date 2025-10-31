// card comp
export default function Card({ className = '', children }) {
	return (
		<div
			className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm ${className}`}
		>
			{children}
		</div>
	);
}

export function CardHeader({ title, subtitle, actions, className = '' }) {
	return (
		<div
			className={`px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between ${className}`}
		>
			<div>
				{title && <h3 className="text-lg font-semibold">{title}</h3>}
				{subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
			</div>
			{actions}
		</div>
	);
}

export function CardBody({ className = '', children }) {
	return <div className={`px-4 py-4 ${className}`}>{children}</div>;
}

export function CardFooter({ className = '', children }) {
	return (
		<div className={`px-4 py-3 border-t border-gray-200 dark:border-gray-800 ${className}`}>
			{children}
		</div>
	);
}

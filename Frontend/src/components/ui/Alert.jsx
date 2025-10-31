import { memo } from 'react';

// variants
const VARIANTS = {
	info: 'bg-blue-50 text-blue-800 border-blue-200',
	success: 'bg-green-50 text-green-800 border-green-200',
	warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
	error: 'bg-red-50 text-red-800 border-red-200',
};

// alert comp
function Alert({ title, children, variant = 'info', className = '' }) {
	const variantClass = VARIANTS[variant] || VARIANTS.info;

	const ariaLive = variant === 'error' ? 'assertive' : 'polite';

	return (
		<div
			role="status"
			aria-live={ariaLive}
			className={['border rounded-md px-3 py-2 text-sm', variantClass, className]
				.filter(Boolean)
				.join(' ')}
		>
			{title && <p className="font-medium mb-0.5">{title}</p>}
			{children}
		</div>
	);
}

export default memo(Alert);

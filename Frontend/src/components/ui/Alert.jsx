import { memo } from 'react';

// variants
const VARIANTS = {
	info: 'bg-sky-50/80 text-sky-900 border-sky-100',
	success: 'bg-emerald-50/80 text-emerald-900 border-emerald-100',
	warning: 'bg-amber-50/80 text-amber-900 border-amber-100',
	error: 'bg-rose-50/80 text-rose-900 border-rose-100',
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

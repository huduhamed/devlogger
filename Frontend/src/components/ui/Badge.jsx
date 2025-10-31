import { memo } from 'react';

// constant colors
const COLORS = {
	gray: 'bg-gray-100 text-gray-800 border-gray-300',
	blue: 'bg-blue-100 text-blue-800 border-blue-300',
	red: 'bg-red-100 text-red-800 border-red-300',
	yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
	green: 'bg-green-100 text-green-800 border-green-300',
};

// badge
const Badge = ({ children, color = 'gray', className = '' }) => {
	const colorClass = COLORS[color] || COLORS.gray;

	const classes = [
		'inline-flex items-center px-2 py-0.5 rounded-full text-xs border',
		colorClass,
		className,
	]
		.filter(Boolean)
		.join(' ');

	return <span className={classes}>{children}</span>;
};

export default memo(Badge);

// layout
function Container({ className = '', children }) {
	return <div className={`max-w-6xl mx-auto px-4 ${className}`}>{children}</div>;
}

export default Container;

// layout
function Container({ className = '', children }) {
	return (
		<main id="main" tabIndex={-1} className={`max-w-6xl mx-auto px-4 sm:px-6 ${className}`} role="main">
			{children}
		</main>
	);
}

export default Container;

// internal imports
import Button from './ui/Button.jsx';

// pagination
function Pagination({ page, pages, onPage }) {
	if (!pages || pages <= 1) return null;
	const go = (p) => () => onPage(Math.max(1, Math.min(pages, p)));

	return (
		<div className="flex flex-wrap gap-2 items-center">
			<Button variant="outline" onClick={go(page - 1)} disabled={page === 1}>
				Prev
			</Button>
			{Array.from({ length: pages }).map((_, i) => (
				<Button key={i} variant={page === i + 1 ? 'primary' : 'outline'} onClick={go(i + 1)}>
					{i + 1}
				</Button>
			))}
			<Button variant="outline" onClick={go(page + 1)} disabled={page === pages}>
				Next
			</Button>
		</div>
	);
}

export default Pagination;

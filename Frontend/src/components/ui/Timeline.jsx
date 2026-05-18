import React from 'react';

function Timeline({ items = [], className = '' }) {
	return (
		<div className={className}>
			<ul className="space-y-3">
				{items.map((it, idx) => (
					<li key={it.id || `${it.type}-${idx}`} className="flex gap-3 items-start">
						<div className="flex-shrink-0">
							<span
								className="w-2 h-2 rounded-full mt-1 block"
								style={{ background: it.color || '#3b82f6' }}
							/>
						</div>
						<div className="flex-1 text-sm text-slate-700 dark:text-gray-300">
							<div className="flex items-center justify-between gap-2">
								<div className="truncate font-medium">{it.title}</div>
								<div className="text-xs text-slate-400 ml-2">{it.time}</div>
							</div>
							{it.detail && <div className="text-xs text-slate-500 mt-1">{it.detail}</div>}
						</div>
					</li>
				))}
				{items.length === 0 && <li className="text-sm text-slate-500">No recent activity</li>}
			</ul>
		</div>
	);
}

export default Timeline;

import { useContext } from 'react';
import { Link } from 'react-router-dom';

// internal imports
import Button from '../components/ui/Button.jsx';
import AuthContext from '../context/AuthContext.jsx';

// home comp
export default function Home() {
	const { auth } = useContext(AuthContext);
	const isSignedIn = !!auth?.token && !!auth?.user;

	return (
		<div className="max-w-4xl mx-auto py-16 px-4 flex flex-col items-center text-center">
			<h1 className="text-5xl font-extrabold brand-text mb-4 tracking-tight">
				DevLogger: Your Team's Logging HQ 🚀
			</h1>
			<p className="text-xl text-gray-700 dark:text-gray-200 mb-6 max-w-2xl mx-auto">
				Empower your team to track, share, and learn from every event. DevLogger is the modern SaaS
				platform for collaborative logging, knowledge sharing, and continuous improvement.
			</p>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 w-full">
				<div className="flex flex-col gap-4 items-start">
					<ul className="list-disc ml-6 text-gray-600 dark:text-gray-300 text-base space-y-2 mb-8 text-left">
						<li>Log bugs, features, and insights in seconds.</li>
						<li>Collaborate with your team and keep everyone in sync.</li>
						<li>Spot trends, celebrate wins, and improve together.</li>
						<li>Invite your team and start building a knowledge base for your organization.</li>
					</ul>
				</div>
			</div>
			<div className="flex flex-col gap-4 w-full max-w-md mb-8">
				{!isSignedIn && (
					<>
						<Link to="/sign-up" className="w-full md:w-auto">
							<Button variant="primary" size="lg" className="w-full text-lg font-bold">
								Get Started Free
							</Button>
						</Link>
						<Link to="/sign-in" className="w-full md:w-auto">
							<Button variant="outline" size="lg" className="w-full text-lg font-bold">
								Sign In
							</Button>
						</Link>
					</>
				)}
				<Link to="/pricing" className="w-full md:w-auto">
					<Button
						variant="ghost"
						size="lg"
						className="w-full text-lg font-bold border-2 border-blue-400 shadow-lg hover:scale-105 hover:border-blue-600 transition-transform duration-200"
					>
						See Pricing
					</Button>
				</Link>
			</div>
			<div className="mt-10 text-sm text-gray-500 dark:text-gray-400">
				<span>
					DevLogger helps teams build a culture of transparency, learning, and continuous
					improvement.
				</span>
			</div>
		</div>
	);
}

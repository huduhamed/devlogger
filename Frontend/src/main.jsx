import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// internal imports
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { LogsProvider } from './context/LogsContext';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { OrgProvider } from './context/OrgContext.jsx';
import './index.css';

// query client
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 5 * 60 * 1000,
			cacheTime: 30 * 60 * 1000,
			refetchOnWindowFocus: true,
			refetchOnReconnect: true,
			retry: 1,
			refetchInterval: false,
		},
	},
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<Router>
				<ThemeProvider>
					<AuthProvider>
						<OrgProvider>
							<LogsProvider>
								<App />
								<ToastContainer
									position="top-right"
									autoClose={3000}
									hideProgressBar
									theme="colored"
								/>
							</LogsProvider>
						</OrgProvider>
					</AuthProvider>
				</ThemeProvider>
			</Router>
		</QueryClientProvider>
	</React.StrictMode>
);

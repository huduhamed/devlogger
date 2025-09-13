import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';

// internal imports
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { LogsProvider } from './context/LogsContext';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
	<React.StrictMode>
		<Router>
			<AuthProvider>
				<LogsProvider>
					<App />
				</LogsProvider>
			</AuthProvider>
		</Router>
	</React.StrictMode>
);

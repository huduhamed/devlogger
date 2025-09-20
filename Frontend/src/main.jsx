import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
					<ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="light" />
				</LogsProvider>
			</AuthProvider>
		</Router>
	</React.StrictMode>
);

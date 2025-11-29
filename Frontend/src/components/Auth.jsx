import { useEffect, useRef, useContext } from 'react';
import ThemeContext from '../context/ThemeContext';

export default function GoogleAuthButton({ onSuccess, onFailure }) {
	const { theme } = useContext(ThemeContext);
	const btnRef = useRef(null);
	const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

	useEffect(() => {
		let mounted = true;

		if (!clientId) {
				onFailure && onFailure(new Error('Missing VITE_GOOGLE_CLIENT_ID'));
				return () => (mounted = false);
			}

		// If the GSI script is already present, initialize immediately
		const initGsi = () => {
			if (!window.google?.accounts?.id) return false;

			try {
				window.google.accounts.id.initialize({
					client_id: clientId,
					callback: (response) => {
						// response.credential is the ID token (JWT)
						if (response?.credential) {
							onSuccess && onSuccess({ tokenId: response.credential });
						} else {
							onFailure && onFailure(new Error('No credential returned'));
						}
					},
					ux_mode: 'popup',
				});

				if (btnRef.current) {
					// choose GSI theme based on app theme
					const btnTheme = theme === 'light' ? 'filled_blue' : 'filled_black';
					// render Google's official button into the container
					window.google.accounts.id.renderButton(btnRef.current, {
						theme: btnTheme,
						size: 'large',
						width: '100%',
					});
				}

				// success
				return true;
			} catch (err) {
				return false;
			}
		};

		if (initGsi()) return () => (mounted = false);

		// load GSI script
		const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
		if (existing) {
			existing.addEventListener('load', initGsi, { once: true });
		} else {
			const script = document.createElement('script');
			script.src = 'https://accounts.google.com/gsi/client';
			script.async = true;
			script.defer = true;
			script.onload = () => initGsi();
			script.onerror = () => {
				onFailure && onFailure(new Error('Failed to load Google Identity Services'));
			};
			document.head.appendChild(script);
		}

		return () => (mounted = false);
	}, [clientId, onSuccess, onFailure, theme]);

	return (
		<div>
			<div ref={btnRef} />
		</div>
	);
}

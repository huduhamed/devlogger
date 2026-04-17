import { useEffect, useRef } from 'react';

function GoogleAuthButton({ onSuccess, onFailure }) {
	const btnRef = useRef(null);
	const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

	useEffect(() => {
		if (!clientId) {
			onFailure && onFailure(new Error('client ID'));
			return;
		}

		const initGsi = () => {
			if (!window.google?.accounts?.id) return false;

			try {
				window.google.accounts.id.initialize({
					client_id: clientId,
					callback: (response) => {
						if (response?.credential) {
							onSuccess && onSuccess({ tokenId: response.credential });
						} else {
							onFailure && onFailure(new Error('No credential returned'));
						}
					},
					ux_mode: 'popup',
				});

				if (btnRef.current) {
					window.google.accounts.id.renderButton(btnRef.current, {
						theme: 'outline',
						size: 'large',
						width: '100%',
					});
				}

				return true;
			} catch {
				return false;
			}
		};

		if (initGsi()) return;

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

		return;
	}, [clientId, onSuccess, onFailure]);

	return (
		<div>
			<div ref={btnRef} />
		</div>
	);
}

export default GoogleAuthButton;

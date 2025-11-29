import { useEffect, useRef } from 'react';

export default function GoogleAuthButton({ onSuccess, onFailure }) {
	const btnRef = useRef(null);
	const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

	useEffect(() => {
		let mounted = true;

		if (!clientId) {
			onFailure && onFailure(new Error('Missing VITE_GOOGLE_CLIENT_ID'));
			return () => (mounted = false);
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
					// render Google's official button into the container (outline theme)
					window.google.accounts.id.renderButton(btnRef.current, {
						theme: 'outline',
						size: 'large',
						width: '100%',
					});
				}

				return true;
			} catch (err) {
				return false;
			}
		};

		if (initGsi()) return () => (mounted = false);

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
	}, [clientId, onSuccess, onFailure]);

	return (
		<div>
			<div ref={btnRef} />
		</div>
	);
}

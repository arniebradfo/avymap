// The old Create React App build registered a caching service worker at this URL.
// This replacement removes it from browsers that still have it installed.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			const keys = await caches.keys();
			await Promise.all(keys.map((key) => caches.delete(key)));
			await self.registration.unregister();
			const clients = await self.clients.matchAll({ type: 'window' });
			clients.forEach((client) => client.navigate(client.url));
		})()
	);
});

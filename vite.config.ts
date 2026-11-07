import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	// Served from the root of a custom domain (www.avymap.com) on GitHub Pages.
	base: '/',
	plugins: [react()],
	build: {
		outDir: 'build',
	},
});

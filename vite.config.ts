import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	// Served from https://arniebradfo.github.io/avymap/ on GitHub Pages.
	// Change to '/' if a custom domain is added (with public/CNAME).
	base: '/avymap/',
	plugins: [react()],
	build: {
		outDir: 'build',
	},
});

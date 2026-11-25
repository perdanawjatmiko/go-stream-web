import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const backendTarget = process.env.BACKEND_URL || 'http://localhost:8080';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({
				pages: 'build',
				assets: 'build',
				fallback: 'index.html',
				precompress: true,
				strict: false
			})
		})
	],
	server: {
		port: 5173,
		proxy: {
			'/api/video/quizzes/stream': {
				target: backendTarget,
				changeOrigin: false,
				headers: {
					'Accept-Encoding': 'identity'
				}
			},
			'/api': {
				target: backendTarget,
				changeOrigin: false
			},
			'/health': {
				target: backendTarget,
				changeOrigin: false
			}
		}
	}
});

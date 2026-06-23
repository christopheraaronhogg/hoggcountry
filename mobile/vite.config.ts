import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	// Expose PUBLIC_-prefixed env to the client bundle (in addition to VITE_), so
	// the app's `import.meta.env.PUBLIC_API_BASE` / `PUBLIC_SPACETIMEDB_HOST` /
	// `PUBLIC_SPACETIMEDB_DB_NAME` actually resolve at build time. Without this,
	// those reads are always undefined and the SpacetimeDB-backed features (Trail
	// Pulse, water reports, live location) can never turn on. PUBLIC_-prefixed vars
	// are intended to be client-public, so this exposes no secrets.
	envPrefix: ['VITE_', 'PUBLIC_']
});

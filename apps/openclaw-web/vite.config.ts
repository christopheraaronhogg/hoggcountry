import { createRequire } from 'node:module';
import path from 'node:path';
import { defineConfig, searchForWorkspaceRoot } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

// In a git worktree, node_modules is hoisted to the main checkout, which sits
// outside the worktree dir — Vite's default fs.allow then 403s the SvelteKit
// client runtime and the app never hydrates. Resolve the real dependency root
// and allow it. In a normal install this is just the repo root (already
// allowed), so the change is a no-op there.
const require = createRequire(import.meta.url);
const hoistedRoot = path.resolve(require.resolve('leaflet/package.json'), '../../..');

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    fs: {
      allow: [searchForWorkspaceRoot(process.cwd()), hoistedRoot]
    }
  }
});

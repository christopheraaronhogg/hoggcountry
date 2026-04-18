import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const adapterTarget = process.env.OPENCLAW_WEB_ADAPTER === 'node' ? 'node' : 'netlify';

const adapterModule = adapterTarget === 'node'
  ? await import('@sveltejs/adapter-node')
  : await import('@sveltejs/adapter-netlify');

const adapter = adapterModule.default;

const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(
      adapterTarget === 'node'
        ? {
            out: 'build'
          }
        : undefined
    ),
    alias: {
      $lib: './src/lib',
      $components: './src/lib/components'
    }
  }
};

export default config;

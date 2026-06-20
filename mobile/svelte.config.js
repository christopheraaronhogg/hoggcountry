import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		alias: {
			spacetimedb: './node_modules/spacetimedb',
			'spacetimedb/*': './node_modules/spacetimedb/*'
		},
		adapter: adapter()
	}
};

export default config;

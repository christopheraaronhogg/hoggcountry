// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
  site: 'https://hoggcountry.com',
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/guide/personalize') && !page.includes('/guide/manual-builder'),
    }),
    svelte(),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});

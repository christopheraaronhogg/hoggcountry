import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const pillSchema = z.object({
	label: z.string(),
	value: z.string(),
	href: z.string().url().optional(),
	variant: z.enum(['alpine','marker','terra','stone']).optional(),
});

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: image().optional(),
			pills: z.array(pillSchema).optional(),
		}),
});

const trips = defineCollection({
	// Load Markdown files in the `src/content/trips/` directory.
	loader: glob({ base: './src/content/trips', pattern: '**/*.md' }),
	// Type-check frontmatter using a schema
schema: ({ image }) =>
		z.object({
			title: z.string(),
			date: z.coerce.date(),
			state: z.string().optional(),
			trail_name: z.string().optional(),
			location: z.string().optional(),
			distance_miles: z.number().optional(),
			elevation_gain_ft: z.number().optional(),
			difficulty: z.string().optional(),
			cover_image: z.string().optional(),
			gallery: z.array(z.string()).optional(),
			gpx_url: z.string().optional(),
			tags: z.array(z.string()).optional(),
			description: z.string().optional(),
			youtube: z.array(z.string()).optional(),
			pills: z.array(pillSchema).optional(),
		}),
});

const posts = defineCollection({
	// Load Markdown files in the `src/content/posts/` directory.
	loader: glob({ base: './src/content/posts', pattern: '**/*.md' }),
	// Type-check frontmatter using a schema
schema: ({ image }) =>
		z.object({
			title: z.string(),
			date: z.coerce.date(),
			tags: z.array(z.string()).optional(),
			summary: z.string().optional(),
			cover_image: z.string().optional(),
			updatedDate: z.coerce.date().optional(),
			pills: z.array(pillSchema).optional(),
		}),
});

// AT Field Guide chapters
const guide = defineCollection({
	loader: glob({ base: './src/content/guide', pattern: '**/*.md' }),
	schema: z.object({
		title: z.string(),
		part: z.number(),
		order: z.number(),
		description: z.string().optional(),
		icon: z.string().optional(), // emoji or icon identifier
		quickRef: z.boolean().default(false), // true for quick-reference pages
	}),
});

export const collections = { blog, trips, posts, guide };

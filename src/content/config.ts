import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const pillSchema = z.object({
  label: z.string(),
  value: z.string(),
  href: z.string().url().optional(),
  variant: z.enum(['alpine','marker','terra','stone']).optional(),
});

const trips = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.string().transform((d) => new Date(d)),
    state: z.enum(['Arkansas', 'Colorado', 'Other']).default('Other'),
    trail_name: z.string().optional(),
    location: z.string().optional(),
    distance_miles: z.number().optional(),
    elevation_gain_ft: z.number().optional(),
    difficulty: z.enum(['Easy', 'Moderate', 'Hard']).optional(),
    cover_image: z.string().optional(),
    gallery: z.array(z.string()).default([]),
    gpx_url: z.string().url().optional(),
    tags: z.array(z.string()).default([]),
    description: z.string().optional(),
    youtube: z.array(z.string()).default([]),
    pills: z.array(pillSchema).optional(),
  }),
});

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.string().transform((d) => new Date(d)),
    tags: z.array(z.string()).default([]),
    summary: z.string().optional(),
    cover_image: z.string().optional(),
    updatedDate: z.string().optional().transform((d) => (d ? new Date(d) : undefined)),
    pills: z.array(pillSchema).optional(),
  }),
});

// Blog collection (from starter) using loader
const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      heroImage: image().optional(),
      pills: z.array(pillSchema).optional(),
    }),
});

export const collections = { trips, posts, blog };

import { defineCollection, z } from 'astro:content';

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
  }),
});

export const collections = { trips, posts };

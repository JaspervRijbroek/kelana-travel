import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { ACCESS_LEVELS, ACCESS_OPTIONS, SEASONS, TRIP_TYPES } from './lib/constants';

/** Indonesian overrides. Any field left out falls back to the English value. */
const translation = z
  .object({
    title: z.string(),
    country: z.string(),
    route: z.string(),
    summary: z.string(),
    stay: z.string(),
    highlights: z.array(z.string()),
    halal: z.string(),
    accessibilityNote: z.string(),
  })
  .partial();

const trips = defineCollection({
  // One file per trip: src/content/trips/<slug>.md. The file name is the trip's id.
  loader: glob({ pattern: '**/*.md', base: './src/content/trips' }),
  schema: z.object({
    title: z.string(),
    type: z.enum(TRIP_TYPES),
    accessibility: z.object({
      level: z.enum(ACCESS_LEVELS),
      options: z.array(z.enum(ACCESS_OPTIONS)).default([]),
      note: z.string(),
    }),

    order: z.number().default(100),
    draft: z.boolean().default(false),
    country: z.string(),
    countryCode: z.string().max(3),
    motif: z.string().default('generic'),
    days: z.number().int().positive(),
    price: z.object({
      private: z.number().positive(),
      group: z.number().positive(),
    }),
    seasons: z.array(z.enum(SEASONS)).min(1),
    departures: z.array(z.coerce.date()).default([]),
    route: z.string(),
    summary: z.string(),
    stay: z.string(),
    highlights: z.array(z.string()).min(1),
    halal: z.string(),

    translations: z.object({ id: translation.optional() }).default({}),
  }),
});

export const collections = { trips };

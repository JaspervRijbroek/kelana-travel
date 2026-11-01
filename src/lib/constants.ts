// Shared vocabularies. Used by the content schema, the components and the client script,
// so this file must not import anything from astro:content.

export const LANGS = ['en', 'id'] as const;
export type Lang = (typeof LANGS)[number];

export const LOCALES: Record<Lang, string> = { en: 'en-GB', id: 'id-ID' };

/** Trip types, in the order the filters and the price calculator list them. */
export const TRIP_TYPES = ['land', 'cruise', '4x4'] as const;
export type TripType = (typeof TRIP_TYPES)[number];

/** Indonesian holiday windows a trip is good for. */
export const SEASONS = ['lebaran', 'school-holidays', 'autumn', 'year-end'] as const;
export type Season = (typeof SEASONS)[number];

/** How wheelchair-friendly a trip is overall. */
export const ACCESS_LEVELS = ['step-free', 'partial', 'not-suitable'] as const;
export type AccessLevel = (typeof ACCESS_LEVELS)[number];

/** Concrete accessibility arrangements a trip can offer. Add a label in src/i18n/ui.ts (opt.*) for any new one. */
export const ACCESS_OPTIONS = [
  'step-free-rooms',
  'adapted-rooms',
  'adapted-vehicle',
  'swivel-seat',
  'lift',
  'step-free-routes',
  'accessible-boat',
  'beach-wheelchair',
  'assisted-transfer',
] as const;
export type AccessOption = (typeof ACCESS_OPTIONS)[number];

import { getCollection } from 'astro:content';
import type { AccessLevel, AccessOption, Lang, Season, TripType } from './constants';

/** A trip with its copy resolved for one language. */
export interface Trip {
  id: string;
  title: string;
  type: TripType;
  access: { level: AccessLevel; options: AccessOption[]; note: string };
  country: string;
  countryCode: string;
  motif: string;
  days: number;
  price: { private: number; group: number };
  seasons: Season[];
  /** ISO dates, YYYY-MM-DD */
  departures: string[];
  route: string;
  summary: string;
  stay: string;
  highlights: string[];
  halal: string;
}

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export async function getTrips(lang: Lang): Promise<Trip[]> {
  const entries = await getCollection('trips', ({ data }) => import.meta.env.DEV || !data.draft);
  return entries
    .sort((a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title))
    .map(({ id, data: d }) => {
      const t = lang === 'id' ? (d.translations.id ?? {}) : {};
      return {
        id,
        title: t.title ?? d.title,
        type: d.type,
        access: {
          level: d.accessibility.level,
          options: d.accessibility.options,
          note: t.accessibilityNote ?? d.accessibility.note,
        },
        country: t.country ?? d.country,
        countryCode: d.countryCode,
        motif: d.motif,
        days: d.days,
        price: d.price,
        seasons: d.seasons,
        departures: d.departures.map(isoDate),
        route: t.route ?? d.route,
        summary: t.summary ?? d.summary,
        stay: t.stay ?? d.stay,
        highlights: t.highlights ?? d.highlights,
        halal: t.halal ?? d.halal,
      };
    });
}

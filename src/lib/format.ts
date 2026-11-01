// Formatting shared by the server-rendered pages and the browser script.
import { LOCALES, type Lang } from './constants';

/** 214000000 → "Rp 214.000.000" */
export const formatRupiah = (value: number) => 'Rp ' + Math.round(value).toLocaleString('id-ID');

/** ["2027-03-06", "2027-06-26"] → "6 Mar, 26 Jun 2027" (or "6 Mar 2027, 2 Jan 2028" across years) */
export function formatDates(isoDates: string[], lang: Lang): string {
  if (!isoDates.length) return '';
  const locale = LOCALES[lang];
  const sameYear = isoDates.every((d) => d.slice(0, 4) === isoDates[0].slice(0, 4));
  const parts = isoDates.map((d) =>
    new Date(d + 'T12:00:00Z').toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      ...(sameYear ? {} : { year: 'numeric' }),
      timeZone: 'UTC',
    }),
  );
  return parts.join(', ') + (sameYear ? ' ' + isoDates[0].slice(0, 4) : '');
}

/** ["A", "B", "C"] → "A, B or C" / "A, B, atau C" */
export const formatOr = (items: string[], lang: Lang) =>
  new Intl.ListFormat(LOCALES[lang], { type: 'disjunction' }).format(items);

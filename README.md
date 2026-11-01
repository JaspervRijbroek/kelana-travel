# Kelana: private journeys

Astro port of the Kelana concept site. It's a static one-page site in English (`/`) and Indonesian (`/id/`).

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static site in dist/
```

## Trips

Each trip is one Markdown file in `src/content/trips/`, and the file name is the trip's id (for example `puglia.md` → `puglia`).
The schema lives in `src/content.config.ts`, so a typo in the frontmatter fails the build and tells you which field is wrong.

```yaml
---
title: "Puglia & Matera"
type: land                 # land | cruise | 4x4
accessibility:
  level: partial           # step-free | partial | not-suitable
  options: [step-free-rooms]
  note: "Partly step-free. …"

order: 1                   # position in the grid
draft: false               # true = shown in `npm run dev` only
country: "Italy"
countryCode: IT            # text in the oval badge
motif: puglia              # illustration from src/lib/motifs.ts, falls back to "generic"
days: 10
price:                     # per person, millions of Rupiah
  private: 214
  group: 158
seasons: [lebaran, school-holidays, autumn]   # lebaran | school-holidays | autumn | year-end
departures: [2027-03-06, 2027-06-26]          # small-group dates
route: "CGK → DOH → FCO → BRI"
summary: "…"
stay: "…"
highlights: ["…", "…"]
halal: "…"

translations:
  id:                      # Indonesian; any field left out falls back to English
    title: "…"
    accessibilityNote: "…"
---
```

Accessibility options: `step-free-rooms`, `adapted-rooms`, `adapted-vehicle`, `swivel-seat`, `lift`,
`step-free-routes`, `accessible-boat`, `beach-wheelchair`, `assisted-transfer`.
To add one, put it in `ACCESS_OPTIONS` in `src/lib/constants.ts` and give it an `opt.<name>` label in `src/i18n/ui.ts`.

These parts update on their own from the trip files: the trip count in the heading, the wheelchair counts in the enquiry section, the step-free alternatives the calculator suggests, and every select menu.

The Markdown body below the frontmatter isn't rendered yet. You can use it for long-form copy later.

## Layout

| Path | What |
| --- | --- |
| `src/components/Home.astro` | The page, assembled for one language |
| `src/components/*.astro` | One component per section, plus `TripCard`, `TripDialog`, `TripArt` |
| `src/i18n/ui.ts` | All interface copy, `en` and `id` |
| `src/styles/global.css` | Design tokens and styles, including dark mode |
| `src/scripts/site.ts` | Filters, booking-mode toggle, dialogs, calculator, enquiry form, hero animation |

The booking mode (private or small group) is set by `<html data-mode>`. Both prices are in the HTML, and CSS shows the one that matches.
The enquiry form is still a demo. It validates the fields and shows a confirmation, but it doesn't send anything.

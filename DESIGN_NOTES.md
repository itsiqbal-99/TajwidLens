# TajwidLens — reader and annotation design

## Product direction

TajwidLens follows an editorial, reading-first approach. Quran text is the visual anchor; controls and explanations stay quiet until requested. The light theme uses Cloud Blue (`#EDF3F6`) as the page canvas, Paper White (`#FCFDFD`) for primary reading surfaces, Ink Blue (`#243746`) for text, and Blue Gray (`#55758C`) for interface actions. Dusty Coral (`#C98779`) provides the warm brand accent, supported by Soft Ochre (`#C5A369`) and Muted Lavender (`#9489A8`). The result is soft and calm without becoming flat or green-dominant.

The interface avoids neon gradients, excessive shadows, decorative dashboards, invented statistics, and motion without instructional value.

## Character-range visualization

An annotation is a half-open Unicode range (`start`, `end`) over the exact displayed ayah. It is not attached to a whole word. This allows the reader to show:

- a single relevant letter and its combining marks;
- the trigger and affected letters inside one word;
- a cross-word encounter;
- several rulings over the same characters.

The renderer divides the ayah only at source range boundaries. Each active segment receives a soft color band and a lower edge. When several rulings overlap, the background becomes a proportional multi-color stripe instead of choosing one winner. Selecting that segment opens a dedicated switcher in the inspector, where every overlapping ruling keeps its own color.

Color is generated deterministically from the source topic and `hukumId`. Closely related rules share a family, while each individual ruling remains distinguishable. Saturation, lightness, band opacity, and panel tint are theme-aware: light mode uses brighter mid-tone accents, while dark mode raises accent lightness and opacity so the ranges remain visible against the slate reading surface. Text labels, counts, focus indicators, and the inspector carry the meaning as well, so color is never the only signal.

## Data integrity in the interface

The browser never detects or derives a tajweed rule. It loads a precomputed per-surah payload and verifies its byte length and SHA-256 digest before rendering it. The build pipeline also validates every quote against the exact Quran substring and checks that ranges start and end on grapheme boundaries.

The offset-reference edition is not displayed. A range is transferred to the KFGQPC display edition only after a whole-ayah, one-to-one grapheme alignment. A mismatch rejects all source annotations for that ayah. The reader states this explicitly rather than showing an empty result as proof that no tajweed law exists.

## Contextual inspector

The source taxonomy is never exposed as the primary teaching language. Every imported `hukumId` is mapped to a name commonly encountered by Indonesian learners, while unfamiliar distinctions are translated into an action such as “read clearly,” “merge,” “hum for two beats,” “read thick,” or “lengthen.” The original Arabic name is retained only in the technical disclosure.

The inspector is ordered for a beginner:

1. exact Arabic range;
2. plain-language meaning;
3. how to read it;
4. trigger, character offsets, and within-word/cross-word scope;
5. waqaf/wasal context without unsupported inference;
6. original Arabic rule, source pattern, category, scholarly variant when supplied, and immutable rule ID.

On desktop the inspector is a fixed second column. On mobile it becomes a bottom sheet. It does not open for an unannotated part of the ayah.

## Navigation and interaction

Surah and ayah fields open searchable, keyboard-operable lists. Previous and next buttons cross surah boundaries. A predominantly horizontal swipe of at least 70 pixels triggers the same navigation on mobile; vertical scrolling does not. Text size and highlight visibility are local display preferences.

## Source limitations

The imported corpus covers seven major topic families, but it is not a complete scholarly model of every reading situation. Waqaf and ibtida can depend on meaning and recitation context, and several documented rule families are not yet encoded upstream. The design therefore exposes source provenance and gaps at the point of use. It never fills a gap with a regex, heuristic, language model, or silent fallback.

TajwidLens remains a learning aid. Correct articulation and contextual stopping should be verified through talaqqi with a qualified teacher.

## Key files

- `scripts/generate-tajweed-data.mjs` — locked import and safe grapheme transfer.
- `scripts/check-tajweed-data.mjs` — exhaustive generated-data validation.
- `sources/quran-ws-v0.4.3/source-lock.json` — release and hash lock.
- `src/lib/tajweed-data.ts` — runtime loading and integrity verification.
- `src/lib/tajweed-presentation.ts` — colors and beginner-facing summaries.
- `src/components/tajweed-text.tsx` — range and overlap rendering.
- `src/components/quran-workspace.tsx` — navigation and contextual inspector.
- `src/app/reference/page.tsx` — user-visible provenance, method, and limitations.
- `src/app/globals.css` — shared visual system and responsive behavior.

## Validation checklist

Before release, run:

```bash
npm run tajweed:build
npm run tajweed:check
npm run typecheck
npm run lint
npm run test
npm run build
```

Browser review should include light and dark themes, a long ayah, an ayah with exact-range overlap (for example 1:6), one of the four rejected ayahs, keyboard navigation, mobile swiping, and the mobile inspector.

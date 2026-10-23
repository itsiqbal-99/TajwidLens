# TajwidLens

TajwidLens is a static, Indonesian-language learning companion for reading the Quran with inspectable tajweed annotations. It does not generate tajweed rulings in the browser. The reader uses a pinned, precomputed corpus and displays the exact annotated character ranges over a separately verified Quran edition.

## Features

- All 114 surahs and 6,236 ayahs from KFGQPC UthmanicHafs v3.0 (2026), Hafs `an Asim.
- 143,049 imported annotation ranges backed by 152 stable source rules.
- Character-level highlighting: a highlight can cover part of a word, cross a word boundary, or overlap another rule.
- Multi-color striped ranges and an overlap switcher when several rulings apply to the same characters.
- A contextual panel whose primary view uses familiar Indonesian tajweed names and answers three beginner questions: what happens, how to read it, and why it is marked. Arabic source rules, patterns, offsets, and IDs remain available in a collapsed technical section.
- Searchable surah and ayah pickers.
- Previous/next navigation and horizontal swipe navigation on mobile.
- A per-ayah tajweed map with spaced, color-coded rule chips.
- 24 beginner learning modules with letter groups and prominent examples.
- Local search across lessons, terms, surahs, and curated learning examples.
- A hijaiyah pronunciation explorer.
- Responsive light and dark themes, keyboard focus states, and reduced-motion support.
- Static export with optional account integration; Quran learning remains available without an account or runtime Quran API request.

## Tajweed data policy

The annotation source is [Quran.ws Tajweed](https://quran.ws/docs/reference/quran-tajweed/) release `v0.4.3`, corpus version `0.4.2`, pinned to commit `c0d07c02965d7853f8002491f05f90e8b0f24d06`. The source rules, annotations, and editions are distributed under CC BY 4.0.

Only rules whose source status is `stable` and whose `needsReview` flag is false are imported. Disputed, disabled, and review-needed rules are excluded. TajwidLens does not run a local pattern matcher to fill gaps.

The upstream annotation offsets refer to a legacy edition whose earlier printed provenance was not recorded. TajwidLens never displays that edition. Instead, the generator transfers an existing range to KFGQPC UthmanicHafs v3.0 only when every grapheme in the complete ayah has a one-to-one match after the encoding normalizations documented by the source project. Four materially different ayahs—11:41, 27:20, 36:22, and 52:37—fail closed, so their 62 source ranges are not transferred.

This is intentionally not a claim of complete scholarly coverage. The upstream corpus documents gaps, including some stop-dependent rulings and broader waqaf/ibtida decisions. The interface reports those limits and never invents a ruling when the source does not provide one. TajwidLens remains a learning aid and does not replace talaqqi with a qualified teacher.

## Run locally

Node.js 22.13 or later and npm are required.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Optional accounts: set `NEXT_PUBLIC_API_URL` in `.env.local` to the separately hosted TajwidLens API origin (local: `http://localhost:4000`) and rebuild. Login, registration, recovery, verification and profile are static client pages. API deployment/setup is documented in the sibling `api/README.md`. No authentication secret belongs in a `NEXT_PUBLIC_*` variable. Without the API URL, learning remains available and account pages state that the service is not configured. Set the public API URL in your hosting build environment; the production workflow was not modified.

## Validation and production build

```bash
npm run tajweed:build
npm run tajweed:check
npm run typecheck
npm run lint
npm run test
npm run build
```

`npm run build` regenerates and validates the tajweed payloads before Next.js writes the static site to `out/`.

The validator checks the pinned source hashes, the display-edition digest, all 114 per-surah payload hashes, all 6,236 ayahs, every annotation bound and quote, grapheme boundaries, rule references, and the expected annotation total.

## Data layout

- `sources/quran-ws-v0.4.3/` contains the pinned source corpus, edition comparison, licenses, and checksum lock.
- `scripts/generate-tajweed-data.mjs` performs the strict source-to-display-edition transfer.
- `scripts/check-tajweed-data.mjs` validates every generated output.
- `public/data/tajweed/` contains one runtime payload per surah, keeping the initial bundle small.
- `src/data/tajweed-index.json` is the generated manifest.
- `src/data/tajweed-rules-generated.json` is the filtered, display-ready rule catalog.
- `src/components/tajweed-text.tsx` renders exact and overlapping ranges.
- `src/components/quran-workspace.tsx` contains reader state, searchable navigation, the rule map, mobile swiping, and the inspector.
- `src/data/annotations.ts` now contains only curated lesson examples; it no longer merges or invokes an automatic detector.

The older Tanzil dataset remains in the repository for lesson examples and source comparison. The annotation reader itself displays only the KFGQPC text included with the pinned tajweed source.

## Static deployment

For GitHub Pages, set `GITHUB_PAGES=true`, `NEXT_PUBLIC_REPO_NAME` to the repository name, and `NEXT_PUBLIC_BASE_PATH` to `/<repository-name>` before building. The existing workflow supplies all three values. `NEXT_PUBLIC_BASE_PATH` is intentionally public because browser-side data and icon requests need the repository prefix.

## Licensing and attribution

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and the original license files in `sources/quran-ws-v0.4.3/`. The data pipeline and user interface are documented in [DESIGN_NOTES.md](DESIGN_NOTES.md).

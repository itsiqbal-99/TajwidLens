<p align="center">
  <img src="web/public/showcase/natural-branding.png" alt="TajwidLens — baca Al-Qur'an dan pahami setiap bacaannya" width="100%" />
</p>

# TajwidLens

## Demo & Source Code

- **Live Demo:** [TajwidLens Web App](https://itsiqbal-99.github.io/TajwidLens/)
- **GitHub Repository:** [itsiqbal-99/TajwidLens](https://github.com/itsiqbal-99/TajwidLens)

TajwidLens is a static, Indonesian-language learning companion for reading the Quran with inspectable tajweed annotations. It does not generate tajweed rulings in the browser. The reader uses a pinned, precomputed corpus and displays the exact annotated character ranges over a separately verified Quran edition.

## Features

- Beginner entry points: **Mulai Belajar**, **Cari Ayat**, and **Bingung Cara Bacanya**, plus a suggested five-stage learning path without progress tracking.
- Quran Explorer emphasizes reading; Reading Guide emphasizes questions and contextual explanations. Both use the same reader, text, and annotation data.
- **Sederhana / Detail** views: primary rules first, or all source annotations including overlapping and advanced rules.
- Read one ayah or three consecutive ayahs. Selecting another ayah in the group preserves the surrounding verses.
- URL-backed ayah, annotation, display mode, and color preferences; browser Back/Forward restores these choices. Arabic font size persists locally.
- Annotations remain keyboard- and touch-selectable when colors are disabled. Large rule buttons provide an alternative to tapping a small Arabic range.
- Contextual words, marked letters, reading instructions, common mistakes, same-rule occurrence navigation, related lessons, and exact links to similar examples.
- Interactive **Waqaf / Wasal** comparison for **Al-Fatihah 1:3**, sourced to Understand Al-Qur’an Academy, *Learn Tajweed* (2020), lesson 54a (PDF page 24). This explicit teaching example uses a separate `study:` ID and never adds inferred rules to the corpus. The waqaf example demonstrates a full stop with sukun, without rawm.
- All 114 surahs and 6,236 ayahs from KFGQPC UthmanicHafs v3.0 (2026), Hafs `an Asim.
- 143,049 imported annotation ranges backed by 152 stable source rules.
- Character-level highlighting: a highlight can cover part of a word, cross a word boundary, or overlap another rule.
- Multi-color striped ranges and an overlap switcher when several rulings apply to the same characters.
- A contextual panel whose primary view uses familiar Indonesian tajweed names and answers three beginner questions: what happens, how to read it, and why it is marked. Arabic source rules, patterns, offsets, and IDs remain available in a collapsed technical section.
- Searchable surah and ayah pickers.
- Previous/next navigation and horizontal swipe navigation on mobile.
- A per-ayah tajweed map with spaced, color-coded rule chips.
- 24 beginner learning modules with category-specific visual illustrations, letter groups, and prominent examples. The same visual language continues from the library card into each lesson detail page.
- Local search across lessons, everyday questions, all surah names, exact references such as `2:255`, and a compact selection of actual corpus annotations (up to three examples per law, supplemented by lesson examples). It is not a full-text search of every ayah.
- A hijaiyah pronunciation explorer with simple practice instructions and side-by-side comparisons using the existing makhraj data. Audio behavior is unchanged.
- Three responsive color themes—**Samudra**, **Zamrud**, and **Senja**—with a named theme picker, persisted locally in the browser.
- A direct **Belajar tajwid** shortcut in the home hero, in addition to the complete learning-path section.
- Installable PWA experience for Android and iOS, including a web app manifest, home-screen icons, an Android install prompt, iOS installation guidance, and offline caching for the application shell.
- Responsive keyboard focus states and reduced-motion support.
- Static export with no account, analytics dependency, API server, or runtime Quran API request.

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
- `src/data/learning-verses.json` contains exact KFGQPC verses used by the home demo and lesson pages; it is generated from the same verified data as the reader.
- `src/data/tajweed-examples.json` is the compact local example index, generated from accepted annotations.
- `src/lib/reading-navigation.ts` centralizes lesson links, legacy-ID resolution, primary-rule filtering, and the explicitly sourced waqaf study.
- `src/components/tajweed-text.tsx` renders exact and overlapping ranges.
- `src/components/quran-workspace.tsx` contains reader state, searchable navigation, the rule map, mobile swiping, and the inspector.
- `src/data/annotations.ts` now contains only curated lesson examples; it no longer merges or invokes an automatic detector.

Full ayah displays on the homepage, lesson pages, and reader use the same KFGQPC edition. Basmala is separate only at the start of surahs other than Al-Fatihah and At-Tawbah. Short pedagogical fragments in existing lesson prose remain editorial examples; the older Tanzil dataset is retained for provenance and regression comparison.

Legacy links are resolved by law and word position, never by selecting an unrelated annotation. Some lessons (including laws outside the stable corpus coverage) have no matching range: their links retain the lesson context and explain the missing highlight. An unsupported or invalid annotation link never silently selects a different law.

Generated Quran payloads and pinned sources use LF line endings through `.gitattributes` so Windows checkouts do not invalidate byte hashes. Run `npm run tajweed:build` after updating an older checkout. The strict runtime hash check remains enabled.

The regression suite covers old and new links, lesson destinations, indexed examples versus runtime payloads, exact text preservation with colors disabled, display priorities, and conversational search. Production builds validate every Quran payload again.

## Static deployment

For GitHub Pages, set `GITHUB_PAGES=true`, `NEXT_PUBLIC_REPO_NAME` to the repository name, and `NEXT_PUBLIC_BASE_PATH` to `/<repository-name>` before building. The existing workflow supplies all three values. `NEXT_PUBLIC_BASE_PATH` is intentionally public because browser-side data and icon requests need the repository prefix.

## Licensing and attribution

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and the original license files in `sources/quran-ws-v0.4.3/`. The data pipeline and user interface are documented in [DESIGN_NOTES.md](DESIGN_NOTES.md).
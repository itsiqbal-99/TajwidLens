# TajwidLens

TajwidLens is an Indonesian-language companion for learning Quranic tajwid. This Next.js application runs as a static site and requires no account, API server, or Quran API calls at runtime.

## Reading-first redesign (2026)

The current interface uses a consistent editorial visual system across the application. The home page and navigation shell were rebuilt around a reading-first experience; see [DESIGN_NOTES.md](DESIGN_NOTES.md) for details. The flat favicon assets can be regenerated with `python scripts/generate-brand-icons.py`.

## Scope

- All **114 surahs and 6,236 ayahs** are available to read, with verse-by-verse selection.
- Each ayah can be scanned for a limited set of tajwid patterns. Results are clearly identified as automatic and as requiring teacher verification; explanations and word markers can be opened from the ayah tajwid map.
- **39 manually authored annotations** for Al-Fatihah, Al-Ikhlas, Al-Falaq, and An-Nas remain available and take precedence when they overlap automatic results.
- The application includes **24 tajwid lessons**, a reference library, local search, a hijaiyah letter explorer, and waqaf/wasal comparisons for prepared examples.
- Light and dark themes, rule-category colors, an explanation panel, and responsive layouts are included. When one selection contains multiple rules, every rule is shown with its own category accent in the contextual panel, while the active rule receives stronger emphasis.

The automatic scanner recognizes a subset of nun sakinah/tanwin, mim sakinah, ghunnah on nun or mim with shadda, qalqalah with a visible sukun, lam ta'rif, some mad tabi'i patterns, and mad iwadh at the end of an ayah. **It does not provide a complete ruling for every tajwid occurrence in every ayah.** Results have not been reviewed by a qualified expert, and readings that depend on waqaf, recitation tradition, or wider context must still be checked with a teacher. When the scanner finds nothing, the application says so without implying that the ayah contains no tajwid rules.

## Run locally

Node.js 22.13 or later and npm are required.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Checks and production build

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

`next build` writes the static site to `out/`.

## Data and architecture

Tanzil Uthmani text v1.0.2 is stored verbatim in `sources/tanzil-uthmani-v1.0.2.txt`, and surah metadata is stored in `sources/tanzil-quran-data.xml`. Run `python scripts/generate-quran.py` to generate `src/data/quran-full.json`. The script verifies the order of all 114 surahs, the total of 6,236 ayahs, and that the displayed text—including basmalahs that are visually separated—can be recombined exactly as it appears in the source.

`src/data/quran.ts` provides ayah access. `src/data/annotations.ts` stores curated annotations and merges results from `src/lib/tajwid-detector.ts`. Automatic rules are derived from visible letters and diacritics and cached per ayah for the current application session. Highlighting never alters the Quran text. Lessons live in `src/data/lessons.ts`, search logic in `src/lib/search.ts`, and the interface in `src/components/` and `src/app/`.

No licensed recitation audio is bundled. Audio controls report that playback is unavailable and are ready to be connected after a properly licensed source and attribution are added.

## Static deployment

Upload the contents of `out/` to any static host. For GitHub Pages under a repository subpath, set `NEXT_PUBLIC_BASE_PATH` before building, for example:

```powershell
$env:NEXT_PUBLIC_BASE_PATH = '/TajwidLens'
npm run build
```

## Sources and licensing

Arabic text: [Tanzil Quran Text](https://tanzil.net/docs/download) (Uthmani v1.0.2), © 2008–2010 Tanzil.net, licensed under CC BY 3.0. The source file was obtained from a [Tanzil distribution mirror](https://github.com/gptforjoomla/Tanzil/blob/master/Packages/com_tanzil/site/resources/quran/quran-uthmani.txt). See the [Tanzil text license](https://tanzil.net/docs/text_license) and `THIRD_PARTY_NOTICES.md`. Tajwid explanations were editorially prepared with reference to *Reach the Goal via Tajweed Rule* by Understand Quran Academy ([PDF](https://download.understandquran.com/fileadmin/user_upload/extras/tajweed/Tajweed_Rules.pdf)). The Indonesian explanations and detection results have not received an independent expert review.

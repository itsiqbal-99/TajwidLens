# TajwidLens — Reading-first redesign

## Design direction

The redesign follows an **editorial minimalism** approach: warm parchment surfaces, Inter and Noto Naskh Arabic typography, ink blue for structure, muted clay for editorial emphasis, and restrained sage and ochre accents. Layouts remain asymmetric, dividers subtle, and cards are used only where they clarify information structure.

The interface avoids neon gradients, excessive shadows, invented statistics, decorative patterns, and unrelated looping animations.

## Major changes

- **Home page:** a new editorial layout with a two-column hero, an interactive curated reading demo (Ikhfa versus Mad ‘Aridh), a three-step learning flow, a waqaf/wasal explanation, row-based learning paths, and focused calls to action.
- **Navigation:** a flat SVG brand mark, a more compact desktop menu, a clear reading-guide call to action, icon-based mobile navigation, and an accessible theme toggle.
- **Reader:** a lighter workspace with streamlined controls, green/gold/blue tajwid markers, a mobile modal panel with a backdrop and close button, and transparent annotation-status messaging.
- **Ayah rule map:** detected rules are presented as wrapping, touch-friendly chips with deliberate spacing and category color accents instead of an unbroken text-like list.
- **Contextual rule panel:** when a selected word or phrase contains multiple tajwid rules, every rule option receives a persistent category color—green for letter encounters, gold for vowel length, and blue for waqaf or letter characteristics. The active option is additionally emphasized, and selecting another option updates the explanation and its matching panel accent.
- **Lesson collection, detail pages, pronunciation, and references:** visual changes are centralized in the design system; existing data and logic remain intact.
- **Icon pack:** `.ico` and PNG favicon assets are generated locally from the flat brand mark in forest, ivory, and warm gold.
- **Compatibility:** the Next.js static export and GitHub Pages workflow remain available. Use the `main` branch.

## Design files

- `src/app/globals.css`: shared component styles, including reader and contextual-panel rule accents.
- `src/app/reading-first.css`: the reading-first design system, page polish, dark-theme adjustments, and responsive breakpoints.
- `src/components/hero-reading-demo.tsx`: a client-side demo that receives verified ayah text from the server page so the full dataset is not bundled into the browser again.
- `src/components/quran-workspace.tsx`: the interactive Quran reader, selection state, and multi-rule contextual panel.
- `src/components/shell.tsx`: navigation, branding, and footer.
- `src/app/page.tsx`: the redesigned home page.
- `scripts/generate-brand-icons.py`: local favicon regeneration.

## Color rationale

Green is retained as a functional tajwid color rather than the dominant brand color. Ink blue now anchors headings, navigation, and large surfaces; muted clay identifies actions and editorial labels; sage, ochre, and dusty blue remain reserved for rule categories. The palette is intentionally low-saturation so Quran text stays visually primary in both light and dark themes.

## Important limitations

**The source content is not modified:** mushaf text, manually authored rules, scanner rules, and metadata retain their existing content. Automatic annotation accuracy still requires review by a qualified teacher. No recitation audio is generated or claimed to be available.

**Validation expectation:** before a production release, run `npm ci && npm run typecheck && npm run lint && npm run test && npm run build`. Browser-level visual review should cover both themes and the desktop/mobile contextual panel, especially selections with multiple rules.

## Deployment

In the GitHub repository, open Settings → Secrets and variables → Actions → Variables and define `NEXT_PUBLIC_REPO_NAME=TajwidLens` (optional; the workflow uses the GitHub repository name when this variable is absent).

Then set Settings → Pages → Build and deployment to GitHub Actions. Push to the `main` branch to deploy.

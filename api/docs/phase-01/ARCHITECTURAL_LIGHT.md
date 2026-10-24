# Architectural Light — 24 October 2026

## Approved direction and boundaries

The user selected **Architectural Light — sculptural illustration and framed form**. This supersedes the earlier narrow studio illustration, not the authentication security policy. Keep the official PNG logo, light hadith surface, two desktop columns, form-first mobile order, and exact Arabic/translation/source.

Refero live research returned `NO_SUBSCRIPTION`; no live reference is claimed. The reference lock is the user-selected direction, the existing official book/lens logo and exact supplied hadith, the previously inspected Vercel form hierarchy, and Refero's bundled visual workflow, typography, motion and craft guidance. Superdesign canvas was intentionally skipped for direct implementation in the existing Next application. Ponytail kept this scoped to the entry shell, shared form repair, auth CSS and verification; no new package or backend change.

| Decision | Reason |
|---|---|
| Framed light split composition | User direction; visual depth without a black promotional panel |
| Ivory architecture, book and emerald optical lens | Brand subject, richer environmental illustration, not a replacement logo |
| Fixed sage/white palette | Login stays independent of reader theme preferences |
| Selectable hadith under artwork | Exact wording, Arabic language/RTL semantics, no generated scripture |
| Pointer depth only on artwork | Form and focus targets never move; no perpetual animation |
| 420ms entrance, 140ms controls | Small hierarchy/feedback effects; reduced motion disables both |
| Single heading and form owner | Removed duplicated headings/controls and repaired misplaced JSX/absent submit handler |

## Asset provenance

Generated with native ImageGen; no external reference image. Inspected the result: blank book pages, no invented Arabic, no logo or text, no people. Original preserved:

`C:/Users/iqbal/.codex/generated_images/01a16b86-8f43-77a1-98a0-6b063e65d8d8/exec-80cad0e2-a7bd-494b-985a-770aad70e8bf.png`

App asset: `D:/apps/TajwidLens/web/public/auth-study-architectural.webp`, 1200×800, 113,590 bytes. Sharp resize/WebP encoding only. The previous illustration is preserved. CSS masks the illustration edges into the light panel; the official logo remains unchanged.

Full generation prompt:

> Create a sophisticated architectural editorial 3D illustration for TajwidLens, an Al-Quran reading and tajwid learning app login page. Wide landscape 3:2 composition. A beautiful open ivory book with completely blank pages on a finely crafted pale travertine reading stand, a sculptural emerald-green optical glass lens floating near its edge, within an airy miniature architectural scene of ivory archways, recessed wall niches, stepped platforms and translucent frosted glass panels. Warm morning sunlight from upper left makes elegant long soft shadows. Subtle brass detail only on the lens rim. Premium tactile porcelain, paper, glass and limestone materials, photoreal physically rendered, restrained refined art direction, no visual clutter. Pale sage and warm off-white background blending into light sage edges. Book and lens are central focal point, strong depth and sophisticated negative space, designed as a hero illustration for a premium enterprise web product. No people, no text, no writing, no letters, no Arabic glyphs, no logos, no crescent or stars. No UI, no typography, no watermark.

## Verification

Final production export: 40 pages PASS; typecheck/lint PASS; frontend unit tests 24 PASS. Isolated API/browser acceptance 17 PASS / 1 SKIP / 0 failed. Login and registration pass visual checks at 1440, 1024, 850, 768, 390 and 320px: no overflow, correct ordering/content/logo/image, enabled fixture controls, pointer movement/reset, password reveal and reduced motion. Desktop/mobile screenshots of both routes were visually inspected. The final image crop/edge blending was included in the final rebuilt export.

Actual API port4000 refused connections during QA. Final screenshots use explicit `AUTH_LAYOUT_FIXTURE=1`; they do not prove live Google/API availability. The verified TajwidLens web processes were restarted to recover its unresponsive preview. No other project/service was stopped.

## Authentication boundary

Email/password submit, safe return path, Google popup, same-tab fallback, session refresh, profile/recovery controls and fixed safe callback errors are retained. No automatic account linking, migration, account mutation, Google consent or deployment was performed. The user confirmed the Google email matches an existing manual account; that collision remains deliberately blocked until a separately authorized secure linking flow exists.

Malformed source before this pass is recoverable under `api/node_modules/.cache/auth-redesign-82d44af5` (globals/account CSS and both auth components). Auth styling was consolidated into account.css; unrelated app/reader styling was not redesigned.

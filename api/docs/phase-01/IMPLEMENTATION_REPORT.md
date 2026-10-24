# Phase 01 update — 24 October 2026 (Asia/Jakarta)

## Latest revision — account experience / popup completion

Implemented the user's latest sharp full-panel wallpaper, personalised Welcome/name navbar and illustrated, theme-aware profile workspace. The existing profile editor and auth controls remain functional. New ordinary Google callbacks finish through `/auth-complete/`: the originating page verifies the server session, receives onboarding/safe return navigation and acknowledges completion so the no-opener popup closes automatically. No credentials are sent over the same-origin BroadcastChannel; same-tab fallback remains. User-reported real Google signup/login success is distinct from the agent's isolated handoff tests.

The interrupted explicit-linking revision is complete: profile → password confirmation → matching verified Google identity, protected by the existing session, state/browser binding, nonce/PKCE and ten-minute single-use intent in auth_tokens. User ID/profile/password are preserved; no schema migration or automatic email-only merge. Tests include conflicting identity and replay. Source rationale, browser API references and asset reuse are in [Account experience](ACCOUNT_EXPERIENCE.md).

Verification: 41-page web export, API build, web lint, 25 frontend unit tests PASS; final-export API/browser acceptance 18 PASS / 1 SKIP, including automatic popup close and original-window new/returning-user navigation. Login/register and profile/navbar visual fixtures pass six widths, long names, focus, dark theme and reduced motion. No live account was created/edited for testing; no deploy or next phase started. Older sections below remain historical.

## Latest revision — Google callback isolation and actionable failures

The user reported a generic failure after selecting a Google account. That past attempt cannot be conclusively attributed because the controller previously collapsed every callback exception into `error=google`. A concrete defect was independently reproduced before fixing: two GET starts in one browser overwrite the fixed binding cookie, causing the first callback to fail. Both start endpoints now issue an HttpOnly/SameSite=Lax 10-minute cookie named for that attempt's validated random state. Callback reads and clears only its own cookie. There is no schema change or relaxation of PKCE, nonce, issuer/audience/signature validation, browser binding, single use or expiry. Open pre-update flows must be restarted.

Controlled failure codes now distinguish missing/expired binding (`google_session`), rejected authorization code (`google_code`), existing-account collision (`google_account_exists`), provider configuration, provider connectivity, invalid identity and cancellation. The frontend maps only known codes to fixed actionable text. Unknown/prototype/HTML input falls back to the generic message. Logs include only a fixed stage/category; raw Google errors, codes, tokens, verifiers, client secrets and emails are deliberately excluded. Conflict remains fail-closed and never links or overwrites a password account automatically.

Read-only configuration diagnostics reached the actual Google token endpoint (intentionally invalid code returned invalid_grant) and fetched the current verification certificates. Aggregate-only database diagnostics did not read account identifiers or credentials. A subsequent live API/Neon check created two diagnostic OAuth attempts, verified independent binding cookies, then passed each through the real callback using intentionally invalid codes. Both reached Google and returned the expected `google_code`, not a binding or configuration failure. This is a negative exchange test, not real user authentication. No user record, credentials, provider settings or migration were changed.

Verification: API build, web export 40 pages and lint PASS; 24 frontend unit cases PASS; final full API/browser suite 17 PASS / 1 skipped / 0 failures. Coverage includes two concurrent browser starts completing independently, replay, missing/expired binding, existing-password collision without linking, provider cancellation, safe token/identity error classification, log redaction and rendered frontend explanations. User must retry a fresh flow to confirm complete live login; whether the selected Google email matches the existing password account remains unconfirmed. Do not report the historic failure as definitively solved by one cause, or live Google sessions as verified.

## Latest revision — light illustrated auth and synchronous Google launch

This revision supersedes the charcoal-panel description below. Login/register retain two columns and the official logo, but the hadith panel is now a light neutral surface with a generated book/lens illustration. Arabic, translation and attribution remain exact selectable text, never baked into the image. The production WebP is 24,520 bytes. Entrance motion is 360 ms (small translation/scale, staggered hierarchy), controls 140 ms, no decorative loops; reduced motion disables all auth/illustration animations. See DESIGN_REVISION.md for the reference lock, asset prompt and QA.

The previous button never opened a popup: it waited for a cross-origin POST and then assigned location. The existing browser reproduced timeout before Google appeared and retained the old handler after a normal reload. The new button synchronously opens the existing GET OAuth route in a separate window/tab with noopener/noreferrer, without waiting for fetch or CORS. It offers same-tab fallback and an explicit session check, and refreshes session on return/focus. Email controls remain usable even if the popup is blocked. GET startup failures safely redirect to the frontend error state; the JSON POST endpoint is retained for compatibility. Backend state/nonce/PKCE, browser binding, replay protection and collision refusal are unchanged.

The cache-first service worker can retain mutable Next development bundles. A beforeInteractive bootstrap only in development unregisters the exact app worker script URL and removes only rebuildable `tajwidlens-pwa-*` caches, then reloads only if that worker controlled the document. It does not clear credentials, preferences, localStorage or unrelated workers/caches. Production PWA remains enabled; cache version is v4. Four unit cases cover exact worker scope, basePath, no subsequent reload, and unsupported browsers.

Live evidence: the actual in-app browser reached Google's **Sign in — to continue to tajwidlens** via the same-tab fallback, using the configured real client and localhost callback. No credentials or consent were submitted. This verifies launch, not complete live identity/session acceptance. The embedded browser did not surface a popup tab; fallback remains necessary there. Google's embedded-user-agent restrictions must not be bypassed; use Chrome/Edge if Google refuses the embedded browser.

Web build (40 pages), lint, 23 unit tests, API build and browser layout checks (login/register, six widths 320–1440px) pass. Full API/browser acceptance passes 14 / skipped 1 / failed 0, including popup login/new profile, register/returning identity, opener isolation, blocked-popup fallback and session retrieval with an identity double. The first popup test attempted interception after a redirect chain and reached Google's invalid test-client screen; the harness now intercepts at the actual start response while preserving the state/cookie, and no longer contacts Google with test credentials. That failed run is not counted as a pass.

## Latest revision — independent monochrome auth and actual development API

The user's report was reproduced against the actual port-4000 API: health returned 200, but `/api/v1/auth/status` returned 404 and the running Swagger omitted it. Source already defined this route; the still-running `ts-node src/main.ts` process predated those changes. Only that verified TajwidLens process was replaced with current source. The actual endpoint now returns 200 with Google/development registration enabled and email delivery disabled. `npm run dev` now uses native Node watch with ts-node, preserving decorator metadata and automatically restarting on backend source changes. No dependency was added.

Frontend session and capability checks now run independently. A missing capability endpoint cannot prevent checking an existing session, editing email/password or submitting login/registration. Registration is disabled only when the backend explicitly declares it unavailable; the server still authorizes every operation. Unknown capability does not invent Google availability. Login has one redirect owner, avoiding redundant navigation after session refresh.

Latest user revision restores two sides on login/register: a charcoal hadith panel on the left and a white 384px form on the right. Both header and form use the official unchanged `web/public/android-chrome-512x512.png`, not waveform branding. The exact supplied Arabic hadith has `lang="ar"` / `dir="rtl"`, its complete Indonesian translation and Bukhari 5027 / Utsman bin 'Affan attribution. At 850px and below the full quote follows the form, without being hidden or truncated. The auth subtree owns its monochrome tokens and light color scheme independently of Samudra/Zamrud/Senja; the application keeps its existing themes. Development's Next indicator is hidden using its documented configuration; compile/runtime errors remain visible.

Reference lock: the captured [Vercel login](https://vercel.com/login) supplies the narrow form hierarchy, neutral surfaces and a strong primary action, not the outer composition. The latest user brief supplies the two-side layout, official logo and exact hadith content; bundled Refero typography/forms/motion references supply readable Arabic leading, semantic quotation, spacing, focus and feedback. Refero live returned NO_SUBSCRIPTION. Linear's capture remained a loading screen and was not treated as a usable reference. No canvas or generated imagery is needed for this scoped code-native revision.

Read-only `node scripts/check-auth-layout.cjs` passes for login/register at 1440, 1024, 850, 768, 390 and 320px: official logo loaded, exact Arabic/translation/attribution, two desktop columns, full quote below mobile form, no horizontal overflow, independent palette, enabled controls, password reveal and reduced motion. Desktop/mobile screenshots were inspected. Authentication logic was unchanged by this final visual revision.

The actual development UI (frontend 3000, API 4000, configured Neon) was exercised by `scripts/test-live-account-ui.cjs`: registration persisted an unverified account, password login/session reload/profile/logout worked, and password login still worked with status deliberately intercepted as 404. The script requires explicit no-SMTP development mode and removes only its unique test account. Interrupted-run fixtures were also removed by verified ID/email/nickname. No real user's record was changed.

## Current implementation

IMPLEMENTED: authentication configuration repair, separate auth layouts, root login entry, guest access, Google profile confirmation, SMTP deferral, responsive forms and reduced motion. No Phase 02–04 feature, dependency replacement, new database migration or deployment.

The current frontend was missing `NEXT_PUBLIC_API_URL` and the root layout no longer mounted `AuthProvider`; the header had also lost account navigation. Backend `.env` already contained database/Google credentials. A local ignored frontend environment file now supplies the API origin, one shared AuthProvider is restored, and header links reflect session state. Static exports inline this variable at build time; copying `api/.env` alone cannot configure the browser. The GitHub Pages workflow now accepts `vars.NEXT_PUBLIC_API_URL`; no hosted variable was changed.

Public `GET /auth/status` distinguishes reachable API capabilities from frontend configuration and transport failures. The UI separately explains invalid/missing API origin, unreachable backend, unavailable Google, and deferred email features. Requests time out after ten seconds; account errors can be retried, and guest access remains usable. Login confirms the session cookie with `/auth/me` before treating the user as signed in.

`AUTH_ALLOW_UNVERIFIED_EMAIL=true` is explicitly restricted to `development`/`test`; startup rejects it everywhere else. In this mode registration stores a real Argon2 hash, does not create a verification token or send mail, and leaves email unverified. Outside it, email registration requires email delivery and password login requires verified email. Session authentication also rejects unverified accounts when this flag is off. Google and verified password login do not require SMTP. Verification/resend/recovery requiring email remain deferred without a configured provider. No SMTP credentials were invented or added.

Google retains Authorization Code + S256 PKCE, browser-bound state, nonce, library-validated identity and collision refusal. A CSRF-protected POST starts OAuth with a JSON URL/cookie response, allowing pending/error feedback before navigation. New users confirm the prefilled nickname at `/profile/?welcome=1`; returning users enter `/home/`. The exact local Google Cloud callback URI is **`http://localhost:4000/api/v1/auth/google/callback`**. Use `${API_URL}/api/v1/auth/google/callback` on the configured host. Live consent/code exchange/session remains NOT VERIFIED; presence of credentials or an authorization redirect is not a pass.

The App Router uses one root provider/style boundary, `(auth)` for login/register/recovery/verification without app navigation, and `(app)` for existing public content/profile with the original shell. The previous homepage content is preserved at `/home/`; all other public URLs stay stable. `/` waits for session loading then replaces to login/home. Guest entry is a normal link to `/home/`, persists by staying on public routes, and needs no anonymous DB row or browser flag. `RequireAccount` guards the profile and safe allowlisted return paths prevent external redirects; API SessionGuard is still authoritative. Logout returns to login. PWA caches the new public entry routes and excludes API/profile requests.

### Design reference lock and decisions

Primary build target: existing TajwidLens design system (`web/DESIGN_NOTES.md`), with the user's clean authentication brief. Mobbin identifies the provided reference as Qatalog's web login with provider/email hierarchy; its full visual image was not accessible through the text page. Refero live returned NO_SUBSCRIPTION. Bundled form/motion craft references supplied implementation details; no unavailable screenshot is claimed inspected.

| Decision | Source / role | Implementation |
|---|---|---|
| Cloud Blue canvas, Ink Blue text, Dusty Coral brand accent | Existing product tokens, preserve semantic roles | All three existing Samudra/Zamrud/Senja themes remain available |
| 400px form; Google, then email, then guest | User brief + Qatalog provider/email pattern | Auth-only page with one clear primary email action; distinct guest link |
| Editorial support without imagery | User brief permits accurate teaching content | Exact existing Al-Falaq 113:2 text and source label; hidden on mobile |
| Narrow form, visible labels, 48px controls, focus/error announcement | Bundled craft-details.md | Password reveal, autocomplete, native validation, error focus, no blocked paste |
| Entrance 320ms/8px; feedback 100–120ms | User duration guidance + bundled motion.md | CSS only; all auth animation/transitions disabled for reduced motion |

TESTED evidence is maintained in TEST_REPORT.md. Neon verified-TLS connection, existing migration/schema and actual Nest startup without SMTP were checked. The startup smoke performed read-only application checks and deferred recovery; no live users or migrations were created. Full live Google consent/session, dedicated PostgreSQL persistence/races, production domain/cookies and assistive-technology checks remain NOT VERIFIED. SMTP delivery is deliberately DEFERRED, not a prerequisite for this development slice.

Required environment: API `DATABASE_URL`, `NODE_ENV`, `FRONTEND_URL`, `API_URL`, `PORT`, `COOKIE_SAME_SITE`, Google ID/secret; frontend `NEXT_PUBLIC_API_URL` before start/build. The development flag is optional and must stay false/absent in production. No secret values are included here.

BLOCKED for full production acceptance: a human must complete live Google consent and confirm the callback allowlist; production frontend/API domains and cookie behavior still need live verification. A separate `_test` database is required for the opt-in PostgreSQL mutation suite. These external acceptance steps do not block reviewing the implemented development slice. SMTP is deliberately deferred. Stop here for review; do not start Phase 02.

---

# Historical implementation — 23 October 2026

Status: IMPLEMENTED locally; TESTED with test doubles. Production acceptance is NOT VERIFIED / BLOCKED by missing Neon, Google and SMTP configuration. Do not report Phase 01 fully complete until the live acceptance checklist passes.

## Audit and scope

API initially contained only IMPLEMENTATION_PHASES.md, ACCEPTANCE_TESTING.md and ENGINEERING_RULES.md. All were read and preserved. Web was Next.js static export with GitHub Pages deployment, not Cloudflare Pages. Quran rendering, audio, learning content and corpus pipeline were left intact. API was initialized as its own Git repository, with no remote/push/deployment.

Changes reach backend configuration, entities/migration, auth/users modules, HTTP setup/OpenAPI, API and browser tests, frontend account routes/provider/API client/header/layout, and documentation. No Phase 02–04 features.

## Backend

`src/main.ts` bootstraps Nest, `common/setup.ts` installs validation, error handling, headers, CORS/CSRF and OpenAPI. `config/config.ts` validates required database URL, HTTPS production endpoints and provider configuration. Auth and Users are separate Nest modules using controllers/services/TypeORM.

Migration `1760000000000-InitialAuth` creates users, sessions, auth_tokens and oauth_attempts, UUID users, unique email/provider subject, foreign keys and expiry/user indexes. It is additive, explicitly invoked, and refuses destructive down migration. Neon connection uses pg verified TLS. No production DB was accessed.

Email/password registration, login, verification/resend, forgot/reset, logout, account read/update, Google authorization/callback and health routes are implemented. Passwords are Argon2id; no hash/session/reset secret appears in API account responses. Google uses PKCE, browser-bound state and nonce with validated ID tokens. Matching email never automatically links accounts. Sessions expire after seven days and reset revokes every session.

## Frontend

Static routes: `/login/`, `/register/`, `/forgot-password/`, `/reset-password/`, `/verify-email/`, `/profile/`. API calls use credentials, no localStorage auth tokens. Header reflects account state. Forms include validation, busy/error/success states, Google entry, profile fields, resend and logout. Guest reading remains available when API is absent or offline. Existing theme/light/dark and responsive controls are reused.

### Design decision ledger

| Decision | Source | Application |
|---|---|---|
| Preserve palette/type | web/DESIGN_NOTES.md and globals.css | Existing surface, text, border and action variables |
| One narrow form column | User brief: simple account pages | 480px maximum card, mobile full width |
| Labels, autocomplete, visible focus | Refero bundled craft-details.md | Accessible native inputs and 44px controls |
| Keep learning open | User brief | Guest link and no route guard around learning |

Refero live research was unavailable (NO_SUBSCRIPTION); existing product is the locked visual reference. Screenshots were inspected at 390px and 1440px, light/dark.

## Limitations and blockers

- Neon credentials absent: live connection, TLS handshake and migrations NOT VERIFIED. pg-mem is not PostgreSQL and cannot prove production transaction/race behavior.
- Google production client absent: live consent/code exchange NOT VERIFIED. Automated flow uses identity doubles; library validation must still be exercised against Google staging credentials.
- SMTP credentials absent: live delivery NOT VERIFIED. No emails were claimed sent through a live provider.
- Production domains/hosting not selected. Same-site custom domains are recommended; unrelated domains may block cookies. Production configuration was not changed.
- Rate limiter is per process and proxy trust remains off. Expired-row cleanup is an operational task. No admin, dashboard, progress sync or account-linking UI was added.
- SMTP send and DB commit are not one atomic action; a rare post-send commit failure requires retry. No mail queue was introduced.
- Existing Next.js security advisory stopped the initial build; a same-major patch update was applied. Remaining frontend development-tool advisories are tracked in TEST_REPORT.md.

Protocol references: [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect), [Nest rate limiting](https://docs.nestjs.com/security/rate-limiting).

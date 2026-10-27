# TajwidLens API — Phase 01–03B

Historical screenshots and superseded UI revision notes were removed from the current tree before merging. They remain in Git at commit `321ec250aede52e630992fa5e173b40bdcb21670`. Phase reports describe their original test runs; screenshot filenames in those reports refer to that archive. Browser tests can regenerate screenshots locally, and Git ignores those outputs. Operational guides, test reports, content authorization evidence, and the [Cloudflare readiness audit](docs/deployment/CLOUDFLARE_WORKERS_READINESS.md) are retained.

## Phase 03B — generated candidates and question reports

Referensi is visible in desktop/mobile navigation. The 26 October expansion has 394 technically validated source-derived questions (240 MCQ, 154 identification). The owner explicitly approved these exact versions for development publication with an automated-validation disclaimer: **24/24 lessons and Detective are available**. No scientific expert review is claimed; the development authorization is rejected in production. Generation/import never create new publication approvals. See [activation and actual coverage](docs/phase-03b/AUTOMATED_QUIZ_ACTIVATION.md) and [content workflow](content/README.md) for commands and guarded review/quarantine.

Migration QuestionFeedback1792915200000 adds question provenance/quarantine metadata and one question_feedback table. Reports are available only after feedback is visible, require an owned submitted attempt or signed post-answer guest receipt, and never change answers, scores or completion. Mutations retain CSRF/Origin validation and reports are limited to five per IP/endpoint/minute in the existing process-local limiter. Public report reads/admin changes do not exist. Internal CLI review requires privileged local database access and an accountable operator; it refuses production configuration. No admin dashboard or fake reviewer account was added.

Phase 03B reports: [implementation](docs/phase-03b/IMPLEMENTATION_REPORT.md), [tests](docs/phase-03b/TEST_REPORT.md), [generation audit](docs/phase-03b/QUESTION_GENERATION_AUDIT.md), [validation](docs/phase-03b/CONTENT_VALIDATION_REPORT.md), [checklist](docs/phase-03b/MANUAL_TEST_CHECKLIST.md). Stop at Phase 03B; no Phase 04 or production operation.

NestJS 11, TypeORM, PostgreSQL (Neon), REST. Node 22+ recommended. The current Git root is the parent TajwidLens workspace, containing `api/`, `web/` and `shared/`. No production deployment was performed.

## Run

1. `npm ci`
2. Copy `.env.example` to `.env`; fill `DATABASE_URL`, frontend/API URLs and provider credentials.
3. Run `npm run migration:run` with a migration-role database URL. Review target first; migrations never run at startup.
4. Restore the runtime-role URL, then `npm run build` and `npm start`.
5. Set `NEXT_PUBLIC_API_URL` in `web/.env.local` to the API origin and rebuild the static frontend.

Keep `api/` and `shared/` as siblings in the backend deployment artifact: learning metadata is loaded from `shared/lesson-catalog.json`. Install/build within `api/`; start with its working directory. The frontend imports the same catalogue at build time and still exports static files. Lesson IDs are immutable progress references; changing display order never renames IDs.

Use Neon PostgreSQL, with verified TLS. Both pooled runtime and direct migration connection URLs are supported; prefer a direct connection for migration jobs. URL SSL flags are stripped so they cannot disable certificate validation. No `synchronize`, no destructive rollback. Schema uses `gen_random_uuid()` (modern PostgreSQL).

Production: use HTTPS frontend/API subdomains under one site, e.g. `app.example.com` / `api.example.com`, with `COOKIE_SAME_SITE=lax`. Unrelated GitHub Pages/API domains require `COOKIE_SAME_SITE=none` and remain subject to browser third-party cookie blocking. Prefer custom domains before launch. CORS permits exactly the configured frontend origin. `FRONTEND_URL` may include a GitHub Pages repository base path.

The frontend repository currently deploys to GitHub Pages; no Cloudflare deployment configuration was found or changed. Cloudflare Pages can serve the existing `web/out` output, with the API hosted separately. The Node API is not a Cloudflare Pages Function.

Google Cloud: configure a Web application OAuth client with exact redirect URI `API_URL/api/v1/auth/google/callback`. Supply `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. The provider identity is validated server-side, including audience/issuer/signature/expiry through Google's library and nonce in application code. Email collisions require the existing sign-in method, then explicit authenticated linking from profile; email-only automatic linking is not allowed.

The UI opens `GET /api/v1/auth/google/start` directly in a no-opener window/tab on the user's click, with a same-tab fallback if popups are unavailable. No cross-origin fetch must finish before launch. Return focus or “Periksa status login” refreshes the original page's session. The POST JSON start endpoint remains supported. Embedded browsers may require the same-tab fallback or a normal Chrome/Edge window; never bypass Google's browser restrictions. Reaching Google's sign-in screen does not prove completed consent or a real application session.

OAuth binding cookies are per attempt/state, so a popup and same-tab fallback cannot overwrite one another. Each callback clears only its own HttpOnly binding cookie. After updating from the old fixed-cookie implementation, close old Google windows and start again. Callback failures return only allowlisted reason codes (session/code/account collision/configuration/connectivity/identity/cancellation); UI messages are fixed, and logs never include raw provider responses. An existing email/password account is not automatically linked to a Google identity, even when email matches; use the existing login method. Do not delete/merge accounts to bypass this protection.

SMTP is deferred and optional for startup, Google and existing verified email/password accounts. Leave SMTP fields empty. For local registration testing, explicitly set `NODE_ENV=development` (or `test`) and `AUTH_ALLOW_UNVERIFIED_EMAIL=true`. This permits registration/login without sending email; `emailVerifiedAt` stays null. Any other environment refuses this flag at startup. Without the flag or SMTP, public email registration returns 503; Google remains available. Verification/resend/recovery requiring email are deferred and report 503 without claiming delivery. Existing valid reset/verification tokens remain usable.

`GET /api/v1/auth/status` reports Google, registration and email delivery capabilities without credentials. The frontend must set `NEXT_PUBLIC_API_URL` in `web/.env.local` before starting development or building; it is a public origin (no `/api/v1` suffix). Restart development servers after environment changes. GitHub Pages builds read the repository variable `NEXT_PUBLIC_API_URL`; set a real HTTPS API origin before deploying. No production variable or deployment was changed.

When email delivery is intentionally enabled later, the existing SMTP transport uses verified TLS. SMTP delivery and database commit are not atomic: rare commit failure after send can produce an unusable link. The test mailer only exists in tests and never sends real mail.

## API and security

OpenAPI UI: `/api/docs`, JSON: `/api/docs-json`. Request DTOs, account/message responses and error statuses are documented. Mutating calls require `Origin: FRONTEND_URL origin`, `Content-Type: application/json`, and `X-TajwidLens-CSRF: 1`, plus credentials. No wildcard origins. The custom header requires a preflight; the server also checks origin independently of CORS.

Sessions are random 256-bit opaque secrets, stored only as SHA-256 hashes. Production cookies are Secure, HttpOnly, host-only (`__Host-`), and expire in seven days; the database enforces expiry. Login rotates the current browser session. Logout revokes it, reset revokes all sessions. Other browser sessions remain valid until reset/expiry. Password login requires verified email except for the explicit development/test flag. Public Quran/learning routes never require an account.

`/` waits for the client session check and goes to `/login/` or `/dashboard/`. The former homepage is preserved at `/home/`; guest entry points there directly and needs no fake account or localStorage authorization. Public deep links keep their URLs. Auth pages use `(auth)/layout.tsx`, application pages use `(app)/layout.tsx`; both share one provider. Email/password and Google sign-in default to `/dashboard/`, preserving a safe explicit return URL from the originating page. Profile editing remains available from the navbar. Logout returns to login. `RequireAccount` and allowlisted return URLs are available for private pages; backend SessionGuard remains the authority.

Password hashing: Argon2id, 19 MiB memory, two iterations, one lane. Passwords 12–128 characters. Email normalization: trim/lowercase, unique database constraint. Tokens are random, hashed, expiring, single use, consumed in a transaction with a user-row lock. Verification TTL 24 hours; password reset 30 minutes. Reset links use URL fragments to avoid server query logs; frontend removes the fragment after reading it.

Rate limits: 20 requests per endpoint/IP/minute, in memory. Run one replica until shared limiter storage is configured. Proxy trust is disabled deliberately: behind a reverse proxy clients share its IP limit until a reviewed trust policy is added. Do not blindly trust forwarded headers. Schedule deletion of expired rows (`sessions`, `auth_tokens`, `oauth_attempts`) operationally; expired rows never authorize access.

Use a runtime database role with SELECT/INSERT/UPDATE/DELETE on these tables, without DDL or role management; use a separate migration owner. Avoid logging SQL, cookies, authorization codes, body fields or email URLs at your ingress. Application error responses omit database/stack details. Health is liveness, not readiness.

## Learning progress and assessment (Phase 03)

Authenticated reads remain `GET /api/v1/learning/dashboard`, `GET /api/v1/learning/progress` and `GET /api/v1/learning/progress/:lessonId`. `PUT .../:lessonId/start` saves reading activity with an empty JSON body and existing CSRF/Origin headers. **PUT .../:lessonId/complete now returns 403.** Only passing a server-evaluated seven-question Lesson Quiz grants completion. No client userId, score or pass flag is accepted.

Existing completion keeps its original timestamp and gains LEGACY_SELF_REPORTED provenance; the public state is AWAITING_QUIZ. Dashboard counts QUIZ_VERIFIED alone, exposes legacy history separately and includes optional unresolved-concept count. Reopening never removes legacy history or verified completion. Six of seven correct answers passes; five fails. Attempt/option order and draft choices persist for 24 hours. Repeated/concurrent submission returns the original result, with answers, grade, progress and reviews in one transaction.

New static UI routes: /quiz/, public /detective/ and private /reviews/. Detective guests receive feedback without persistent user/session/attempt/review/progress writes. Signed challenges last ten minutes. Authenticated mistakes can be practiced through optional Replay; practice never changes original quiz scores or lesson completion. Existing Taman/Samudra/Zamrud/Senja themes and auth behavior are retained.

**Actual bank and reviewer registry are empty: 0/24 lesson quizzes ready; Detective unavailable.** No synthetic questions are imported into the application database. See [question audit](docs/phase-03/QUESTION_BANK_AUDIT.md) and [content workflow](content/README.md). A qualified human must approve each version with review evidence before publication; automated checks only prove technical integrity.

Commands from api:

- `npm run questions:check` — validate source bank/provenance/references and report real counts.
- `npm run questions:import` — explicitly import unchanged immutable versions; never auto-publish or delete.
- `npm test` — isolated pg-mem API/engine/progress/auth tests. Optional TEST_DATABASE_URL test skips without a separate _test database.
- `$env:E2E='true'; node -r ts-node/register --test test/auth.test.ts` — auth browser regression, ports 3101/4101, after web/out is built.
- `npm run verify:assessment -- --approved-development` — real PostgreSQL migration/legacy/constraints/concurrency/rollback tests only in a guarded run-owned temporary schema on the approved development target.
- Add `--browser` for Phase 03 browser journeys on 3103/4103; `--browser-only` runs migration setup and browser journeys for local test iteration.
- `--apply-development` explicitly applies only the expected Phase 03 migration to the approved application development schema after verification. It refuses production configuration and unexpected migration history. Do not use this flag on production.

The old verify-learning-neon script forwards to the current assessment verifier; manual completion tests/harness were replaced. Neither verifier uses production. Temporary schema cleanup validates its generated name and captured PostgreSQL OID before dropping only that schema.

Review the target before migration. Migration never runs at application startup and synchronize stays false. Phase 03 rollback takes an exclusive lock and refuses any assessment or verified-progress data. Use a reviewed forward migration for populated deployments. Do not apply production migrations without explicit approval.

Backend artifacts must include the trusted content/reviewers.json and unchanged reader index/payload assets, or configure QUIZ_CORPUS_INDEX and QUIZ_CORPUS_DIRECTORY. Identification offsets use the reader's KFGQPC edition, never the separate Tanzil file. Production Detective requires QUIZ_CHALLENGE_SECRET (stable random value, at least 32 bytes, shared between instances); without it practice is unavailable. Development uses an ephemeral key. Corpus assets are read-only data.

Static hosting/test servers must serve exported Next .txt navigation payloads as text/plain (or RSC content type); binary MIME forces document reloads. Frontend remains a static export suitable for the existing host or Cloudflare Pages; deployment is not verified here.

Phase 03 reports: [implementation](docs/phase-03/IMPLEMENTATION_REPORT.md), [tests](docs/phase-03/TEST_REPORT.md), [manual checklist](docs/phase-03/MANUAL_TEST_CHECKLIST.md), [question bank](docs/phase-03/QUESTION_BANK_AUDIT.md). Phase 02 reports remain historical evidence.

## Authentication tests and operations

Google sign-in now finishes through `/auth-complete/`, handing the verified session back to the originating login/register window before closing the popup. Same-tab continuation remains available. A password-account collision can be resolved explicitly from profile with **Hubungkan Google**: current session + current password + matching Google email; there is no automatic email-only merge or schema change. See account experience (Git archive: 321ec250).

`node scripts/check-profile-layout.cjs` uses an explicit visual-only account fixture to check the profile/navbar at six widths, long names, themes, focus and reduced motion. It does not create or edit live accounts. `AUTH_LAYOUT_FIXTURE=1 node scripts/check-auth-layout.cjs` similarly isolates login/register screenshots from API availability.

`npm test`: HTTP integration with pg-mem, real Argon2, real migrations, mock mailer and mock Google identity. Browser test skips unless `E2E=true`.

Build frontend first with `NEXT_PUBLIC_API_URL=http://localhost:4000`, then run `E2E=true npm test` (PowerShell: `$env:E2E='true'; npm test`). Edge must be installed; the auth harness starts static frontend on 3101 and an isolated API on 4101, intercepting browser calls to the build-time localhost:4000 origin. It does not stop or test against the live development API. Current regression screenshots go to `docs/phase-02/`; historical Phase 01 evidence is preserved.

`node scripts/check-auth-config.cjs` performs a read-only connection/schema probe without printing credentials. `node scripts/smoke-auth.cjs` starts the built API on 4102 with SMTP disabled, verifies health/capabilities/401/deferred recovery, then stops only that child process. It uses the configured development Neon database without creating users or migrations.

`node scripts/check-auth-layout.cjs` checks the already-running local frontend (3000) and API (4000) using headless Edge: official logo, exact hadith, responsive login/register at six widths, active controls and reduced motion. It writes visual evidence to `docs/phase-01/*-redesign-*.png` and never submits forms or changes the database.

In development, a before-hydration bootstrap removes only the app's exact service worker and rebuildable `tajwidlens-pwa-*` caches so old PWA bundles cannot shadow Next dev updates. It does not clear account data, preferences or unrelated workers. Production PWA caching remains enabled. Illustration provenance and generation prompt: design revision (Git archive: 321ec250).

Optional real PostgreSQL test: set `TEST_DATABASE_URL` to an isolated DB named with `_test` suffix, different from `DATABASE_URL`. It runs forward migrations and a rolled-back persistence check. Do not provide production credentials. This does not replace live Neon, multi-connection race or provider tests.

Results and outstanding work: [implementation](docs/phase-01/IMPLEMENTATION_REPORT.md), [tests](docs/phase-01/TEST_REPORT.md), [manual checklist](docs/phase-01/MANUAL_TEST_CHECKLIST.md).

# TajwidLens API — Phase 01 + Phase 02

NestJS 11, TypeORM, PostgreSQL (Neon), REST. Node 22+ recommended. The current Git root is the parent TajwidLens workspace, containing `api/`, `web/` and `shared/`. No production deployment was performed for Phase 02.

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

## Learning progress (Phase 02)

Authenticated endpoints: `GET /api/v1/learning/dashboard`, `GET /api/v1/learning/progress`, `GET /api/v1/learning/progress/:lessonId`, and `PUT /api/v1/learning/progress/:lessonId/start` or `/complete`. PUT uses an empty JSON body and the existing CSRF/Origin headers. Identity comes only from the session. Swagger describes the response DTOs. No reset/delete or client-supplied userId endpoint exists.

`user_lesson_progress` stores one unique row per user/lesson. Missing rows mean NOT_STARTED. Opening a lesson starts it; only **Tandai Selesai** completes it. Atomic PostgreSQL upsert preserves COMPLETED and the first completion timestamp under retries/concurrency. Dashboard totals derive from the current 24-entry shared catalogue. No reading history, guest progress, content copy or analytics table is added.

Dashboard also returns the current 24 lesson ID/status pairs from the same owned query for its map/topic coverage. The library reuses one progress-list response for card and learning-path markers. The optional **Taman** theme adds white/leaf green/mint/soft yellow. Session checks no longer wait for capabilities; verification joins session/user in one query, profile save uses its confirmed response, and logout navigates without a document reload. Google receipt and verified-close acknowledgements are separate; same-tab fallback is 1.2 seconds, with a bounded recovery watchdog after receipt. See [experience revision](docs/phase-02/EXPERIENCE_REVISION.md) for actual verification and limits. Quiz-based completion is deferred.

Review the target before `npm run migration:run`. Phase 02 is additive and `synchronize` remains false. Rollback takes an exclusive lock and refuses a populated progress table; retain TypeORM's default migration transaction and use a reviewed forward migration for populated tables. The approved local Neon development database has received this migration; production has not.

After building `web/out`, run browser files serially: `E2E=true node -r ts-node/register --test --test-concurrency=1 test/*.test.ts` (PowerShell: `$env:E2E='true'; node -r ts-node/register --test --test-concurrency=1 test/*.test.ts`). Phase 01 browser regression uses ports 3101/4101, Phase 02 uses 3102/4102. Isolated tests use pg-mem and never the configured development database. Database concurrency cases still issue parallel writes within the suite. Screenshot evidence goes to `docs/phase-02/`.

Static hosting/test servers must serve the exported Next `.txt` navigation payloads as `text/plain` (or the framework's RSC content type). Serving them as generic binary forces full-document fallbacks; both browser harnesses now use the correct MIME.

Only against an explicitly approved development target: `node -r ts-node/register scripts/verify-learning-neon.ts --approved-development`. This refuses production configuration and pending migrations, verifies migration round trips in a temporary transaction-rolled-back schema, checks concurrent writes through two connections, and runs the learning browser suite on unique owned fixtures with exact-ID/email cleanup. It does not perform Google consent or send mail. Do not run simultaneously with the isolated learning browser suite because they share test ports.

Phase 02 reports: [implementation](docs/phase-02/IMPLEMENTATION_REPORT.md), [tests](docs/phase-02/TEST_REPORT.md), [manual checklist](docs/phase-02/MANUAL_TEST_CHECKLIST.md).

## Authentication tests and operations

Google sign-in now finishes through `/auth-complete/`, handing the verified session back to the originating login/register window before closing the popup. Same-tab continuation remains available. A password-account collision can be resolved explicitly from profile with **Hubungkan Google**: current session + current password + matching Google email; there is no automatic email-only merge or schema change. See [account experience](docs/phase-01/ACCOUNT_EXPERIENCE.md).

`node scripts/check-profile-layout.cjs` uses an explicit visual-only account fixture to check the profile/navbar at six widths, long names, themes, focus and reduced motion. It does not create or edit live accounts. `AUTH_LAYOUT_FIXTURE=1 node scripts/check-auth-layout.cjs` similarly isolates login/register screenshots from API availability.

`npm test`: HTTP integration with pg-mem, real Argon2, real migrations, mock mailer and mock Google identity. Browser test skips unless `E2E=true`.

Build frontend first with `NEXT_PUBLIC_API_URL=http://localhost:4000`, then run `E2E=true npm test` (PowerShell: `$env:E2E='true'; npm test`). Edge must be installed; the auth harness starts static frontend on 3101 and an isolated API on 4101, intercepting browser calls to the build-time localhost:4000 origin. It does not stop or test against the live development API. Current regression screenshots go to `docs/phase-02/`; historical Phase 01 evidence is preserved.

`node scripts/check-auth-config.cjs` performs a read-only connection/schema probe without printing credentials. `node scripts/smoke-auth.cjs` starts the built API on 4102 with SMTP disabled, verifies health/capabilities/401/deferred recovery, then stops only that child process. It uses the configured development Neon database without creating users or migrations.

`node scripts/check-auth-layout.cjs` checks the already-running local frontend (3000) and API (4000) using headless Edge: official logo, exact hadith, responsive login/register at six widths, active controls and reduced motion. It writes visual evidence to `docs/phase-01/*-redesign-*.png` and never submits forms or changes the database.

In development, a before-hydration bootstrap removes only the app's exact service worker and rebuildable `tajwidlens-pwa-*` caches so old PWA bundles cannot shadow Next dev updates. It does not clear account data, preferences or unrelated workers. Production PWA caching remains enabled. Illustration provenance and generation prompt: [design revision](docs/phase-01/DESIGN_REVISION.md).

Optional real PostgreSQL test: set `TEST_DATABASE_URL` to an isolated DB named with `_test` suffix, different from `DATABASE_URL`. It runs forward migrations and a rolled-back persistence check. Do not provide production credentials. This does not replace live Neon, multi-connection race or provider tests.

Results and outstanding work: [implementation](docs/phase-01/IMPLEMENTATION_REPORT.md), [tests](docs/phase-01/TEST_REPORT.md), [manual checklist](docs/phase-01/MANUAL_TEST_CHECKLIST.md).

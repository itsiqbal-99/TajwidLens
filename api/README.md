# TajwidLens API — Phase 01

NestJS 11, TypeORM, PostgreSQL (Neon), REST. Node 22+ recommended. This directory is an independent Git repository; no remote or deployment has been created.

## Run

1. `npm ci`
2. Copy `.env.example` to `.env`; fill `DATABASE_URL`, frontend/API URLs and provider credentials.
3. Run `npm run migration:run` with a migration-role database URL. Review target first; migrations never run at startup.
4. Restore the runtime-role URL, then `npm run build` and `npm start`.
5. Set `NEXT_PUBLIC_API_URL` in `web/.env.local` to the API origin and rebuild the static frontend.

Use Neon PostgreSQL, with verified TLS. Both pooled runtime and direct migration connection URLs are supported; prefer a direct connection for migration jobs. URL SSL flags are stripped so they cannot disable certificate validation. No `synchronize`, no destructive rollback. Schema uses `gen_random_uuid()` (modern PostgreSQL).

Production: use HTTPS frontend/API subdomains under one site, e.g. `app.example.com` / `api.example.com`, with `COOKIE_SAME_SITE=lax`. Unrelated GitHub Pages/API domains require `COOKIE_SAME_SITE=none` and remain subject to browser third-party cookie blocking. Prefer custom domains before launch. CORS permits exactly the configured frontend origin. `FRONTEND_URL` may include a GitHub Pages repository base path.

The frontend repository currently deploys to GitHub Pages; no Cloudflare deployment configuration was found or changed. Cloudflare Pages can serve the existing `web/out` output, with the API hosted separately. The Node API is not a Cloudflare Pages Function.

Google Cloud: configure a Web application OAuth client with exact redirect URI `API_URL/api/v1/auth/google/callback`. Supply `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. The provider identity is validated server-side, including audience/issuer/signature/expiry through Google's library and nonce in application code. Email collisions require the existing sign-in method; linking accounts is intentionally not provided.

SMTP: configure all `SMTP_*` fields and a verified sender. Port 465 uses implicit TLS; other ports require STARTTLS and certificate validation. No development email sink is exposed in production. Missing provider returns 503 before account lookup. Failed sends return 503 and roll back token/account transaction. SMTP delivery and database commit are not atomic: rare commit failure after send can produce an unusable link; retry registration/resend. Test mailer exists only inside tests.

## API and security

OpenAPI UI: `/api/docs`, JSON: `/api/docs-json`. Request DTOs, account/message responses and error statuses are documented. Mutating calls require `Origin: FRONTEND_URL origin`, `Content-Type: application/json`, and `X-TajwidLens-CSRF: 1`, plus credentials. No wildcard origins. The custom header requires a preflight; the server also checks origin independently of CORS.

Sessions are random 256-bit opaque secrets, stored only as SHA-256 hashes. Production cookies are Secure, HttpOnly, host-only (`__Host-`), and expire in seven days; the database enforces expiry. Login rotates the current browser session. Logout revokes it, reset revokes all sessions. Other browser sessions remain valid until reset/expiry. Email verification does not block access to learning or profile, and is represented explicitly in the profile.

Password hashing: Argon2id, 19 MiB memory, two iterations, one lane. Passwords 12–128 characters. Email normalization: trim/lowercase, unique database constraint. Tokens are random, hashed, expiring, single use, consumed in a transaction with a user-row lock. Verification TTL 24 hours; password reset 30 minutes. Reset links use URL fragments to avoid server query logs; frontend removes the fragment after reading it.

Rate limits: 20 requests per endpoint/IP/minute, in memory. Run one replica until shared limiter storage is configured. Proxy trust is disabled deliberately: behind a reverse proxy clients share its IP limit until a reviewed trust policy is added. Do not blindly trust forwarded headers. Schedule deletion of expired rows (`sessions`, `auth_tokens`, `oauth_attempts`) operationally; expired rows never authorize access.

Use a runtime database role with SELECT/INSERT/UPDATE/DELETE on these tables, without DDL or role management; use a separate migration owner. Avoid logging SQL, cookies, authorization codes, body fields or email URLs at your ingress. Application error responses omit database/stack details. Health is liveness, not readiness.

## Tests

`npm test`: HTTP integration with pg-mem, real Argon2, real migrations, mock mailer and mock Google identity. Browser test skips unless `E2E=true`.

Build frontend first with `NEXT_PUBLIC_API_URL=http://localhost:4000`, then run `E2E=true npm test` (PowerShell: `$env:E2E='true'; npm test`). Edge must be installed; the harness starts static frontend on 3101 and API on 4000 and closes both. Screenshots go to `docs/phase-01/`.

Optional real PostgreSQL test: set `TEST_DATABASE_URL` to an isolated DB named with `_test` suffix, different from `DATABASE_URL`. It runs forward migrations and a rolled-back persistence check. Do not provide production credentials. This does not replace live Neon, multi-connection race or provider tests.

Results and outstanding work: [implementation](docs/phase-01/IMPLEMENTATION_REPORT.md), [tests](docs/phase-01/TEST_REPORT.md), [manual checklist](docs/phase-01/MANUAL_TEST_CHECKLIST.md).

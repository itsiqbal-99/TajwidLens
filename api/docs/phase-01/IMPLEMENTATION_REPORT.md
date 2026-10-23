# Phase 01 implementation — 23 October 2026

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

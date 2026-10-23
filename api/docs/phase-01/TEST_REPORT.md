# Phase 01 test report — 23 October 2026

## Final results

| Check | Result | Evidence / limits |
|---|---|---|
| API `npm run build` | PASS | TypeScript compilation |
| API `npm run typecheck` | PASS | Strict TypeScript |
| API `E2E=true npm test` | PASS | 14 reported tests: 13 pass, 1 skipped, 0 failures |
| Web `npm test` | PASS | 10 tests in 2 files |
| Web `npm run lint` | PASS | No errors/warnings |
| Web `npm run typecheck` | PASS | Includes new account components/routes |
| Web `npm run build` | PASS | Next.js 16.4.2, 38 static pages, with localhost API URL for testing |
| Corpus generation/check | PASS | 114 payload hashes, 6,236 ayahs, 143,049 annotations; expected four rejected ayahs unchanged |
| API dependency install/audit | PASS | Zero advisories after Nodemailer/Swagger/YAML updates |
| Web `npm audit --omit=dev --json` | PASS | Zero production dependency advisories |
| Full web dependency audit | KNOWN RISK | 8 remaining development-tool advisories: 1 moderate, 5 high, 2 critical. Vitest/mocker/tinypool and ESLint glob/braces chain. Broad toolchain migration deferred; do not expose development test servers. |
| API standalone ESLint | NOT RUN | No backend ESLint configuration added; strict typecheck/build and integration tests used |
| Live PostgreSQL test | SKIPPED | `TEST_DATABASE_URL` absent |
| Live Neon TLS/migration | NOT VERIFIED | No Neon credentials supplied |
| Live Google OAuth | NOT VERIFIED | No Google application credentials supplied |
| Live SMTP delivery | NOT VERIFIED | No SMTP credentials supplied |

## Coverage actually executed

API tests use Nest HTTP controllers, validation, CORS/CSRF middleware, guards, real Argon2, TypeORM repositories and the actual migration on pg-mem. Coverage includes normalized registration, generic duplicate response, invalid input, hashing, correct/wrong password, verification expiry/reuse, reset reuse/revocation, old password rejection, session expiry/logout, unauthorized access, profile persistence and protected-field rejection, OAuth state/browser binding/replay, collision refusal, successful Google identity double, nonce/unverified-email rejection, missing mail provider and HTTP 429.

Playwright used Edge headless against a local static export and the same test API with mock mailer/Google. Executed registration, email verification via captured test-mail link, Google entry URL, wrong/correct login, edit/save/reload profile, mobile overflow assertion, logout, forgot/reset and guest explore access. Screenshots inspected: `profile-mobile.png` (390px), `login-desktop.png` (1440px), `login-dark.png`. Guest browser smoke verifies reachability; it does not replace exhaustive reader/audio interaction regression.

The PostgreSQL emulator validates schema/application wiring, but does not establish real PostgreSQL TLS behavior, concurrency/locking, durability across process restarts or Neon pooling. A separate opt-in real PostgreSQL test runs forward migrations and a rolled-back persistence check on a dedicated `_test` database. It was not executed.

## Execution issues resolved

- Initial npm/HTTP attempts failed under sandbox DNS/loopback restrictions; permitted executions passed.
- Initial frontend lint found a synchronous effect update; fixed via queued initial refresh.
- Initial static build emitted all pages but exited with a Next.js security warning. Next was patched from 16.4.0 to 16.4.2; final build exited 0.
- Browser harness first depended on an unavailable dev server and later hit a port conflict. It now serves the static export itself on dedicated port 3101, API on 4000.
- Guest smoke selector matched two existing `main` elements; scoped it to existing `#main-content`. Reader markup was not modified.

## Reproduce

1. In web, set `NEXT_PUBLIC_API_URL=http://localhost:4000`; run `npm run build`.
2. In api, run `$env:E2E='true'; npm test` in PowerShell. Edge must be installed; ports 3101/4000 must be free.
3. For nonbrowser checks, unset `E2E` and run `npm test`.
4. For live database checks, supply a distinct `TEST_DATABASE_URL` whose database name ends `_test`. Never use production.

No production migrations, configuration changes, deployment or outbound live emails were performed.

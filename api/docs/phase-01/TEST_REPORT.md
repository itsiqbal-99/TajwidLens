# Phase 01 test update — 24 October 2026 (Asia/Jakarta)

## Latest revision — manual registration feedback

- New confirmation state replaces the submitted form, resets native controls, focuses an accessible status panel and offers login / register-another actions. API errors preserve input. Backend anti-enumeration and email verification policy unchanged.
- UI fixture PASS at 1440/768/390/320: failed request preserves email/password, accepted response hides the form, status gets focus, safe next link retained, register-another opens empty controls with password hidden, exactly two deliberate requests (no automatic repeated submission). Screenshots inspected.
- Production export/typecheck and web lint PASS (41 pages). Final isolated API/browser acceptance: 18 PASS / 1 SKIP / 0 failed, including confirmation and empty retry form for mail-verification mode, login continuation for development mode and existing Google/profile/recovery regressions. Real PostgreSQL integration remains skipped.
- No live account created; SMTP delivery itself is not verified by this UI change.

## Latest revision — account experience and popup handoff

- Web static export 41 pages PASS; API build PASS; 25 frontend unit tests PASS, including strict completion-message destination validation; frontend lint PASS.
- Final-export API/browser suite: 18 PASS / 1 SKIP / 0 failed. Popup tests now assert that the **original page** receives new-user profile onboarding / returning-user home navigation and that each popup closes automatically, without pressing the manual status button. Profile edit, password-confirmed Google linking, normal password login/recovery/logout, guest entry and security regressions also pass.
- A final repeat with the same-tab Google flow added also passes 18/1/0: without an originating listener, completion falls back to authenticated home in the same tab. No live identity or account was used.
- Linking checks cover unauthenticated/CSRF/extra-body rejection, wrong password, mismatched email, missing live session, expired intent, conflicting Google subject, replay, unchanged user count/ID/profile/password and subsequent ordinary Google/password login.
- Login/register visual fixture: sharp wallpaper covers the full panel, no blur, .94 opacity; six widths PASS with exact logo/hadith, no overflow, pointer reset and reduced motion.
- Profile/navbar visual fixture: six widths 1440/1280/1024/768/390/320 PASS, long nickname/email, signed-in greeting, guest sign-in link, focus, dark theme and reduced motion. No live user was created/edited for screenshots.
- Source and screenshots: Account experience (Git archive: 321ec250). The user reports live Google signup/login succeeds; revised real Google consent → main-window handoff still requires the user's fresh retry. Real PostgreSQL integration remains skipped; older reports below are historical.

## Latest revision — Architectural Light

- Web typecheck and lint PASS; 24/24 unit tests PASS; production static export PASS (40 pages).
- Isolated pg-mem/API/browser acceptance: 17 PASS / 1 SKIP / 0 failed. Includes full UI registration, login, profile, recovery, logout, guest access, Google popup/fallback and existing manual-account collision policy. Real PostgreSQL test remains skipped.
- Actual port4000 refused connections during visual QA. Fixture-mode screenshots are explicitly not proof of live Google/API availability. No live user was registered or changed.
- Final login/register visual fixture checks PASS at 1440/1024/850/768/390/320px, including pointer depth/reset, reduced motion, official logo/exact hadith, enabled controls and password visibility. All four screenshots inspected; final export rebuilt with illustration crop/edge blending.
- Design scope, provenance and authentication boundary: Architectural Light (Git archive: 321ec250). Prior design reports remain historical.

## Latest revision — callback isolation / error diagnosis

| Check | Evidence |
|---|---|
| Reproduce before fix | Two GET starts in a Supertest browser cookie jar; callback one redirected to generic failure instead of home. Test failed before implementation |
| Parallel binding / replay | Both callbacks now complete independently; replay fails with google_session |
| Missing/expired binding | Specific recovery reason; no identity-validation bypass |
| Existing password account | google_account_exists, original googleSubject stays null; no automatic linking |
| Provider/certificate connectivity | Real token endpoint returned invalid_grant for intentionally invalid diagnostic code; verification certificates fetched successfully |
| Actual API/Neon negative exchange | Two diagnostic starts yield independent cookies; both callbacks reach Google and return google_code for invalid codes. No user account/session created |
| Safe diagnostics | Fixed stage/category only; tests assert secrets/codes/tokens/email from fake provider errors never appear in logs |
| Frontend | 24 unit tests PASS; known reasons mapped to fixed text, arbitrary URL input not reflected; rendered session/collision messages pass in browser |
| Final regressions | API build PASS; web lint / production export 40 pages PASS; E2E 17 PASS / 1 SKIP / 0 failed |

The user's previous real failure has no retained safe failure category, so its exact cause is NOT VERIFIED. Complete live account selection → consent → session still requires a fresh user retry. The confirmed cookie defect is fixed, not proof that a password-account collision or another provider error cannot be the user's specific cause. No real account or credential was changed. Old authorization windows need to be closed and restarted after the cookie format change.

## Latest revision — light illustration, Google launch and stale development cache

| Check | Result / boundary |
|---|---|
| Web unit suite | 23 PASS in 6 files, including 4 development-worker isolation cases |
| Web production export / lint | PASS, 40 static pages; API TypeScript build PASS |
| Read-only layout check | PASS login/register at 1440/1024/850/768/390/320px; official logo, loaded WebP, light panel, exact hadith, no overflow, reduced motion and usable controls |
| Popup + callback acceptance | PASS in full API/browser suite: 14 pass / 1 skipped / 0 failed. Both Google entry buttons, new profile confirmation, returning identity, opener isolation, session check and blocked-popup fallback; identity double, not real Google login |
| Actual embedded-browser launch | Google Sign in screen for `tajwidlens` visibly reached through same-tab fallback. No account identifier/password entered; consent and callback/session live NOT VERIFIED |
| Stale browser regression | Old handler was still observed after reload; after before-hydration development-worker cleanup the current handler and fallback became visible, and email controls remained enabled |

Current visual evidence is `login-redesign-desktop.png`, `login-redesign-mobile.png`, `register-redesign-desktop.png`, `register-redesign-mobile.png`. All four were inspected after the final light-panel revision. Generated illustration is an intentional book/lens concept, not a reproduction of Quran text. Test DB concurrency remains skipped because no dedicated test database was supplied; SMTP/production deployment remain deferred/unverified.

An initial popup harness run followed the real redirect to Google with the placeholder test client, so interception was moved to the start response while keeping the actual state/cookie. Only the subsequent passing run is counted. No user accounts or migrations were created during this revision's tests; live launch creates ordinary expiring OAuth attempts only.

## Latest revision — real UI and stale-server regression

- Final user-requested visual revision: official PNG logo and two-side hadith/form layout. `node scripts/check-auth-layout.cjs` PASS on actual frontend for both login/register at 1440/1024/850/768/390/320px. Checks exact Arabic + translation + attribution, RTL/language, image source/load, desktop columns/mobile stacking, no overflow, enabled login/register/Google controls, independent monochrome theme, password reveal and reduced motion. No accounts or database writes in this visual run. All four updated screenshots were inspected. Web typecheck/lint and production static build (40 pages) PASS after revision. The checks below describe the preceding authentication repair; final visual changes do not alter that logic.
- Reproduced the user's actual 404 on port 4000 and confirmed the old running API's Swagger lacked the source route. After replacing the verified process, live `/api/v1/auth/status` returned 200.
- `node scripts/test-live-account-ui.cjs` PASS against actual localhost:3000/4000 and configured Neon: register 202, persisted user with null verification time, login 200, session read 200, refresh/profile, logout 200. This is real development persistence, not pg-mem.
- The same live run intercepted `/auth/status` as 404: email/password stayed enabled and actual password login plus session read still returned 200. The 404 affects capability information, not authentication itself.
- Every temporary account created by these runs was removed. One run's idle database client disconnected; another UI script filled the old SPA form before navigation completed. The probe now uses a short-idle pool and explicitly waits for the login screen. Neither failed run is counted as a pass.
- Web TypeScript/lint PASS, 19 unit tests PASS, static build 40 pages PASS, complete API/browser acceptance 14 PASS / 1 SKIP / 0 FAIL on the redesign. Corpus unchanged: 114 payloads, 6,236 ayahs, 143,049 annotations.
- Current visual evidence: `login-redesign-desktop.png`, `login-redesign-mobile.png`, `register-redesign-desktop.png`, `register-redesign-mobile.png` show the final official-logo/hadith revision. The independent auth palette is checked while the app theme is Zamrud. Other screenshot names below may show preceding iterations.

New script requires the already-running development frontend/API and explicit no-SMTP registration mode. It creates a uniquely named `example.invalid` account, never prints its password and cleans up that exact fixture. It is opt-in and is not part of the normal unit suite.

## Current evidence

| Check | Status | Evidence / limits |
|---|---|---|
| API TypeScript build | TESTED / PASS | `npm run build`; no schema changes |
| API HTTP/auth regression, without browser | TESTED / PASS | 13 pass, 2 skipped, 0 failed (15 reported, parent included); browser and dedicated PostgreSQL opt-in skipped |
| Web unit tests | TESTED / PASS | 19 tests in 5 files, including safe return URLs, API-origin validation, corpus/navigation and payload rejection/retry |
| Web production static build | TESTED / PASS | Next 16.4.2, 40 static pages; localhost API URL inlined for local tests |
| Corpus generation/check | TESTED / PASS | 114 hashes, 6,236 ayahs, 143,049 annotations; same four rejected ayahs |
| Read-only live Neon probe | TESTED / PASS | Verified-TLS connection; users/sessions/auth_tokens/oauth_attempts/migrations exist; `InitialAuth1760000000000` already recorded |
| Live Nest startup without SMTP | TESTED / PASS | Built API on isolated 4102, real configured Neon; health/status, anonymous 401, deferred password recovery 503; child server stopped |
| Live Google consent → validated identity → browser session | NOT VERIFIED | Configured credentials detected, never printed; identity-double tests are not live Google evidence |
| Dedicated real PostgreSQL persistence/concurrency test | NOT VERIFIED / SKIPPED | `TEST_DATABASE_URL` absent; existing app DB was not repurposed as a destructive test fixture |
| SMTP delivery | DEFERRED | Intentionally not configured, no live email claimed sent |
| Production hosting/domain/cookies | NOT VERIFIED | No deploy, production migration or hosted configuration change |

| API + browser acceptance | TESTED / PASS | Final `E2E=true npm test`: 14 pass, 1 skipped, 0 failed; dedicated PostgreSQL test remains skipped |
| Web lint | TESTED / PASS | `npm run lint`, no warnings/errors |
| Browser visual inspection | TESTED / PASS | Login desktop Samudra and mobile Zamrud; register desktop/mobile Zamrud; profile mobile. Screenshots inspected at 1440px and 390px, full-page |

Historical results below are retained as historical evidence only.

Browser acceptance actually exercised: fresh root → login, no main navigation on auth screens, guest entry → home and refresh, authenticated root → home, register/verify/password login, incorrect-password feedback, show/hide password, profile save/reload, logout → login, recovery/reset through the mailer double, annotated Quran rendering, public lessons, Google pending/start/callback with browser-bound cookies and an identity double, new-user nickname confirmation → home, no-SMTP development registration/login preserving unverified state, deferred recovery, unavailable Google, backend outage with working guest entry, keyboard focus, mobile overflow assertion, reduced-motion computed styles, and theme selection.

Inspected screenshot evidence: `login-desktop.png`, `login-mobile.png`, `register-desktop.png`, `register-mobile.png`, `profile-mobile.png`; `login-dark.png` also captures desktop Zamrud. These auth screenshots use the capability-controlled test mailer; they are not evidence of real email delivery. Native labels, visible focus and contrast were reviewed visually; a human screen-reader/device keyboard test remains NOT VERIFIED. No performance trace or quantitative CLS measurement was taken.

The browser run caught a real logout race between profile guard redirection and form redirection. Logout now revokes the cookie then replaces the document at login, clearing provider state in one navigation; restored Back/Forward pages revalidate the session. The subsequent complete browser run passed. Existing public page contents were also compared against their original source after moving into the route group; they match.

The final complete browser run additionally passed actual Back/Forward navigation, native invalid-email rejection and an explicitly delayed Google-start request whose button remained pending/disabled. A subsequent backend check also proves existing unverified sessions are rejected when the development flag is off. Final API build and 14-pass/1-skip browser suite include the final security logic. Local environment files were confirmed Git-ignored, `git diff --check` passed, and Quran payload/generated-content diff was empty.

## Coverage added

Configuration refuses unverified-email testing outside development/test. No-SMTP registration preserves null verification state, handles duplicates generically, permits the explicitly enabled development login, rejects the same user outside that mode, and refuses recovery without delivery. Public capabilities contain booleans only. Google JSON start sets browser binding; invalid callback redirects safely; identity-double callbacks distinguish new and returning users. Existing PKCE/state/nonce/collision/expiry/replay/logout/reset/ownership/CSRF/rate-limit checks remain.

The browser harness uses static frontend 3101 and an isolated pg-mem-backed API 4101. It intercepts the build-time localhost:4000 API origin so the user's running development API is untouched. Google consent is replaced by a documented identity double, while the real browser state cookie, controller callback, session cookie, profile confirmation and redirects execute locally. The mailer double never opens an SMTP connection.

Initial attempts failed because sandbox loopback was denied, then because development port 4000 was occupied. Tests were moved to isolated 4101. An immediate Google-enabled assertion raced capability loading and was replaced with a waiting assertion. An older payload test expected the previous cache policy; it now matches the existing versioned loader without altering it. Startup smoke's initial boot budget was too short on this Windows filesystem; the completed smoke with a larger budget passed. These failed attempts are not counted as successful runs.

## Reproduce current checks

1. `web`: set `NEXT_PUBLIC_API_URL=http://localhost:4000` before build, then `npm run build`, `npm test`, `npm run lint`.
2. `api`: `npm run build`; `$env:E2E='true'; npm test` with Edge and free 3101/4101 ports. Do not rebuild static assets while the browser run is using them.
3. `api`: `node scripts/check-auth-config.cjs` and `node scripts/smoke-auth.cjs` for the configured development Neon. Smoke uses free 4102 and does not create users or run migrations.
4. For separate PostgreSQL mutation tests, provide a dedicated `_test` database via `TEST_DATABASE_URL`; never point that test at the configured application DB.

---

# Historical test report — 23 October 2026

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

# Phase 01 manual acceptance checklist

## Latest revision — sharp wallpaper, navbar/profile and popup completion

- TESTED (isolated browser): new Google user confirms their name on the original page, not the popup; the popup closes automatically. Returning Google user reaches home on the original page, popup closes.
- TESTED: direct/same-tab Google sign-in still reaches authenticated home when no original listener exists.
- TESTED: profile save/persistence, password-confirmed Google linking, wrong password, wrong Google email, existing linked subject, missing/expired session/intent, replay, and password login after linking. No automatic email-only account merge.
- TESTED (visual fixtures): full-panel sharp image, visible exact hadith, signed-in Welcome/name chip, guest sign-in entry, illustrated profile, six viewport widths, long names, keyboard focus, dark theme and reduced motion.
- USER REPORTED: real Google signup/login now succeeds. USER RETRY: close older Google windows, refresh the original login/register page, start once, choose your Google account, and confirm the original page changes while the popup closes. Never share the callback URL/code/token.
- NOT VERIFIED: real PostgreSQL integration test and a fresh real-Google popup handoff after this revision. No deployment/migration/live-account merge was performed.

## Latest revision — failure after Google account selection

- TESTED: two simultaneous Google starts in one browser, isolated cookies, successful callbacks with identity double, replay and expiration rejection.
- TESTED: existing password email collision is explained and does not modify/link that account.
- TESTED: safe provider error categories and frontend fixed copy, including rendered session/collision errors; no raw secret/code/token/email logging.
- TESTED: actual API/Neon binding with two diagnostic invalid codes reaches the real Google endpoint and yields expected google_code.
- NOT VERIFIED: exact cause of the user's previous generic failure; complete fresh real Google login/session. Ask whether the selected email was already registered with a password. Never merge accounts or delete the existing account as a workaround.
- USER RETRY: close old TajwidLens Google authorization windows, reopen login and start once. If it fails, report only the new message, never a callback URL, authorization code or token.

## Latest revision — illustrated light auth / Google launch

| Check | Evidence | Status |
|---|---|---|
| Light panel, official logo, illustration, exact hadith | Four current screenshots reviewed; six responsive widths | TESTED |
| Smooth motion / reduced motion | 360 ms entrance, 140 ms feedback; animation disabled in reduced motion | TESTED |
| Popup login/register, blocked popup, profile/session | Full browser acceptance with identity double; no locked email form | TESTED (double) |
| Actual Google launch | Sign in screen visibly displayed for tajwidlens through same-tab fallback | TESTED (launch only) |
| Complete real Google login and consent | User must complete their own Google flow | NOT VERIFIED |
| Existing browser runs current development code | Scoped worker/cache cleanup before hydration; 4 isolation tests | TESTED |

Descriptions of the charcoal panel or asynchronous Google POST below are preceding iterations, not the current UI.

## Latest revision — redesigned auth / actual UI

| Check | Evidence | Status |
|---|---|---|
| Actual development API exposes source routes | Old port-4000 process reproduced 404; current process returns status 200 | TESTED |
| Register/login from actual web UI | Real 3000 → 4000 → Neon registration, unverified persistence, login, reload, profile, logout passed | TESTED (browser + real DB) |
| Capability endpoint missing | Forced 404 did not disable email/password or prevent real login/session | TESTED |
| Official logo and two-side auth | Original PNG, exact hadith/translation/source; charcoal panel left, white form right | TESTED; final screenshots reviewed |
| Responsive auth and independent palette | Six widths 320–1440px; full quote follows mobile form, no overflow; no app palette dependency | TESTED by read-only check-auth-layout.cjs |
| Live Google identity and production domain/cookies | Not exercised by these checks | NOT VERIFIED |

Earlier visual descriptions below refer to the previous iteration unless explicitly labeled redesign.

## Update — 24 October 2026 (Asia/Jakarta)

This table supersedes historical provider-availability assumptions below. SMTP is intentionally deferred. Automated checks are identified explicitly and do not imply a human/live-provider pass.

| Check | Current result | Status |
|---|---|---|
| Real Neon connection and recorded migration | Read-only verified-TLS probe passed; existing initial migration recorded | TESTED |
| Actual Nest startup with empty SMTP | Isolated built API connected to Neon; health/status/401/deferred recovery checks passed | TESTED |
| Root/guest/session/logout routing | Edge automated acceptance passed; public deep link and guest refresh preserved, logout race repaired | TESTED (automated) |
| Login/register desktop and mobile visuals | Actual 1440px/390px screenshots inspected; clear hierarchy, no app navigation on auth, no mobile overflow | TESTED (visual) |
| Password reveal, keyboard focus, reduced motion | Edge checks passed; CSS animation disabled under reduced motion | TESTED (automated) |
| Google callback and profile confirmation with identity double | Real local state/callback/session cookies and nickname save passed; not live Google identity | TESTED (automated double) |
| Google unavailable, backend offline, guest fallback, SMTP deferred | Edge capability/outage/development-registration checks passed | TESTED (automated) |
| Dev-only email registration without SMTP | HTTP/service tests pass, email remains unverified; production flag rejected | TESTED |
| Live Google consent, cancellation, code exchange and persistent session | Requires a human Google sign-in; credentials present, not printed | NOT VERIFIED |
| Register exact local callback in Google Cloud | Must be `http://localhost:4000/api/v1/auth/google/callback` | NOT VERIFIED |
| Actual API restart with an existing authenticated account | Read-only startup tested; real-account persistence/relogin not exercised | NOT VERIFIED |
| SMTP verification/resend/forgot delivery | Intentionally disabled; UI/API report unavailability | DEFERRED |
| Production Secure/SameSite cookies across chosen domains | No production deployment | NOT VERIFIED |
| Screen reader and device keyboard | Native labels/focus/announcements implemented; assistive technology requires human check | NOT VERIFIED |
| Exhaustive Quran/audio/swipe matrix on real mobile hardware | Corpus/navigation checks run; full hardware/audio matrix not repeated | NOT VERIFIED |

UI, routing and automated browser acceptance results are recorded in TEST_REPORT.md, together with screenshots actually inspected. Do not infer live Google success from the identity-double flow.

---

## Historical checklist — 23 October 2026

PASS below means the stated visual inspection was performed. Automated equivalents are recorded separately; they do not imply a live-provider manual pass.

| Steps | Expected result | Actual result | Status |
|---|---|---|---|
| Inspect mobile profile screenshot at 390px | Readable controls, no horizontal overflow, visible logout/guest link | Screenshot inspected; Playwright overflow assertion also passed | PASS |
| Inspect desktop login screenshot at 1440px | Existing theme, readable form, Google and recovery links | Screenshot inspected | PASS |
| Inspect dark login screenshot | Readable text, inputs and primary action | Screenshot inspected | PASS |
| Configure staging Neon; run migration with migration role; start API with runtime role | Verified TLS, migration applied once, backend starts | Credentials absent | NOT TESTED |
| Restart API and sign in to an existing account | User/profile persists across restart | Only emulator persistence tested | NOT TESTED |
| Register fresh email through staging UI | Generic acknowledgment; usable verification email arrives | Automated mock-mail equivalent passed; live unavailable | NOT TESTED |
| Register same email again | Same public response; no duplicate user | Automated equivalent passed | NOT TESTED |
| Enter invalid email, short password and blank nickname | Form/API reject invalid values | API invalid-input test passed; full manual form matrix pending | NOT TESTED |
| Login with correct and incorrect password | Session established only for correct password | Browser equivalent passed | NOT TESTED |
| Use Google consent with new account | Verified identity creates one consistent user; profile shown | Live credentials absent | NOT TESTED |
| Use Google matching an email/password account | Existing account not silently linked | Automated collision test passed | NOT TESTED |
| Tamper OAuth state, replay callback, cancel consent | Login refused with safe recoverable message | State/browser/replay tests passed; live cancel pending | NOT TESTED |
| Verify email; reuse and expire link | First valid link succeeds; stale/reused links rejected | Automated equivalents passed | NOT TESTED |
| Request resend verification | Message and usable new link; previous link invalid | Implementation present; live SMTP unavailable | NOT TESTED |
| Forgot password for existing/nonexistent email | Same public response; only eligible account receives mail | Automated generic-response test passed | NOT TESTED |
| Reset password, retry link, use old session/password | Link single use; old sessions/password fail | Automated equivalents passed | NOT TESTED |
| Edit profile, reload, logout and log back in | Updated fields persist; header reflects login state | Browser equivalent passed | NOT TESTED |
| Attempt profile write without cookie or with another ID | 401 or validation error; other user's data unchanged | Unauthorized/protected field tests passed | NOT TESTED |
| Submit write from untrusted origin or without CSRF header | 403 | Automated missing-header test passed; production domains pending | NOT TESTED |
| Repeatedly submit auth endpoint | 429; retry after window | Automated limiter test passed | NOT TESTED |
| Inspect deployed cookie attributes and expiration | Secure, HttpOnly, host-only, intended SameSite; server rejects expired cookie | Local HttpOnly/expiry tested; HTTPS deployment pending | NOT TESTED |
| Test actual frontend/API domains in Safari/Chrome/Firefox | Cookies sent and account works under browser privacy policy | Deployment absent | NOT TESTED |
| Disable API; browse Quran/lessons | Guest access works; account has clear error | Guest browser smoke passed; explicit outage manual test pending | NOT TESTED |
| Read long/overlapping/rejected ayahs, play audio, mobile swipe | Existing reader behavior remains correct | Corpus/unit checks passed; exhaustive manual interaction pending | NOT TESTED |
| Keyboard-only account flow and screen reader | Labels/focus/status/errors usable | Native semantics implemented; assistive technology manual run pending | NOT TESTED |

Release remains blocked until live Neon, Google, SMTP and domain/cookie acceptance are verified.

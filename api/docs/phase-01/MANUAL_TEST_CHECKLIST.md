# Phase 01 manual acceptance checklist

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

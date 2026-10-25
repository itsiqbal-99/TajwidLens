# Phase 02 — dashboard, theme, feedback and auth latency revision

25 October 2026, Asia/Jakarta. Implements the user's Phase 02 review. No quiz or Phase 03 implementation, schema change, production migration or deployment.

## Design reference lock

Primary target: the existing TajwidLens product, with the user's approved **white + leaf green + mint + soft yellow** palette. Refero live research was unavailable (NO_SUBSCRIPTION in this conversation); the bundled color, motion and visual-QA references, the existing application and the user's explicit hierarchy form the reference lock. Direct build within the current design system. No claim of live Refero screen research, generated artwork or AI learning analysis.

| Decision | Source / role | Implementation |
|---|---|---|
| Informative learning overview | User asks for a stronger intelligence-dashboard impression | Three actual status counts, completion ring, linked 24-lesson map, coverage per topic, next action and dated completed lessons |
| White canvas, leaf-green primary | User selected palette; Refero color guidance | New optional Taman theme; existing themes/default preserved |
| Mint surfaces, yellow for in-progress | User palette; semantic roles | Subtle accent surfaces, readable dark text, status icon/text alongside color |
| Interactive module map as signature | User asks to emphasize the dashboard | Actual saved lesson states, numbered links, hover/focus and a status legend |
| Feedback at the action | User asks for motion on saves/loading | Shared pending spinner and short drawn-check success feedback, no artificial minimum delay |
| Reduced motion | Existing accessibility contract and motion craft | Stops spinner/entrance/shimmer/draw transitions; status text remains available |

No fabricated study time, streaks, mastery scores, predictive analytics or extra tracking tables. The learning ring and topic coverage summarize current saved statuses; they do not assess understanding.

## Functional changes

- The existing dashboard query also returns 24 lightweight lesson ID/status pairs from its already-loaded owned records. No extra database query or separate catalogue copy. Shared contract, Swagger DTO and frontend decoder updated together. Missing/duplicate/inconsistent state maps produce an error, never invented zero progress.
- The library makes one authenticated progress-list request and reuses it for both the existing learning path and lesson cards. Completed cards have a check badge and accent border; in-progress and not-started have distinct labels/icons. Guest receives no personal markers or progress mutation. Failed requests show retry without assigning false statuses. Account-tagged data prevents cross-account display; resumed effects/focus refresh progress.
- Existing 24 lesson IDs, order/content and Quran/annotation data are preserved. Manual completion remains unchanged and idempotent.
- Pending/save-success feedback covers lesson start/complete, profile save, other account forms, dashboard loading and logout. Profile success waits for the server response. No optimistic completion or forced success animation after an error.

## Latency findings and fixes

1. **Session checks waited for capabilities.** AuthProvider previously awaited Promise.allSettled of `/auth/status` and `/auth/me` for every refresh. A slow status response could hold the whole login/profile/Google confirmation until its 10-second timeout. Capabilities now load separately; session refresh awaits only the authenticated me request and shares concurrent requests.
2. **Session verification used two database round trips.** Authenticate now joins the hashed, unexpired session to its user in one query. Cookie, expiry, email-verification policy and server-side authorization checks remain intact. No credential/cache shortcut.
3. **Profile save repeated work.** PATCH already returns the authenticated public account. That confirmed response now updates the provider directly, avoiding another capabilities request and session lookup. Older in-flight responses cannot overwrite it.
4. **Logout reloaded the application.** Logout still waits for server session deletion, then clears account state and uses client navigation. The private guard suppresses competing redirects during logout. Request versions prevent an old me response restoring the account; failed logout retains the account and exposes retry/error.
5. **Google fallback imposed 12 seconds.** An originating listener now immediately acknowledges receipt, then separately sends the close acknowledgement only after server session verification. Normal popup completion has no fixed wait. Without a listener, same-tab fallback runs after 1.2 seconds. A bounded 8-second recovery watchdog remains after receipt if confirmation/ack is lost; it is not a minimum delay on successful login. No-opener/noreferrer, state, nonce, PKCE, cookie binding and safe return paths remain unchanged.
6. **Route preparation.** Entry pages prefetch their safe destination and signed-in pages prefetch login, reducing route-loading work after the action.

Explicit post-login/Google verification invalidates any older guest/session request before checking the newly established session. Other simultaneous session reads share one request. Tests hold an old 401 until after login to confirm it cannot overwrite the new account. Failed logout keeps the existing form mounted so its error is visible and retry remains possible.

The cause of any additional live Google-provider/network/Neon-region latency cannot be established from a mocked provider. Do not describe the test timings below as live Google performance or a production SLA.

## Verification

- Frontend: 31 unit tests PASS; TypeScript/static build PASS, 42 pages; final lint PASS. No dependencies added.
- Tests added for inconsistent map/list responses, actual category/map counts, library/path completed markers, guest marker absence, profile pending/success and no extra me lookup, failure/retry of logout, logout retaining the same document, delayed capabilities not blocking session/dashboard, Google handoff despite held capabilities, and bounded same-tab fallback.
- Final combined command: `$env:E2E='true'; node -r ts-node/register --test --test-concurrency=1 test/*.test.ts`: **34 PASS / 0 FAIL / 1 optional PostgreSQL SKIP**, 35 total. Auth 18 + learning/summary 16 pass, including all original ownership/concurrency/idempotence/guest/error/expiry/all-complete assertions and the new UI/latency checks.
- Final isolated observed timings: Google handoff **1,053ms**, despite a held capabilities response; logout **269ms**, server-confirmed and preserving a same-document marker. These are fixture timings, not live Google timings or SLAs.
- Real Neon development: PASS for temporary-schema migration/lock/nonempty rollback refusal, two-connection concurrency/timestamp stability, and the updated browser suite. Observed logout navigation **595ms**, with server confirmation and no document reload. All run-owned user/progress fixtures were removed by exact-ID/email cleanup assertions. No new migration was applied to the application schema.
- Visual inspection: desktop/mobile Taman dashboard and completed/not-started library cards PASS; layout checks at 1440/1024/768/390/320px, existing Zamrud and reduced motion PASS. Screenshots wait for finite animations to finish; users do not wait for this capture-only check.
- Actual development endpoints: web3000 dashboard HTTP200 and API4000 Swagger with lessonStates present. An existing development API was already running the revised contract; no existing process was stopped.

Evidence: [desktop](isolated-dashboard-desktop.png), [mobile](isolated-dashboard-mobile.png), [library markers](isolated-library-status.png), [profile feedback](auth-profile-mobile.png), and approved-Neon `neon-development-dashboard-*.png` / `neon-development-library-status.png`.

## Test harness corrections

The old static test servers served Next export .txt navigation responses as application/octet-stream. Installed Next 16 fetch-server-response explicitly accepts text/plain in export mode; correcting that MIME enabled actual client navigation. A same-document logout assertion detected this mismatch instead of silently accepting a reload. Both auth and learning static harnesses now serve .txt as text/plain. A delayed-capabilities fixture also now finishes its response before removing its route handler, avoiding an already-handled-route cleanup race. Assertions were retained.

Live Google consent/provider latency, physical devices/assistive technology and production deployment remain unverified. No SMTP delivery, quiz policy change or production migration was attempted.

## Deferred decision

The user's next-step direction is **completion earned by several quizzes per tajwid module**, rather than self-declared completion. It is recorded only. Quiz design, pass criteria, attempts, scoring and migration of existing completions require a later explicitly authorized phase. No quiz gating or completion-policy change is enabled now.

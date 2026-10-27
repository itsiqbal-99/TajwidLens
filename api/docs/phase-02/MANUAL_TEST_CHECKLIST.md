# Phase 02 manual review checklist

Use development accounts and the intended development frontend/API. Automated PASS evidence is in TEST_REPORT.md; unchecked items below are manual review tasks, not reported passes. Do not migrate or deploy production as part of this checklist.

## Latest experience revision

- [ ] Choose **Taman** from the palette: white, leaf green, mint and soft yellow. Reload and confirm it persists; the other three themes remain available.
- [ ] Review the dashboard's three status counts, completion ring, 24 linked modules, per-topic counts and completed dates. They must agree with the account's saved progress.
- [ ] Open Belajar Tajwid: completed cards/path links show a check and Selesai; in-progress/not-started use distinct text/icons. A guest sees no personal completion markers.
- [ ] During lesson/profile save, observe immediate pending feedback and a short check animation only after confirmation. Simulate failure and retry. Reduced motion retains readable status without movement.
- [ ] Logout: server-confirmed transition to login, no whole-app reload or competing guard redirect. Failed logout must retain the account and show retry/error.
- [ ] Repeat Google sign-in with a real development Google account: original window receives the verified session; popup closes. Same-tab fallback must not impose the former 12-second delay. Fixture timings are not live-provider timings.
- [ ] Future quiz-based completion is recorded only; current manual completion still works. Do not implement quiz gating during this review.

## Learning behavior

- [ ] Sign in with a new test account. Default destination is `/dashboard/`; greeting uses its actual profile name and progress is 0/24.
- [ ] Click Mulai belajar. The existing first lesson opens, becomes Sedang dipelajari, and does not count as completed from opening/scrolling.
- [ ] Click Tandai Selesai. Pending disables repeated submission; success displays Ditandai selesai and the next-lesson option.
- [ ] Refresh, navigate away/back and reopen the completed lesson. It remains completed and its completion button is inactive/absent.
- [ ] Return to dashboard: count, percentage, completed list and Continue Learning agree. Six completed means 25%.
- [ ] Skip ahead to an incomplete lesson and return: Continue resumes that latest incomplete lesson. Complete it: next incomplete follows catalogue order, wrapping to skipped lessons when necessary.
- [ ] With a dedicated all-complete fixture, verify 24/24, 100%, a warm completion state and Ulangi materi, with no broken next link. Do not add a reset endpoint or modify an ordinary user's progress for this test.

## Identity, persistence and guest

- [ ] Log out and sign in on a second physical device/browser. The same account's progress persists without sharing localStorage or cookies.
- [ ] Sign in as another test account: no first-account progress appears.
- [ ] Enter as guest: homepage, existing lesson library, individual lessons and Quran remain public. No stored completion is implied.
- [ ] Open dashboard as guest: login is required and returning after login preserves the dashboard context.
- [ ] Sign in from a lesson's optional CTA: safe lesson next is honored. A crafted external/unsupported next falls back to dashboard.
- [ ] Restore a valid session at `/` and refresh dashboard; no redirect loop or false guest dashboard.
- [ ] Expire/revoke only a dedicated test account's session, then retry: sign-in is required; after re-login stored progress remains.

## Google and existing auth

- [ ] With a real development Google account, test returning-user login and new-user registration. Popup hands the verified session to the original page, closes after acknowledgement, and the original page reaches dashboard (or its safe explicit next).
- [ ] Test same-tab fallback when popups are blocked; no stuck pending state or old forced profile-welcome destination.
- [ ] If email belongs to a password account, use existing secure explicit linking from profile. Do not delete/merge users or auto-link by email.
- [ ] Recheck manual registration success notification, cleared fields, password login, profile save, logout and back/forward navigation. SMTP is still deferred unless separately configured/approved.

## Failure, accessibility and visual review

- [ ] Interrupt the API during dashboard load: unavailable/retry appears, with no fabricated 0% or empty successful progress summary. Reconnect and retry.
- [ ] Interrupt completion: no success is claimed; the confirmed state remains and retry works.
- [ ] Navigate to another lesson while completion is pending: its later response must not change the new lesson's state.
- [ ] At 320/390/768/1024/1440px, check long profile names, clear primary CTA, readable counts and no horizontal scrolling. Try all existing themes.
- [ ] Use keyboard only: visible focus, logical order, accessible completion/retry/links and expandable completed list.
- [ ] Review with a screen reader: heading structure, progressbar value/count, loading, error and completion announcement.
- [ ] Enable reduced motion: no entrance movement or progress animation; actions remain immediate.
- [ ] Compare desktop/mobile/new/completed evidence with the actual running development app.

## Release review (separate approval required)

- [ ] Review additive migration and database target with the migration owner. No synchronize or destructive rollback; populated progress tables require a forward repair migration.
- [ ] Package `api/` and `shared/` as siblings; configure the real API origin before building `web/out`.
- [ ] Verify HTTPS/cookies/CORS and static deep links on the intended hosting platform. Local export PASS does not prove production configuration.
- [ ] Complete live provider/device/assistive-technology checks above, then request a separate release decision. Phase 03 requires explicit approval.

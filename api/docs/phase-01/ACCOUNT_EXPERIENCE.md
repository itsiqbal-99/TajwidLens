# Account experience revision — 24 October 2026

## Direction lock and decisions

Direct build on the user-selected Architectural Light direction and the latest requested changes, not a new visual language. Refero live returned `NO_SUBSCRIPTION`; no live design reference is claimed. Existing screens, the official logo, the original ImageGen book/lens asset and Refero's bundled motion/visual-QA guidance are the references. Superdesign canvas was skipped in favour of direct changes to the existing application; Ponytail kept functionality in the current form/services without a new dependency or migration.

| Decision | Source / role |
|---|---|
| Full-panel sharp wallpaper, image opacity .94 | Explicit user correction: no blur, slightly translucent image |
| Stronger overlay behind heading, lighter across the illustration | Maintain readable copy without washing out the book/lens |
| Framed avatar, Welcome/name and account link in navbar | User request; actual nickname, no invented status |
| Profile illustration banner + identity/access rail + edit panel | Existing theme and form controls, clearer information hierarchy |
| 140ms controls / 320ms entry; reduced motion override | Refero motion guidance, no perpetual decorative motion |
| Existing generated asset reused | Brand continuity and no new bitmap generation required |

Profile stays compatible with application themes; login retains its independent light palette. Mobile navbar compacts at narrow widths, with the brand mark retained at 320px. Form controls remain visible and labelled; no fake progress metrics or unimplemented learning features are introduced.

## Google popup handoff

The API now redirects successful ordinary OAuth callbacks to `/auth-complete/` (new users carry only `welcome=1`). The popup sends a destination-only completion notice over a same-origin BroadcastChannel. The originating login/register page validates the message shape and allowlisted destination and calls `/auth/me` through the existing provider. Only a confirmed server session produces an acknowledgement; the popup then closes. New-user nickname confirmation runs on the originating page, not the popup. Returning users keep the originating page's safe return destination.

No authorization code, OAuth state, cookie, password, Google token or user record crosses this channel. `noopener,noreferrer` is retained. OAuth state, browser binding, nonce, PKCE, expiry and session cookies are unchanged. A same-tab fallback and a visible continuation link remain available; without acknowledgement the completion page continues locally after 12 seconds. This handles direct/same-tab entry or a parent tab that was closed.

Browser API reference: [MDN Broadcast Channel API](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API). This is same-origin notification, never proof of authentication.

## Explicit Google account linking

The preceding interrupted revision is retained and completed here. A password-account collision still does not merge accounts automatically. The recovery message takes password login to profile, where **Hubungkan Google** requires a valid authenticated session and confirmation of the current password. The server creates a ten-minute, single-use `google-link` intent in the existing auth_tokens table, tied to the OAuth state and user ID. Callback additionally requires the user's live session, matching verified Google email, and an unoccupied/compatible Google subject. It preserves the original user ID, nickname, profile and password hash, then rotates the current session. Wrong email, conflicting subject, wrong password, expired intent, missing session and replay do not link the account.

No schema change, manual account edit, live-user merge or migration was performed. The user reports real Google registration/login now succeeds; the agent's repeatable tests use isolated identities rather than the user's Google credentials.

## Verification evidence

- Web unit tests: 25 PASS (7 files), including strict completion-message destination validation.
- Frontend static export: 41 pages PASS; API build and frontend lint PASS.
- Visual-only fixture checks: login/register at 1440/1024/850/768/390/320; profile/navbar at 1440/1280/1024/768/390/320, long nickname/email, keyboard focus, dark theme and reduced motion. No live account created or edited for screenshots.
- Screenshots: `login-redesign-desktop.png`, `login-redesign-mobile.png`, `register-redesign-desktop.png`, `register-redesign-mobile.png`, `profile-redesign-desktop.png`, `profile-redesign-mobile.png`, `profile-redesign-dark.png`.
- The first browser run exposed mobile navbar overflow in the earlier export. It was fixed and the export rebuilt, rather than weakening the assertion.

Full browser acceptance on the rebuilt export: **18 PASS / 1 SKIP / 0 failed**, including automatic popup closure and onboarding on the original window, profile save, explicit linking and the existing auth regressions. Real Google consent with the revised popup handoff still needs a fresh user retry; real PostgreSQL integration remains separately gated.

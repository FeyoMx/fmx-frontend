# RC1 Operator Experience Validation

Updated on 2026-05-02.

## Goal

Validate whether a real operator can use the current frontend without getting lost, mistaking unsupported behavior for supported behavior, or taking risky actions without feedback.

## Walkthrough Scope

The RC1 walkthrough covered the expected first-use path:

- login
- open the manager dashboard
- create or select an instance
- inspect instance runtime state
- reconnect, pair, logout, and refresh lifecycle data
- open the chat list and a conversation
- send text/media/audio from the chat composer where supported
- send a direct text message from the instance dashboard
- create and inspect a broadcast job
- filter/paginate broadcast recipient rows
- log out of the operator workspace

This pass was performed as a frontend review and production-preview smoke test in this workspace. Full backend-connected manual QA still needs a seeded tenant and live bridge/device data.

## What Feels Intuitive

- The sidebar focuses operators on supported surfaces first: dashboard, contacts, broadcast, AI settings, instance conversations, and runtime/setup.
- Unsupported integration routes do not leak into primary navigation; deep links land on guarded explanation pages instead of broken screens.
- The dashboard now clearly separates reliable operational status from sparse analytics.
- Instance cards prioritize degraded/offline instances first, which matches real triage behavior.
- Instance dashboard language is honest about runtime dependency, bridge health, QR/code availability, and bounded backfill limits.
- Chat list and conversation history explain partial history without blocking the operator from sending.
- Broadcast history reads like a queue surface rather than full delivery analytics, reducing false confidence.
- Empty, loading, and error states are generally explicit and retryable.
- Logout clears local session state even when backend logout acknowledgement fails.

## UX Issues Found

- Logout previously looked instantaneous but gave no in-flight feedback after confirmation, so a slow logout could feel like a missed click.
- Protected routes rendered blank while session hydration was in progress, which could look like a broken app on slow storage or auth checks.
- Unsupported placeholders always said "Go to instance dashboard" even for manager-level routes without an instance context.
- Broadcast creation mixed "broadcast" and "queue" language; operators could read it as guaranteed delivery instead of job creation.
- New instance creation lacked in-flight button feedback and used a generic translated button label that was less clear in an operator flow.
- New instance create failures could surface as an empty `Error : undefined` toast when the backend returned an unexpected error shape.

## Improvements Made

- Header logout now disables confirmation actions while signing out and changes the destructive button to `Signing out...`.
- Protected routes now show a bounded `Checking session` fallback instead of a blank page during auth hydration.
- Unsupported placeholders now adapt their primary CTA: manager-level routes go to manager home, instance routes go to instance dashboard.
- Broadcast actions now use clearer job language:
  - `New broadcast job`
  - `Create broadcast job`
  - `Create queue job`
  - success toast: `Broadcast job created. Inspect recipients to track queue outcomes.`
- New instance creation now uses clearer `Create instance` labels, disables fields while submitting, and shows `Creating...`.
- New instance create errors now use shared API error parsing instead of brittle nested response access.

## Critical Flow Validation

- Login flow has explicit loading feedback and surfaces parsed backend errors.
- Dashboard navigation points to supported operator pages only.
- Instance navigation avoids unsupported integration pages in the sidebar.
- Chat routes are protected, instance-scoped, and use tenant-safe list/detail routes.
- Broadcast create and inspect flows include validation, in-flight state, and runtime caveats.
- Logout is safe: local token/user/tenant/query state is cleared before navigation back to login, and backend acknowledgement remains best-effort.
- Production preview served the built app successfully over HTTP.

## Still Confusing Or Worth Improving

- Direct send exists both on the instance dashboard and in the chat composer; operators may need onboarding copy explaining when to use each.
- Some older legacy embed-chat files remain in the codebase for guarded routes; they are not primary navigation but should eventually be retired.
- Instance lifecycle actions still depend on backend/bridge timing, so QR/code publication can feel delayed even with improved copy.
- Broadcast recipient analytics remain queue/send-attempt analytics only; pilot users may still ask for delivery/read receipts.
- Dashboard aggregate metrics are intentionally conservative, but real users may expect them to behave like analytics KPIs.
- Full confidence requires backend-connected QA with real tenants, slow bridge responses, failed sends, and large campaign data.

## RC1 Readiness Verdict

The frontend is ready for initial operator validation as an RC1 candidate.

The supported flows are coherent enough for a real user to navigate, understand what is supported, and recover from empty/error/loading states. The remaining risks are mostly backend-data expectations and operator training, not broken navigation or hidden frontend failures.

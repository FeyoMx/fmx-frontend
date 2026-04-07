# QA Checklist

Updated on 2026-04-06.

## Operator Walkthrough

1. Login
- Sign in with a valid tenant user.
- Confirm the app lands on `/manager`.
- Confirm tenant identity is visible and the sidebar renders the supported operator surfaces.

2. Dashboard
- Confirm instance cards render without layout breaks.
- Confirm status badges look consistent.
- Confirm the aggregate-counter caveat is visible and not misleading.

3. Open Instance
- Open an instance from the dashboard into `/manager/instance/:instanceId/dashboard`.
- Confirm token, status, and instance stats render.

4. Pair / Reconnect / Logout
- Trigger QR connect or pairing code when the instance is not open.
- Trigger reconnect and restart actions when appropriate.
- Trigger logout/disconnect.
- Confirm lifecycle feedback is shown clearly and does not feel stale.

5. Runtime Refresh
- After lifecycle actions, confirm runtime state refreshes.
- Confirm runtime history refreshes and recent lifecycle events are readable.
- Confirm loading, empty, and error states remain coherent.

6. Open Chat List
- Go to `/manager/instance/:instanceId/chat`.
- Confirm the thread list loads.
- Confirm selected-thread styling, previews, and unread hints render when data is available.

7. Open Thread
- Open a conversation at `/manager/instance/:instanceId/chat/:remoteJid`.
- Confirm grouped messages, timestamps, direction, and delivery/read indicators render cleanly.
- Confirm empty or sparse history is explained honestly.

8. Send Text
- Send a text message from the active thread.
- Confirm send feedback appears.
- Confirm the message is appended or refreshed safely.

9. Send Media
- Attach and send a media message from the active thread if backend support is available in the environment.
- Confirm attachment feedback is clear.
- Confirm the thread stays stable after send.

10. Send Audio
- Attach and send an audio message from the active thread if backend support is available in the environment.
- Confirm audio send feedback and rendering are coherent.

11. Verify Empty And Sparse States
- Check a fresh thread with no persisted history.
- Check an instance with little or no runtime history.
- Check contacts or broadcast pages with no records.
- Confirm all empty states are honest and operator-friendly.

12. Verify Graceful Unsupported States
- Open `/manager/api-keys` and confirm it is clearly informational only.
- Confirm gated legacy suites are not prominent in normal navigation.
- If a gated deep link is opened manually, confirm the placeholder is honest and not misleading.

## Final Visual Sanity Checks

- Buttons, spacing, and badges should feel consistent across dashboard, contacts, broadcast, AI settings, and instance dashboard.
- Loading, empty, and error states should use similar tone and structure.
- Supported pages should feel demoable without needing to explain hidden caveats on every step.

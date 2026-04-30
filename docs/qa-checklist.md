# QA Checklist

Updated on 2026-04-30.

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

## Dense Data And Narrow Width Checks

1. Dashboard with many instances
- Confirm many instance cards wrap into the grid without card-footer overflow.
- Confirm long instance names, profile names, owner JIDs, and timestamps do not push actions off card edges.

2. Contacts with 100+ contacts
- Confirm the contact table keeps horizontal scrolling instead of overflowing the page.
- Confirm long names, emails, phone numbers, tags, and pipeline stages wrap or truncate cleanly.
- Confirm the incremental "Show 100 more" footer wraps with the button still reachable.

3. Broadcast with many jobs and recipient rows
- Confirm queue history keeps table scrolling contained on narrow screens.
- Confirm long messages, recipient phone numbers, chat/contact IDs, message IDs, and backend errors stay readable without breaking layout.
- Confirm recipient pagination/filter summary wraps and Previous/Next remain usable.
- Confirm partial analytics caveats remain visible without implying delivery/read receipts.

4. Chat list with many threads
- Confirm the split-pane list scrolls internally and thread cards do not resize the page.
- Confirm long push names, remote JIDs, preview text, unread badges, and "Show 75 more" footer remain readable on narrow widths.

5. Chat conversation with many messages
- Confirm long text messages wrap inside bubbles.
- Confirm media/audio/document placeholders and filenames do not overflow.
- Confirm the newest-message control remains reachable after scrolling.

6. Runtime history with many events
- Confirm long event details and bounded-backfill feedback wrap in the card.
- Confirm recovery form fields and the submit button remain usable on narrow widths.

7. Browser data warnings
- Run `npx update-browserslist-db@latest` when npm registry access is reliable.
- If the updater changes `package-lock.json`, rerun `npm run type-check` and `npm run build` before committing.

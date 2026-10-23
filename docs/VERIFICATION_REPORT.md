# Cheqzo verification report — Phases 0 to 5

Audit date: 23 Oct 2026. Spec: `docs/CHEQZO_BUILD_GUIDE.md`. No product code was changed.

Browser: an existing `next dev` on `http://localhost:3000` (PID 11276). A clean `localStorage` was loaded, then the homeowner path was walked: invalid phone, OTP `000000`, OTP `123456`, role selection, portfolio, Koramangala update approval, and acknowledgement of `pay_kora_carpentry_oct`. That browser profile is now off seed (kitchen progress 65%, Total Paid ₹11.5L). `?reset=1` does not restore it.

## 1. Summary

**Overall verdict: Needs fixes first.**

The seeded story, login, shell, portfolio, approval, and payment acknowledgement work and match the guide's numbers. Two checks fail, and three visible gaps should be fixed before treating the demo as repeatable.

| Verdict | Count |
| --- | --- |
| PASS | 57 |
| PARTIAL | 8 |
| FAIL | 2 |
| UNVERIFIED | 5 |
| Checks | 72 |

Quality gates, run from `d:\Projects\czeno`:

| Gate | Result |
| --- | --- |
| `npm run lint` | PASS (exit 0, no findings) |
| `npm run test` | PASS — Vitest 5.0.5, 7 files, 45 tests |
| `npm run build` | PASS — Next.js 16.4.2, TypeScript clean, 17 routes |

## 2. Phase scorecard

| Phase | Verdict | % of checks passed | Blocking issues |
| --- | --- | --- | --- |
| 0 | PASS | 100% (7/7) | — |
| 1 | PARTIAL | 79% (19/24) | `?reset=1` does not restore seed. `/dev/components` imports seed data. |
| 2 | PARTIAL | 79% (11/14) | — (paste, backspace, and the resend toast were not observed) |
| 3 | PARTIAL | 67% (6/9) | Portfolio "Approve … update" links land on the feed with nothing selected. |
| 4 | PARTIAL | 80% (8/10) | Lightbox keys were not pressed. Meera cannot be selected in this phase. |
| 5 | PARTIAL | 75% (6/8) | Financials donut labels a ₹6.4L slice "Remaining" while the Remaining card is ₹8.9L. CSV download was not captured. |

## 3. Detailed checklist

### Phase 0 — scaffolding

| Check | Verdict | Evidence | Notes |
| --- | --- | --- | --- |
| Next.js App Router and `strict: true` | PASS | `tsconfig.json:7`; `src/app/(app)/dashboard/page.tsx`; build route table | App Router pages for login, role, dashboard, project sections, and `not-found`. |
| Tailwind | PASS | `package.json:45`; `src/app/globals.css:1` | Tailwind v4 via `@import "tailwindcss"`. |
| shadcn/ui set | PASS | `src/components/ui/button.tsx`, `input.tsx`, `dialog.tsx`, `sheet.tsx`, `tabs.tsx`, `select.tsx`, `dropdown-menu.tsx`, `popover.tsx`, `tooltip.tsx`, `badge.tsx`, `card.tsx`, `skeleton.tsx`, `command.tsx`, `sonner.tsx` | Also present: `textarea.tsx`, `input-group.tsx`. |
| Locked libraries | PASS | `package.json:12-48` | lucide-react, `@tanstack/react-table`, react-hook-form, zod, zustand, recharts, date-fns, framer-motion, vitest, sonner. |
| Folder structure matches Section 3 | PASS | `src/app`, `src/components/shell`, `src/components/ui`, `src/components/shared`, `src/components/features`, `src/lib`, `src/data`, `src/store`, `src/types/index.ts`, `docs/` | Later phases added real screens. `changes`, `rooms`, `team`, and both settings routes are placeholders. |
| `.cursor/rules/cheqzo.mdc` matches Section 14 | PASS | `.cursor/rules/cheqzo.mdc:1-34`; guide lines 1132-1167 | Front matter and body match. |
| No substituted libraries | PASS | `package.json` | No Redux, MUI, Axios, or SWR. Supporting packages only: `cmdk`, `radix-ui`, `class-variance-authority`, `@hookform/resolvers`, `next-themes`, `tw-animate-css`, `shadcn`, `cn`. |

### Phase 1 — foundations

| Check | Verdict | Evidence | Notes |
| --- | --- | --- | --- |
| Section 5 interfaces, fields, and unions | PASS | `src/types/index.ts:1-176` | Every Section 5 interface and union is present. Added fields the later rules need: `User.access`, `User.accountKind`, `Project.seedDelayDays` (`types/index.ts:36`), `Payment.receiptUrl`, `Payment.audit`, `ChangeRequest.appliedToBaseline`. |
| `formatINR(1930000)` and `formatINRCompact` | PASS | `src/lib/format.ts:14-29`; `src/lib/format.test.ts:8-22` | Tests expect `₹19,30,000`, `₹19.3L`, `₹50,000` below 1 lakh, and `₹1.2Cr`. Suite passed. |
| `DEMO_NOW`, `delay()`, id generator; `Date.now` / `new Date` search | PASS | `src/lib/demo.ts:4-33` | `DEMO_NOW_ISO` is `2026-10-22T12:00:00`. `delay()` defaults to 450 ms. `createId` and `uniqueId` exist. Repo search of `src/` found `Date.now` only in a comment at `demo.ts:3`. No `new Date()` calls. |
| Health implementation | PASS | `projectHealth` in `src/lib/rules.ts:136-188` | First match: At Risk (`delayDays > 14`, quiet days `> 10` or no update, any disputed payment), then Needs Attention (delay 5–14 inclusive, pending update `> 3` days, awaiting ack `> 2` days, any pending change request), else On Track. Returns `{ health, reasons }`. |
| Health tests cover each threshold | PARTIAL | `src/lib/rules.test.ts:37-76` | Tests lock the three seeded outcomes and Whitefield's three reasons. No isolated case for a 5–14 day delay, a pending update older than 3 days, an awaiting-ack payment older than 2 days, or At Risk winning when a Needs Attention condition is also true. |
| Project progress | PASS | `projectProgress` in `src/lib/rules.ts:118-123`; `rules.test.ts:124-127` | Weighted by `budgetAllocation`. Koramangala seed is `46.0335…`. After the browser approved the kitchen update, the portfolio showed 50%, which is `Math.round` of the same weights with kitchen at 65. |
| `estimatedCost` and projected end | PASS | `estimatedCost` `rules.ts:95-100`; `delayDays` `rules.ts:87-89`; `projectedEndDate` `rules.ts:91-93`; `rules.test.ts:83-108` | Approved seeded requests with `appliedToBaseline: true` are excluded. Cove preview is ₹19,30,000 and 15 Dec → 20 Dec. Whitefield `seedDelayDays: 18` (`seed.ts:764`). |
| Payment totals count acknowledged only | PASS | `totalPaid` `rules.ts:102-106`; `rules.test.ts:85`, `219-235` | Seeded Koramangala acknowledged sum is ₹9,00,000. Acknowledging `pay_kora_carpentry_oct` yields ₹11,50,000. |
| Permissions matrix, all 4 columns | PASS | `can` `rules.ts:223-272`; `rules.test.ts:164-216` | Homeowner, Meera (`view`), a synthetic family `approve` actor, and Rohan are asserted, including counterparty change-request decisions. |
| People and the three projects | PASS | `seed.ts:70-112`, `732-782`, `817-826` | Ananya, Rohan (Studio Lumen), Karthik, Meera (`access: "view"`, `accountKind: "family"`), Suresh on Koramangala and Whitefield. Types, areas, and original ends match. Ananya owns the first two; Rohan is `designerId` on all three. |
| Koramangala hero data | PASS | Rooms `seed.ts:114-244`; updates `268-379`; payments `382-444`; changes `446-504` | Six rooms with the specified progress, status, and active task. Six updates with the specified titles, deltas, and statuses, including the socket comment at `seed.ts:264`. Base budget `1790000`. Four payments: 02 Jul ₹4,50,000 UPI, 10 Aug ₹3,00,000 Bank Transfer, 05 Sep ₹1,50,000 Cheque, 20 Oct ₹2,50,000 UPI awaiting ack. Pending cove request is +140000 / +5 days. |
| Whitefield and Indiranagar | PASS | `seed.ts:537-552`, `610-700`, `801-808` | Whitefield: disputed ₹1,80,000 Cash, reason "Not received by us" (`seed.ts:624`); four approved updates, newest `2026-10-11` (11 days before `DEMO_NOW`); `seedDelayDays: 18`. Indiranagar progress is exactly 25 (`rules.test.ts:129-137`); no pending updates, disputes, or pending change requests. |
| Computed health and money | PASS | `rules.test.ts:40-74`, `83-107`; browser on a clean store | Koramangala Needs Attention ("1 change request pending"). Whitefield At Risk ("Projected 18 days late", "No update in 11 days", "Payment disputed"). Indiranagar On Track, 25%. Portfolio showed Estimated ₹17.9L, Paid ₹9L, Remaining ₹8.9L before acknowledgement. |
| Notifications for both roles | PASS | `seed.ts:828-839` | Ananya: 5 (4 unread), including the kitchen update, ₹2.5L payment, and cove request. Rohan: 5, including "Karthik acknowledged ₹3L payment". Bell showed 4 unread as Ananya and 3 as Rohan before the approval notification. |
| Reads and writes go through `api.ts` with 300–600 ms | PARTIAL | Writes: `src/data/api.ts:39-41`, `178`, `400`; `demo.ts:7`. Reads: `src/data/live.ts:33-42` | `wait()` uses `delay()` (450 ms) when latency is on. `postUpdate` waits 700 ms and `createProject` 800 ms, matching J3 and P2. Screens subscribe with `useLiveDb()` and do not await `api.ts`, so lists do not show the artificial latency. |
| Zustand persist | PASS | `src/store/db.ts:20-49`; `src/store/session.ts:15-28` | Keys `cheqzo-db` and `cheqzo-session`. A previous Jayanagar House project was still in the store when the audit browser first opened. |
| Reset function | PASS | `useDb.reset` `store/db.ts:25`; `api.reset` `api.ts:157-159`; `rules.test.ts:245-257` | Approving the cove request and calling `api.reset()` restores `pending` and estimated cost ₹17,90,000. |
| `?reset=1` | FAIL | Search of `src/` finds the param only in the guide | Navigating to `/dashboard?reset=1` left Jayanagar House and the already-mutated Koramangala row in place. |
| Components importing `data/seed` | FAIL | `src/app/dev/components/page.tsx:21` | Only that page. `store/db.ts` and tests import seed, which is the data layer. |
| Tokens and fonts | PASS | `globals.css:58-71`; `src/app/layout.tsx:7-16` | Section 4.2 hex values are the CSS variables. Inter and Fraunces via `next/font`. Radius 12px cards / 8px controls at `globals.css:149-156`. Sidebar `w-[248px]` (`Sidebar.tsx:65`), top bar `h-16`, content `px-8` and `max-w-[1600px]` (`AppShell.tsx:62`). |
| Shared components in 4.3 | PASS | `src/components/shared/` | HealthBadge, StatusBadge, StatCard + CountUp (`StatCard.tsx:25`, `CountUp.tsx:19` duration 0.6), ProgressBar ghost (`ProgressBar.tsx:17-19`), DataTable (page size 10, `DataTable.tsx:55`), SplitPane 360–420px (`SplitPane.tsx:14`), PhotoGrid, Lightbox, TimelineCompare, MoneyText, RoleGuard, EmptyState, ConfirmDialog, Skeletons. |
| HealthBadge tooltip shows reasons | PASS | `HealthBadge.tsx:23-34` | Tooltip joins reasons. The Koramangala preview also listed "1 change request pending" in the page, and Whitefield listed the three At Risk reasons. |
| Lightbox ← → Esc | UNVERIFIED | Handler: `Lightbox.tsx:25-32` | Photo buttons rendered on the kitchen update. Arrow keys and Esc were not pressed. |
| `/dev/components` exists | PASS | `src/app/dev/components/page.tsx`; build lists `○ /dev/components` | The page is public, not behind an env flag. |

### Phase 2 — auth and shell

| Check | Verdict | Evidence | Notes |
| --- | --- | --- | --- |
| A1 split layout, +91, Zod, inline error | PASS | `login/page.tsx:34`; `phone-step.tsx:15`, `40-71`; `auth.ts:8-10` | Browser: `5123456789` showed "Enter a 10-digit mobile number starting with 6 to 9" and stayed on `/login`. Tagline and three value props rendered. |
| A1 Enter submits | PASS | `phone-step.tsx:34` is a `<form onSubmit>` with `type="submit"` | Send OTP was verified with a click. The control is a native submit button inside the form. |
| A1 600 ms sending state | PASS | `auth.ts:6`; `phone-step.tsx:26-30` | Submit waits `OTP_SEND_DELAY_MS` (600) and the label switches to "Sending…". The OTP step appeared after that wait. |
| A2 six boxes and auto-advance | PASS | `otp-step.tsx:79-100` | Six digit boxes rendered. Typing into digit 1 moved focus to digit 2. |
| A2 paste fills all boxes | UNVERIFIED | `otp-step.tsx:54-61` | Paste handler is implemented. It was not exercised. |
| A2 backspace moves back | UNVERIFIED | `otp-step.tsx:101-108` | Handler is implemented. It was not exercised. |
| A2 correct code `123456` proceeds | PASS | `auth.ts:4`, `29-31`; `otp-step.tsx:63-69`; `login/page.tsx:27-30` | Browser ended on `/role`. |
| A2 wrong code shakes, errors, and stays | PASS | `otp-step.tsx:64-67` | `000000` showed "That code doesn't match. Try 123456." and the URL stayed `/login`. Shake is the `controls.start({ x: [...] })` call; the motion was not measured. |
| A2 resend `0:30` and toast | PARTIAL | `otp-step.tsx:72`, `132-143`; `auth.ts:5` | Browser: Resend was disabled, then enabled, and after the click the label returned to "Resend in 0:30". `toast.success("Code sent")` is in the handler. The toast text was already gone when the DOM was read. |
| A3 cards, Continue disabled, Ananya / Rohan, persists | PASS | `role/page.tsx:20-35`, `82-86`; `session.ts:15-28` | Continue was disabled until Homeowner was pressed. The dashboard then showed Ananya's two projects. A later visit to `/login` with an existing session redirected to `/dashboard`, so the session survives a new page load. |
| Sidebar 248px, project group, live badges | PASS | `Sidebar.tsx:65-116`; `projectNavBadges` `rules.ts:280-290` | Browser, clean Koramangala: Updates 2, Financials 1, Change Requests 1. Rooms and Team have no count, which matches the guide (badges are for those three queues). |
| Top bar: switcher, search, bell, role switch, avatar | PASS | `Topbar.tsx:24-44`; `ProjectSwitcher.tsx:46` via `hrefForProject` `navigation.ts:29-34`; `RoleSwitcher.tsx:20-24`; `AvatarMenu.tsx:49-83`; `shell-ui.tsx:15-23` | Role switch on the kitchen update stayed on the same URL and replaced the decision buttons with "Waiting on the homeowner." Search button and command dialog are present. Bell unread count changed with the role (4 vs 3). Avatar menu was not opened; Profile and Settings both route to `/settings`. |
| Auth guard | PASS | `AuthGate.tsx:24-38`; `auth.ts:33-44`; `projects/new/page.tsx:11-14` | Logged-in `/login` went to `/dashboard`. Cleared storage showed the phone form. Homeowner `/projects/new` showed "You don't have access" / "Only a designer can create a project" and "Back to dashboard". |
| Not-found page | PASS | `src/app/not-found.tsx`; `NotFoundScreen.tsx:15-35`; project layout `projects/[projectId]/layout.tsx:17-25` | `/does-not-exist` rendered "This page isn't available" and "Back to dashboard". Unknown or hidden project ids use the same screen inside the shell. |

### Phase 3 — portfolio and create project

| Check | Verdict | Evidence | Notes |
| --- | --- | --- | --- |
| Role titles and KPI rows | PASS | `portfolio-screen.tsx:100`; `kpi-row.tsx:9-27`; `portfolio.ts:197-206` | Browser, homeowner: "Your projects", Active 2, Total budget ₹65.9L, Total paid ₹23.7L, Items needing your action 4. Designer: "Studio portfolio", New project, and the four designer labels. `portfolio.test.ts:63-74` locks the same KPI math (₹65,90,000 and ₹23,70,000). |
| Homeowner sees 2, designer sees 3 | PASS | `projectsForUser` `rules.ts:293-304`; browser dashboard | Clean homeowner list: Whitefield, Koramangala. Designer list: those two plus Indiranagar Penthouse. |
| Grid/list, search, health chips, sort, combined filters | PARTIAL | `portfolio-screen.tsx:158-165`; `queryPortfolio` `portfolio.ts:209-241`; `portfolio.test.ts:77-80` | List/grid buttons, search, four health chips, and Health/Progress/Deadline sort rendered. The test proves search "bengaluru" + Needs Attention returns only Koramangala. Grid toggle and a filtered-empty click were not done in the browser. |
| Row content | PASS | `project-list.tsx:55-71` | Browser rows showed thumbnail, type and area, health, progress, original → projected dates, and "2 pending" on Koramangala (then "1 pending" after approval). |
| Preview panel | PASS | `project-preview.tsx:23-92` | Koramangala preview: health reasons, TimelineCompare, Estimated ₹17.9L / Paid ₹9L / Remaining ₹8.9L, three actions, latest update "Base and wall cabinets installed", Open project. |
| "Needs your action" deep links | PARTIAL | `portfolio.ts:80-89` vs `project-view.ts:71-73` | Labels match the guide and `portfolio.test.ts:87-93`. The payment href includes `?payment=`. Update hrefs are `/projects/{id}/updates` with no `?update=`, so `UpdatesScreen` leaves the detail on "Select an update to review" (`updates-screen.tsx:70`). Overview links do include the id. |
| Skeleton, empty, and filtered-empty | PASS | `portfolio-screen.tsx:86-97`, `111-121`, `146-154` | All three states exist. The browser session had projects, so empty and filtered-empty were not on screen. |
| Wizard: 4 steps, back, Zod, rooms, allocation warning, designer-only | PASS | `wizard.tsx:28-33`, `55-78`, `165-169`; `schema.ts:88-113`; `rooms-step.tsx:167-179`; `projects/new/page.tsx:11-14` | Steps are Basics, Client, Floor plan and rooms, Budget and timeline. Back calls `goTo` without clearing the draft. Presets, custom rooms, and drag/reorder are in `rooms-step.tsx`. Mismatch warns "You can still continue." Homeowner route showed the not-allowed screen in the browser. |
| Create success, toast, redirect, survives refresh | PARTIAL | `wizard.tsx:85-99`, `45-48`; `api.ts` `createProject`; `portfolio.test.ts:153-161` | Code waits 800 ms, toasts "Project created", and routes to the new overview. The test persists a project until `api.reset()`. This session did not click through the four steps. Before storage was cleared, the audit browser still held a "Jayanagar House" (3 BHK Independent House, 1,800 sqft, ₹12L, 1 Apr 2027), which is a created project that had survived an earlier session. `?reset=1` did not remove it. |

### Phase 4 — overview and updates

| Check | Verdict | Evidence | Notes |
| --- | --- | --- | --- |
| J1 header, cards, donut, timeline, rooms, activity, actions, team, dates from `rules.ts` | PASS | `overview-screen.tsx:47-48`; `budget-panel.tsx:9-38`; `overview-aside.tsx:46-114` | `summarizeProject` supplies the numbers. After approval the overview showed Kitchen 65%, Paid ₹11.5L, action line "1 pending update · 0 awaiting acknowledgement · 1 change request", matching the sidebar. Team listed Ananya, Rohan, Meera, and Suresh. Room cards link to `/rooms?room=`, which is still the Phase 7 placeholder. |
| J2 split, filters, grouping, cards, detail, ghost bar, thread | PASS | `updates-screen.tsx:27-33`, `152-166`; `update-feed.tsx:59-80`; `update-detail.tsx:37-47`; `groupUpdates` `project-view.ts:124-132` | Browser showed status chips, room and sort selects, groups Yesterday / This week / Last week / September, photo buttons, Approve / Request changes / Reject, and the comment box. Pending detail passes `proposed` into `ProgressBar`. |
| Lightbox keyboard | UNVERIFIED | `PhotoGrid.tsx:41-43`; `Lightbox.tsx:25-32` | Same as Phase 1. Keys were not pressed. |
| Approve sets progress, recalculates, notifies, toasts | PASS | `approveUpdate` `rules.ts:319-356`; `api.approveUpdate` `api.ts:232-245`; `decision-panel.tsx:58-62` | Browser: Updates badge went from 2 to 1, the kitchen card became Approved, overview kitchen progress became 65%, and a designer notification was created (Rohan's unread count rose to 5). Toast copy is `` `${roomName} progress updated to ${proposedProgress}%` ``. The toast had dismissed before the DOM was read. |
| Request changes requires a comment and leaves progress unchanged | PASS | `decision-panel.tsx:70-74`; `requestUpdateChanges` `rules.ts:359-397`; `rules.test.ts:146-152` | Empty comment sets "A comment is required" and does not call the API. The rules test keeps kitchen progress at 50. This button was not clicked in the browser. |
| Reject requires confirm and a reason | PASS | `decision-panel.tsx:154-163`; `ConfirmDialog.tsx:39-43`, `71`; `rejectUpdate` `rules.ts:400-410` | Confirm stays disabled until the reason is non-empty. Not clicked in the browser. The disabled confirm button has no explanatory tooltip. |
| View-only family actions disabled with a tooltip | PARTIAL | `RoleGuard.tsx:14-28`; `decision-panel.tsx:105-109`; `can` `rules.ts:226` | A `view` actor gets "You have view-only access" on disabled buttons. The shell switcher only offers Ananya and Rohan (`RoleSwitcher.tsx:10-13`). Settings is `RoutePlaceholder` (`settings/page.tsx:1-6`), so Meera cannot be selected. |
| Designer cannot decide, and can comment | PASS | `decision-panel.tsx:54-56`; `comment-thread.tsx:72-88` | Browser, same update: decision buttons were gone, copy was "Waiting on the homeowner.", and the comment field remained. |
| J3 post-update sheet | PASS | `post-update-sheet.tsx:88-166`; `post-update-schema.ts:40-56`; `postUpdate` `rules.ts:436-500`; `api.ts:178-206` | Room, title, description, multi-photo caption and kind, slider `min={current}`, notify default on, 560px sheet. Validation requires room, title, and one photo, and progress at least current. Submit creates a pending update, sets the room to `awaiting_approval`, notifies the homeowner, and toasts "Update sent for approval". The sheet was not submitted in the browser. Designer did see the Post update button. |
| Sidebar badges and overview action card update after approval | PASS | `Sidebar.tsx:61`; `overview-aside.tsx:46-70` | Observed together after the kitchen approval: Updates 1, Financials badge removed once the payment was acknowledged, overview action list reduced to the living-room update and the cove request. |

### Phase 5 — financials

| Check | Verdict | Evidence | Notes |
| --- | --- | --- | --- |
| J4 cards, donut, chip, stage strip, seven columns, sort | PARTIAL | `budget-summary.tsx:19-28`; `financials.ts:93-104`, `106-114`; `payment-columns.tsx:27-84`; `stage-strip.tsx:14-26` | Browser before acknowledgement: Estimated ₹17.9L, chip "+₹1.4L pending change", Paid ₹9L with "₹2.5L awaiting acknowledgement", Remaining card ₹8.9L. Table had Date, Stage, Method, Reference, Amount, Status, Recorded by, with Date and Amount sort. The donut legend said Remaining ₹6.4L. That slice is `remaining - awaitingAcknowledgement` (`project-view.ts:150-154`) and is relabeled "Remaining" only on financials (`financials.ts:111`). Overview correctly calls it "Still to record". |
| Filters combine and the totals row follows them | PASS | `queryPayments` `financials.ts:39-62`; `payment-ledger.tsx:31-32`, `91`; `payment-columns.tsx:87-98` | Stage, method, and status are ANDed with search. `LedgerTotal` sums the filtered set, not the current page. `financials.test.ts` covers the query helper. The three filters were not combined in the browser. |
| Export CSV | UNVERIFIED | `payment-ledger.tsx:35-43`; `paymentsToCsv` `financials.ts:144-156` | The button rendered. CSV is built from the visible rows with the seven columns. The download was not captured. |
| Designer-only "+ Record payment" | PASS | `financials-screen.tsx:61`, `82-88`; `can(..., "record_payment")` `rules.ts:233-237` | The homeowner financials page had no Record payment button. |
| Paid + Remaining = Estimated, and acknowledged-only Total Paid | PASS | `remaining` `rules.ts:114-116`; `financials.test.ts:42-74` | Browser: ₹9L + ₹8.9L = ₹17.9L, then ₹11.5L + ₹6.4L = ₹17.9L. Whitefield disputed ₹1.8L stayed out of Paid (card showed ₹14.7L). |
| Acknowledging ₹2,50,000 moves Paid to ₹11,50,000 | PASS | `acknowledgePayment` `rules.ts:667-699`; `CountUp.tsx:17-27` | Browser: Total paid became ₹11.5L, the awaiting sub-line cleared, the Financials badge disappeared, and the drawer included "Acknowledged by Ananya". CountUp animates over 600 ms; the frames were not inspected. |
| J5 record-payment fields and warning | PASS | `payment-schema.ts:19-30`; `payment-form.tsx:77-100`, `134-156`; `recordPayment` `rules.ts:614-664`; `record-payment-dialog.tsx:52` | Date defaults to `DEMO_NOW`. Reference is required for UPI, Bank Transfer, and Cheque and hidden for Cash. Amount above remaining opens an in-dialog warning ("Record anyway") rather than a second dialog. Creates `awaiting_ack`, notifies the homeowner, toasts "Payment recorded. Awaiting Ananya's acknowledgement." The dialog was not submitted in the browser. |
| J6 drawer, acknowledge/dispute, audit, resubmit, read-only | PASS | `payment-drawer.tsx:38-101`; `payment-actions.tsx:49-139`; `disputePayment` `rules.ts:702-736`; `resubmitPayment` `rules.ts:739-798` | Drawer showed amount, status, and the recorded audit line; acknowledge appended an audit entry. Dispute stays disabled until the reason is non-empty. Designer on `disputed` gets the reason and Edit and resubmit. Designer on `awaiting_ack` returns no actions (`payment-actions.tsx:103`). Dispute and resubmit were not clicked. |

## 4. Data integrity results

Clean store, before this audit's approval and acknowledgement.

| Item | Expected | Actual | Source |
| --- | --- | --- | --- |
| Koramangala health | Needs Attention | Needs Attention, reason "1 change request pending" | `rules.test.ts:47-48`; browser preview |
| Whitefield health | At Risk | At Risk: projected 18 days late, no update in 11 days, payment disputed | `rules.test.ts:59-63`; browser preview |
| Indiranagar health | On Track | On Track, reasons `[]`, progress 25 | `rules.test.ts:66-74`, `137` |
| Koramangala base budget | ₹17,90,000 | ₹17.9L on the preview and financials cards | `seed.ts:744`; browser |
| Total Paid (acknowledged) | ₹9,00,000 | ₹9L before acknowledgement | `rules.test.ts:85`; browser |
| Remaining before the change request | ₹8,90,000 | ₹8.9L card | `rules.test.ts:86`; browser |
| Budget after approving the pending cove request | ₹19,30,000 | `estimatedCost` becomes 1930000; end date 20 Dec 2026; remaining ₹10,30,000 | `rules.test.ts:94-107` |
| Pending change chip | +₹1.4L | "+₹1.4L pending change" on the Estimated card | browser; `pendingChangeChip` `financials.ts:93-103` |
| After acknowledging ₹2,50,000 | Paid ₹11,50,000 | ₹11.5L card, remaining card ₹6.4L, awaiting ₹0 | browser; `financials.test.ts:71-74` |
| Paid + Remaining = Estimated | Always | ₹9L+₹8.9L and ₹11.5L+₹6.4L both equal ₹17.9L | browser |
| Donut third slice | Guide label "Remaining" | ₹6.4L while the Remaining card was ₹8.9L, because the slice subtracts awaiting ack | `project-view.ts:150-154`; `financials.ts:111` |
| Koramangala progress | Weighted by allocation | 46% on the clean portfolio; 50% after kitchen moved 50 → 65 | `rules.test.ts:126`; browser |
| Whitefield disputed cash | ₹1,80,000, "Not received by us" | Designer preview action "Resolve ₹1.8L dispute"; Paid on that project ₹14.7L (disputed amount excluded) | `seed.ts:617-624`; browser |
| Indiranagar progress | about 25%, nothing overdue | 25%, On Track, dates 31 Jan 2027 → 31 Jan 2027 | browser |

Koramangala room allocations sum to ₹17,90,000 (`420000+480000+360000+220000+210000+100000`), so the weighted average is a true budget weight.

## 5. Rule violations

From `.cursor/rules/cheqzo.mdc` and Step 8. Paths are under `src/` unless noted.

| Rule | Result |
| --- | --- |
| `any`, `@ts-ignore`, `@ts-expect-error` | None in `src/`. |
| Hard-coded hex in components | None in `*.tsx`. Token hex lives in `src/app/globals.css:59-71`. The Indian flag gradient uses `#ff9933` and `#138808` in `globals.css:189`, outside the token table. |
| Health, progress, budget, or permission logic outside `rules.ts` | Screens call `projectHealth`, `summarizeProject`, `projectProgress`, `can`, and `totalPaid`. `financials.ts` and `portfolio.ts` format and filter those results. `TimelineCompare.tsx:18` recomputes the day delta from the two dates `rules.ts` already produced. `financialSlices` renames the chart slice (see the donut row above). |
| Components importing seed | `src/app/dev/components/page.tsx:21`. |
| `localStorage` outside Zustand persist | None in app code. Tests call `localStorage.clear()` in `rules.test.ts:240` and `portfolio.test.ts:154`. The wizard draft uses `sessionStorage` (`components/features/project-wizard/schema.ts:187-196`), outside the persist store. |
| `Date.now()` / `new Date()` in business logic | None. Only the comment in `lib/demo.ts:3`. |
| Mutations without a toast | Approve, request changes, reject, comment, post update, record, acknowledge, dispute, and resubmit each call `toast.success` or `toast.error`. Resend calls `toast.success("Code sent")`. |
| Lists missing skeleton, empty, or filtered-empty | Portfolio, updates, and financials implement all three. Overview activity and room grid have empty states. The wizard's new-project overview uses `OverviewScreen`, which has those empty states. `EmptyProjectOverview` (`project-wizard/empty-overview.tsx`) is exported and unused. |
| Disabled actions without a tooltip | `RoleGuard` and `DisabledHint` cover role and wizard disables. `ConfirmDialog.tsx:71` disables Reject with no tooltip. `payment-actions.tsx:120` disables Dispute the same way. `updates-screen.tsx:146` can disable Post update when there are no rooms, with no tooltip. |
| Files over 200 lines | `lib/rules.ts` 1079, `data/seed.ts` 842, `data/api.ts` 432, `components/ui/dropdown-menu.tsx` 269, `lib/rules.test.ts` 259, `lib/project-view.ts` 251, `lib/portfolio.ts` 242, `app/dev/components/page.tsx` 226, `components/features/project-wizard/schema.ts` 209, `lib/financials.test.ts` 204. The rule text targets components. The component files in that list are the dev page, the shadcn dropdown, and the wizard schema module. |
| Ahead of scope (Phase 6+) | Not failures. `projects/[projectId]/changes/page.tsx`, `rooms/page.tsx`, `team/page.tsx`, `settings/page.tsx`, and `settings/page.tsx` at the account route are title placeholders with Phase 6 or 7 TODOs. `CommandPalette.tsx` is a working palette. Section 8, which Phase 2 includes, asks for the search trigger, so the palette is in scope for the shell rather than an extra feature. `rules.ts` change-request functions implement Section 7, which Phase 1 requires. The change-request screen itself is not built. |

Dev overlay, not scored as a product failure: every route visited showed a Next.js notice, "This segment was dropped from rendering," pointing at `src/app/(auth)/login/page.tsx` and the other client segments. The pages still rendered. `next.config.ts` enables `cacheComponents`.

## 6. Fix list

### P0 — blocks a repeatable demo

1. **`?reset=1` does nothing.** `src/` never reads a `reset` search param. Visiting `/dashboard?reset=1` left mutated projects in place. **Fix:** on load, if `reset=1`, call the existing `api.reset()` / `useDb.reset()`, drop the param, and reload so `cheqzo-db` is the seed.

### P1 — visible in the Phase 0–5 demo

2. **Portfolio update links do not open the update.** `portfolio.ts` `projectActions` sets update hrefs to `/projects/{id}/updates`. The feed then shows "Select an update to review". **Fix:** use `updateHref(projectId, update.id)` from `project-view.ts`, the same helper Overview already uses.
3. **Two different "Remaining" figures on Financials.** The card is estimated − paid (₹8.9L, then ₹6.4L). The donut slice labeled Remaining is that number minus awaiting ack (₹6.4L while ₹2.5L was still awaiting). **Fix:** keep the non-overlapping slices, and label the third slice "Still to record" on Financials, matching Overview (`project-view.ts:152`). The Remaining card stays estimated − paid, so Paid + Remaining = Estimated.

### P2 — polish, not demo-blocking

4. Health tests do not isolate the 5–14 day band, the 3-day pending-update rule, the 2-day awaiting-ack rule, or At Risk beating Needs Attention (`rules.test.ts`).
5. List screens read `useLiveDb()` and skip the 300–600 ms `api.ts` latency (`data/live.ts`).
6. `/dev/components` imports `data/seed` and is a public route.
7. Meera's disabled-with-tooltip path exists, and nothing in Phases 0–5 can sign in as her. That switch is Settings (Phase 7), which is still a placeholder.
8. `ConfirmDialog` and the dispute button disable themselves with no tooltip.
9. Wizard drafts live in `sessionStorage` (`schema.ts`), outside the Zustand persist store.
10. `rules.ts`, `seed.ts`, `api.ts`, and the files listed in Section 5 exceed 200 lines.
11. Lightbox keyboard nav was not exercised; the handler is in `Lightbox.tsx:25-32`.
12. `EmptyProjectOverview` is unused. New projects already hit `OverviewScreen` empty states.

## 7. Ready-to-paste fix prompt

```
@docs/CHEQZO_BUILD_GUIDE.md @docs/VERIFICATION_REPORT.md
Fix only the P0 and P1 items in docs/VERIFICATION_REPORT.md. Stay inside Phases 0 to 5. Do not build change requests, rooms, team, settings, or any other Phase 6+ screen.

1. Honour ?reset=1. When that param is present, call the existing demo reset (api.reset / the Zustand store reset), remove the param, and reload so cheqzo-db is the seed again. Do not add a Settings screen.
2. Portfolio "Needs your action" update links must open that update. Point them at the same ?update= href Overview already uses (updateHref in src/lib/project-view.ts).
3. On Financials, the donut's third slice must not be labeled "Remaining". Label it "Still to record", matching Overview. Leave the Remaining card as estimated cost minus acknowledged payments, so Paid + Remaining = Estimated. The donut stays Paid / Awaiting ack / Still to record and those three amounts sum to the estimated cost.

After the edits run npm run lint, npm run test, and npm run build. In the browser, confirm: a mutated project returns to seed under ?reset=1; "Approve Kitchen update" on the Koramangala preview opens that pending update; the Financials Remaining card and the donut no longer show two different numbers under the word Remaining.
```

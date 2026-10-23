# Decisions

Choices made where the build guide was silent, or where the toolchain required a default.

## Phase 0

- Next.js 16.4.2 from `create-next-app`, with its defaults kept: Tailwind CSS v4, ESLint, `cacheComponents`, and `partialPrefetching`.
- shadcn/ui uses the `radix-nova` preset (Radix primitives, Lucide icons). The current CLI requires a preset, and the guide asks for shadcn/ui.
- shadcn's default neutral theme stays until Phase 1, which owns the Cheqzo design tokens. Geist stays until Phase 1 swaps in Inter and Fraunces. Its CSS variable is `--font-sans` so the shadcn theme resolves.
- `input-group` and `textarea` were installed because the shadcn registry pulls them in with Input and Command. `next-themes` is required by the generated Sonner component.
- `@hookform/resolvers` and `@vitejs/plugin-react` have optional peer conflicts with packages already in the tree (Zod 4 / Effect, Babel). `.npmrc` sets `legacy-peer-deps=true` so installs resolve.
- Route and component files from Section 3 are compiling stubs with TODO headers. They do not implement screens. `/` renders nothing; the auth redirect is Phase 2.
- `npm run test` runs `vitest run` so the phase gate exits. Setup follows the Next.js Vitest guide (`jsdom`, Testing Library). Vite is a direct dev dependency because Vitest 5 does not hoist it. Path aliases use Vite's `resolve.tsconfigPaths` instead of `vite-tsconfig-paths`.
- Node.js LTS 24.22.1 was installed with winget because Node was not on PATH.

## Phase 1

- `DEMO_NOW` is 22 Oct 2026, 12:00 local time, matching the guide's sample date. Relative times never call `Date.now()`.
- `Project.seedDelayDays` stores the timeline drift from Section 7.1. Whitefield is 18. Koramangala and Indiranagar are 0.
- Approved change requests in the seed set `appliedToBaseline`, because the guide says the base budget is already net of those approvals. Only a later approval (the cove-lit ceiling) adds cost and days.
- Payments carry an `audit` list so Section 7.5 status changes have a trail. The Section 5 payment shape is otherwise unchanged.
- `Role` stays `homeowner | designer`. Meera is a homeowner record with `access: "view"` and `accountKind: "family"`, so the permission matrix can tell her apart from Ananya. Her team row is `active` so the later demo switch can open Koramangala; the guide's "invited" is how she joined.
- Site supervisors are team members with view access. They are not login users.
- Kids Bedroom progress is 20%, as in the room table. The changes-requested update still reads 10% → 20% and does not move progress.
- Koramangala budget allocations are 4.2L, 4.8L, 3.6L, 2.2L, 2.1L, and 1.0L. They sum to the ₹17.9L base. Whitefield is ₹48L and Indiranagar is ₹27L; the guide does not set those budgets. Indiranagar room weights are equal so progress is exactly 25%.
- The awaiting-acknowledgement payment is dated 20 Oct, which is 2 days before `DEMO_NOW`. The rule uses a strict "more than 2 days", so that payment does not by itself mark Koramangala as Needs Attention. The pending change request does.
- Tailwind's `bg-muted` and `bg-accent` stay light washes so shadcn hover states keep working. The guide tokens `--muted` (#6B6A64) and `--accent` (#C8873A) are the text color and `brass` color. Cheqzo is light-only, so `.dark` repeats the light tokens.
- `DataTable` uses TanStack Table's `useLegacyTable` compatibility hook. The installed v9 `useTable` requires a features object that does not fit a reusable column API.
- Reset restores entities and keeps the latency toggle. Latency defaults to on (450 ms).
- `/dev/components` is a temporary gallery and reads the seed so the health and budget figures are computed, not typed in. Product screens will go through `api`.
- Session state persists `userId`. The role is read from the user record.

## Phase 2

- A verified phone is stored on the session before a role is chosen. `userId` alone still counts as signed in, so a Phase 1 session opens the app. Sign-out clears both.
- `/role` redirects to the dashboard once a user is chosen. Refresh keeps that user; the card highlight before Continue does not.
- Avatar Profile and Settings both open `/settings`. That is the only account route in the map.
- The shell reads the persisted store through `src/data/live.ts` so badge counts, the project switcher, and notifications update when the store changes. Mutations still go through `api`.
- Sidebar badges count pending updates, payments awaiting acknowledgement, and pending change requests. A count of zero is hidden.
- Search and the notification popover ship with the Section 8 shell. Creating notifications from later actions, and the Meera switch, stay in Phase 7.
- Pasted phone numbers longer than 10 digits drop a leading `91` before validation.
- The command palette links payments to the project financials page. Room results use `?room=`.
- Homeowner visits to `/projects/new`, unknown project ids, and projects outside the signed-in account render the G3 screen inside the shell. Other project routes show a title placeholder until their phase.
- `/dev/components` stays public so the Phase 1 gallery does not require a login.
- The sidebar does not collapse to icons. The guide marks that as optional.
- The search hint reads Ctrl or ⌘ from the user agent after hydration. Both shortcuts open the palette.
- The phone field shows a small Indian-flag graphic from CSS. The flag emoji renders as the letters IN on Windows.
- `?fail=1` replaces the current page body with an inline error and Retry. It does not affect the shell.

## Phase 3

- Portfolio totals, filters, sort, and action links live in `src/lib/portfolio.ts` and call `rules.ts`. Components do not recompute health, budget, or permissions.
- KPIs cover the whole signed-in portfolio. Search and health filters only change the list.
- The row indicator counts pending site updates. Koramangala shows "2 pending".
- Designer "Payments awaiting acknowledgement" is the rupee sum, shown compact.
- Default sort is health, worst first. Progress sorts least complete first. Deadline sorts the soonest projected end first. Ties use the project name.
- List view uses the split pane. Grid view is a card grid with the preview beside it.
- Search, health, sort, and layout are stored in the query string.
- Save draft writes `sessionStorage` (`cheqzo-project-draft`) and survives refresh until the project is created. Back and Next keep the in-memory draft. A partial draft can be saved before the step is valid.
- The first cover preset is selected by default. An uploaded cover is a session-only blob URL. Preset covers persist.
- BHK is Studio or 1–5 BHK. Rooms are optional. An incomplete room row blocks Next. Allocation is compared with the budget from step 4 and warns without blocking. Before that budget is set, the rooms step says the budget comes next.
- A known homeowner phone is linked to that account. A new phone creates a homeowner user. A designer phone is rejected. Invite now marks the client invited and adds an invite notification.
- Room order can be dragged or moved with the up and down buttons.
- Create waits 800 ms while demo latency is on, and skips the wait when latency is off.
- A project with no updates, payments, or change requests shows an empty overview, including any rooms from the wizard. Seeded projects keep the Phase 4 overview placeholder.

## Phase 4

- The overview is the same screen for a new project and a seeded one. Empty activity, an empty action list, and an empty room grid are the empty states. The Phase 3 placeholder is no longer used.
- The budget donut slices are paid, awaiting acknowledgement, and the amount not yet recorded (`remaining − awaiting`). Those three add up to the estimated cost. The Remaining card stays `estimated − paid`, which still includes money that is awaiting acknowledgement.
- Recent activity lists the eight newest updates, payments, and change requests.
- The next payment stage is the stage after the latest recorded payment. Koramangala's latest payment is Carpentry, so the next stage is Electrical & Plumbing. A project with no payments shows Advance.
- Feed dates group as Today, Yesterday, This week, Last week, then the month name. Weeks start on Monday, measured from `DEMO_NOW`.
- Filters, sort, and the open update are stored in the query string. Nothing is selected until a card or a `?update=` link is opened.
- Approve, request changes, and reject notify the designer and link to that update. Posting with "Notify client" on notifies the homeowner the same way. Comments do not send a notification.
- Anyone who can open the project can add a discussion comment. Decisions stay on the permission matrix: the designer sees no decision buttons, and view-only access sees them disabled.
- A posted update waits 700 ms while demo latency is on, and skips the wait when latency is off. Uploaded photos use session blob URLs. The persisted store drops `blob:` photos, so the update remains after refresh and the pictures do not.
- Room cards link to `/projects/[id]/rooms?room=`. That workspace is still the Phase 7 placeholder.

## Phase 5

- The financials donut uses the same three slices as the overview: paid, awaiting acknowledgement, and the amount not yet recorded (`remaining − awaiting`). The third slice is labeled Remaining. The Remaining card stays `estimated − paid`, so paid + remaining equals the estimated cost even while money is awaiting acknowledgement.
- The ledger total adds up every visible row, including payments that are not yet acknowledged.
- Compact rupees keep the Phase 1 formatter, so ₹9,00,000 reads ₹9L. The shared status badge stays "Awaiting Ack", and an acknowledged badge includes a check.
- Recording a payment warns when the amount is above Remaining (`estimated − acknowledged`). The toast uses the homeowner's first name: "Payment recorded. Awaiting Ananya's acknowledgement."
- UPI, bank transfer, and cheque require a reference. Cash hides it. A receipt image is optional and stored as `receiptUrl`. Blob receipts are dropped on persist, the same way update photos are.
- Stage, method, status, the open payment (`?payment=`), and record (`?record=1`) live in the query string. Search stays in the ledger. New payment notifications, command-palette payments, and overview actions open that payment.
- A recorded or resubmitted payment uses the demo latency. The designer can edit a disputed payment before sending it back. View-only homeowners see Acknowledge and Dispute disabled.

## Phase 6

- Net cost and net days add up every approved request, including approvals already inside the base budget. Koramangala starts at +₹10,000 and +1 day. Next decision due is the date of the oldest pending request, or None.
- Approve asks for confirmation and shows the impact preview. Reject takes an optional comment. Withdraw asks for confirmation.
- Status, who raised it, the open request, and the raise dialog live in the query string (`status`, `by`, `request`, `raise`).
- A cost increase is danger-colored. A saving is success-colored and uses a minus sign.
- The counterparty is notified when a request is raised. The raiser is notified when it is approved or rejected. Those links open `?request=`.

## Phase 7

- Inspiration items keep a comment list. Seeded items start empty.
- Team rows store `lastActiveAt`. Invited members omit it until the demo acceptance.
- Room spend is the estimated cost of specs marked ordered or installed. The specs tab compares every spec with the allocation and warns when the total is higher.
- Room activity lists that room's updates and change requests, oldest first.
- The designer can set any spec status. A homeowner who can approve can only move a proposed spec to approved. Anyone who can open the project can comment on inspiration.
- Family and site supervisors can be view or approve. Owner and designer rows stay full and cannot be removed or have their access changed.
- Changing a family member's access updates the login with the same phone. Meera is the only family login.
- An invite is stored immediately. Five seconds later, in the same browser session, it becomes active and shows a toast. Refreshing during those five seconds leaves it invited. Once active, it persists.
- Duplicate invites compare a normalized phone or lowercased email on that project.
- Notification preferences are visual only and reset when the page reloads. Profile saves name and email. Phone stays the account key. Avatar and cover uploads are session blob URLs and are dropped on persist, the same way update photos are.
- Project status can be set back to active with Resume, so hold and complete are not a one-way trap.
- Switching to a demo user who cannot see the open project returns to the dashboard.
- Seeded notifications and command-palette results open the specific update, payment, or change request. The raise action opens `?raise=1`.
- The notification popover and command palette already shipped with the shell. This phase finishes their deep links and the Meera switch.

## Phase 8

- Auth stays a client guard. Until the persisted session has hydrated, the guard renders the page instead of replacing it, so Next can prerender each segment. The redirect still runs once the session is known.
- `?fail=1` is read in a sibling of the page, so a missing search param does not take the page out of the shell. Retry still clears the flag.
- A project route renders its page until the signed-in user is known. Unknown or hidden projects still show the not-allowed screen.
- `/dev/components` returns not-found unless `CHEQZO_DEV_COMPONENTS=1`.
- Disabled confirms, dispute without a reason, post-update with no rooms, table page edges, and team access items that are already selected explain themselves with a tooltip.
- Data tables say "Nothing matches" when a search or column filter hides every row and the list itself is not empty.
- The photo lightbox renders on `document.body`. The updates filter bar is sticky, so a fixed overlay inside the detail pane sat underneath it.



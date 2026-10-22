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


# Cheqzo: Demo-Ready Build Guide for Cursor

> **Cheqzo** is a desktop-first web app that gives homeowners and interior design studios a single source of truth for renovation progress, money, and approvals.
> This document tells Cursor exactly what to build, screen by screen, so the result is **demo-ready**: polished, believable, and runnable with zero backend.

---

## Table of Contents

0. [How to use this document](#0-how-to-use-this-document)
1. [Demo goal and scope](#1-demo-goal-and-scope)
2. [Tech stack (locked)](#2-tech-stack-locked)
3. [Project structure](#3-project-structure)
4. [Design system](#4-design-system)
5. [Data model](#5-data-model)
6. [Seed data](#6-seed-data)
7. [Business rules](#7-business-rules)
8. [App shell and global behavior](#8-app-shell-and-global-behavior)
9. [Route map](#9-route-map)
10. [Screen specifications](#10-screen-specifications)
11. [Phased build plan with Cursor prompts](#11-phased-build-plan-with-cursor-prompts)
12. [Demo script](#12-demo-script)
13. [Polish and QA checklist](#13-polish-and-qa-checklist)
14. [Cursor rules file](#14-cursor-rules-file)
15. [Out of scope](#15-out-of-scope)

---

## 0. How to use this document

1. Save this file as `docs/CHEQZO_BUILD_GUIDE.md` in the repo.
2. Copy the rules from [Section 14](#14-cursor-rules-file) into `.cursor/rules/cheqzo.mdc`.
3. Build **one phase at a time** ([Section 11](#11-phased-build-plan-with-cursor-prompts)). Start each Cursor chat with:
   `@docs/CHEQZO_BUILD_GUIDE.md Execute Phase N only. Do not start Phase N+1.`
4. After each phase run `npm run lint && npm run build`. Do not move on until both pass and the phase's **Definition of Done** is met.
5. **Precedence:** if this doc is explicit, follow it. If it is silent, choose the simplest option and record the choice in `docs/DECISIONS.md`.

---

## 1. Demo goal and scope

### What "demo-ready" means

- A first-time viewer can understand the product in under 60 seconds.
- A 7-minute scripted walkthrough ([Section 12](#12-demo-script)) runs end to end with **no dead ends, no console errors, and no empty screens**.
- Every action visibly changes something: budget cards update, badges flip, progress bars move, toasts confirm.
- Data feels real: Indian names, locations, ₹ amounts in lakh notation, realistic room photos and dates.
- Works flawlessly at **1440×900** and **1920×1080**. Minimum supported width: **1280px**.

### Approach

| Decision | Choice |
| --- | --- |
| Backend | **None.** Typed mock data layer behind async functions with 300 to 600 ms artificial latency. |
| Persistence | Zustand `persist` to `localStorage`, so changes survive refresh. |
| Reset | "Reset demo data" button in Settings and a `?reset=1` URL param. |
| Auth | Fake phone + OTP. Any 10-digit number works. OTP is always `123456`. |
| "Today" | Fixed constant `DEMO_NOW = 2026-10-22` so seed data never drifts. |
| Images | Seeded placeholder photos (see [Section 4.6](#46-images)). |

### Non-goals

Real backend, real SMS, real payments, file storage, mobile layouts, i18n, email, analytics.

---

## 2. Tech stack (locked)

Do not substitute libraries.

| Concern | Library |
| --- | --- |
| Framework | Next.js (latest stable) App Router, TypeScript strict |
| Styling | Tailwind CSS + CSS variables for tokens |
| Components | shadcn/ui (Button, Input, Dialog, Sheet, Tabs, Select, DropdownMenu, Popover, Tooltip, Badge, Card, Skeleton, Command, Sonner) |
| Icons | lucide-react |
| Tables | TanStack Table |
| Forms | React Hook Form + Zod |
| State | Zustand (+ `persist`) |
| Charts | Recharts (budget donut, progress sparkline only) |
| Dates | date-fns |
| Motion | framer-motion (subtle: list enter, number count-up, drawer) |
| Fonts | `next/font`: **Inter** (UI) and **Fraunces** (page titles, big numbers) |

---

## 3. Project structure

```
src/
  app/
    (auth)/login/page.tsx
    (auth)/role/page.tsx
    (app)/layout.tsx                      # App shell
    (app)/dashboard/page.tsx              # Portfolio
    (app)/projects/new/page.tsx           # Create project wizard
    (app)/projects/[projectId]/
      page.tsx                            # Overview
      updates/page.tsx
      financials/page.tsx
      changes/page.tsx
      rooms/page.tsx                      # ?room=<id> selects workspace
      team/page.tsx
      settings/page.tsx                   # Project settings
    (app)/settings/page.tsx               # Account + demo controls
    not-found.tsx
  components/
    shell/ (Sidebar, Topbar, ProjectSwitcher, RoleSwitcher, NotificationsPopover)
    ui/                                   # shadcn
    shared/ (StatCard, HealthBadge, StatusBadge, ProgressBar, DataTable, SplitPane,
             PhotoGrid, Lightbox, TimelineCompare, EmptyState, Skeletons,
             ConfirmDialog, RoleGuard, MoneyText, CountUp)
    features/
      portfolio/ updates/ financials/ changes/ rooms/ team/ project-wizard/
  lib/
    format.ts          # formatINR, formatINRCompact, formatDate, relativeTime
    rules.ts           # health, progress, budget, permissions (pure, unit-testable)
    demo.ts            # DEMO_NOW, delay(), id generator
  data/
    seed.ts            # all seed data
    api.ts             # async mock API (reads/writes store, adds latency)
  store/
    session.ts         # current user, role
    db.ts              # persisted entities + actions
  types/index.ts
docs/
  CHEQZO_BUILD_GUIDE.md
  DECISIONS.md
```

---

## 4. Design system

### 4.1 Tone

Calm, premium, architectural. Think a well-run design studio, not a SaaS admin panel. Generous whitespace, soft warm neutrals, one confident accent, data that is dense but never cramped.

### 4.2 Tokens

| Token | Value | Use |
| --- | --- | --- |
| `--background` | `#F7F6F3` | App background |
| `--surface` | `#FFFFFF` | Cards, panels |
| `--border` | `#E6E3DC` | Dividers, card borders |
| `--foreground` | `#1D1D1B` | Primary text |
| `--muted` | `#6B6A64` | Secondary text |
| `--primary` | `#1F5F5B` | Buttons, active nav, links (deep teal) |
| `--accent` | `#C8873A` | Highlights, key numbers (brass) |
| `--success` | `#2E7D5B` | On Track, Acknowledged, Approved |
| `--warning` | `#B7791F` | Needs Attention, Pending |
| `--danger` | `#B3382C` | At Risk, Rejected, Disputed |
| `--info` | `#2F6FA3` | Informational, Changes Requested |

- **Radius:** 12px cards, 8px inputs and buttons. **Shadow:** `0 1px 2px rgba(0,0,0,0.04)`, lift on hover.
- **Type scale:** page title Fraunces 28/36 semibold; section title Inter 16/24 semibold; body 14/20; caption 12/16; big numbers Fraunces 32/40.
- **Layout:** sidebar 248px fixed; top bar 64px; content padding 32px; max content width 1600px, fluid below.

### 4.3 Shared components (build once, reuse everywhere)

| Component | Behavior |
| --- | --- |
| `HealthBadge` | `On Track` (green), `Needs Attention` (amber), `At Risk` (red). Dot + label. Tooltip explains the reason (e.g. "Projected 18 days late, no update in 11 days"). |
| `StatusBadge` | Generic pill for Pending / Approved / Rejected / Changes Requested / Awaiting Ack / Acknowledged / Disputed / Invited / Active. |
| `StatCard` | Label, big number (CountUp on mount), optional sub-line and delta chip. |
| `ProgressBar` | 8px rounded bar, animated width, optional label; shows ghost segment for "proposed" progress on pending updates. |
| `DataTable` | TanStack Table: sortable headers, column filters, search box, row hover, sticky header, row click opens detail panel, pagination at 10 rows, empty state. |
| `SplitPane` | Master list (fixed 360 to 420px) + detail panel (flex). Detail is sticky with its own scroll. |
| `PhotoGrid` + `Lightbox` | 3-column grid, hover zoom, click opens full-screen lightbox with caption, arrows, keyboard nav (←, →, Esc). |
| `TimelineCompare` | Two horizontal bars: Original vs Current projected, with delay chip (+5 days). |
| `MoneyText` | Renders ₹ in Indian format; prop `compact` renders `₹19.3L` / `₹1.2Cr`. |
| `RoleGuard` | Hides or disables actions by role/permission; disabled state shows a tooltip ("Only the homeowner can approve"). |
| `EmptyState` | Icon, title, one line of help, primary CTA. |
| `ConfirmDialog` | Used for Reject, Dispute, Delete, Reset. |

### 4.4 Money and dates

- `formatINR(1930000)` → `₹19,30,000` (use `Intl.NumberFormat('en-IN')`).
- `formatINRCompact(1930000)` → `₹19.3L`; `≥ 1 crore` → `₹1.2Cr`; below 1 lakh use full format.
- Dates: `22 Oct 2026`; relative time for feeds ("2 days ago"), computed against `DEMO_NOW`.

### 4.5 Motion

- Page content fades up 8px over 200 ms.
- Numbers on StatCards count up over 600 ms on mount and when value changes.
- Drawer/Sheet slides from right over 220 ms.
- Respect `prefers-reduced-motion`.

### 4.6 Images

- Use seeded photos, e.g. `https://picsum.photos/seed/{key}/1200/800`, with the host added to `next.config` `images.remotePatterns`.
- Every image has a gradient placeholder while loading and a neutral fallback on error.
- Upload controls (Post Update, Room photos) accept real files and display them via `URL.createObjectURL`. They are session-only and are not persisted.

---

## 5. Data model

Put in `src/types/index.ts`.

```ts
export type Role = 'homeowner' | 'designer';
export type Health = 'on_track' | 'needs_attention' | 'at_risk';

export interface User {
  id: string; name: string; phone: string; email?: string;
  role: Role; avatarUrl?: string; studioName?: string;
}

export interface Project {
  id: string; name: string;
  propertyType: 'Apartment' | 'Villa' | 'Independent House' | 'Penthouse';
  bhk: string; areaSqft: number;
  location: { area: string; city: string };
  homeownerId: string; designerId: string; studioName: string;
  startDate: string; originalEndDate: string;      // ISO
  baseBudget: number;                              // before approved change requests
  coverImage: string;
  status: 'active' | 'completed' | 'on_hold';
}

export interface Room {
  id: string; projectId: string; name: string;
  type: 'living' | 'kitchen' | 'bedroom' | 'bathroom' | 'balcony' | 'dining' | 'study';
  areaSqft: number; progress: number;              // 0-100
  status: 'not_started' | 'in_progress' | 'awaiting_approval' | 'completed';
  activeTask: string; budgetAllocation: number;
  beforePhotos: string[]; inspiration: InspirationItem[]; specs: MaterialSpec[];
}

export interface InspirationItem { id: string; imageUrl: string; note: string; tag: string }

export interface MaterialSpec {
  id: string; category: 'Flooring' | 'Walls' | 'Ceiling' | 'Furniture' | 'Lighting' | 'Fixtures' | 'Hardware';
  item: string; brand?: string; finish?: string; quantity: number; unit: string; estCost: number;
  status: 'proposed' | 'approved' | 'ordered' | 'installed';
}

export interface Comment { id: string; authorId: string; text: string; createdAt: string }

export interface SiteUpdate {
  id: string; projectId: string; roomId: string; authorId: string;
  title: string; description: string;
  photos: { url: string; caption: string; kind: 'before' | 'progress' | 'after' }[];
  previousProgress: number; proposedProgress: number;
  status: 'pending' | 'approved' | 'changes_requested' | 'rejected';
  createdAt: string;
  decision?: { byId: string; at: string; comment?: string };
  thread: Comment[];
}

export interface Payment {
  id: string; projectId: string; amount: number; date: string;
  method: 'UPI' | 'Bank Transfer' | 'Cash' | 'Cheque'; reference?: string;
  stage: 'Advance' | 'Design' | 'Material' | 'Carpentry' | 'Electrical & Plumbing' | 'Finishing' | 'Handover';
  note?: string; recordedById: string;
  status: 'awaiting_ack' | 'acknowledged' | 'disputed';
  ackAt?: string; disputeReason?: string;
}

export interface ChangeRequest {
  id: string; projectId: string; roomId?: string; title: string; description: string;
  raisedById: string; raisedByRole: Role;
  costImpact: number;          // signed; negative = saving
  daysImpact: number;          // signed
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  createdAt: string; decidedAt?: string; decisionComment?: string;
}

export interface TeamMember {
  id: string; projectId: string; name: string; contact: string;
  role: 'owner' | 'family' | 'designer' | 'site_supervisor';
  access: 'view' | 'approve' | 'full'; status: 'active' | 'invited';
}

export interface Notification {
  id: string; userId: string; projectId: string;
  type: 'update_pending' | 'payment_ack' | 'change_request' | 'update_decided' | 'invite';
  title: string; body: string; createdAt: string; read: boolean; href: string;
}
```

---

## 6. Seed data

### 6.1 People

| Name | Role | Notes |
| --- | --- | --- |
| **Ananya Rao** | Homeowner | Demo homeowner login. Owns Koramangala Apartment and Whitefield Villa. |
| **Rohan Mehta** | Designer, *Studio Lumen* | Demo designer login. Manages all three projects. |
| Karthik Iyer | Homeowner | Owns Indiranagar Penthouse (visible to designer only). |
| Meera Rao | Family (view only) | Ananya's sister, invited to Koramangala. |
| Suresh Kumar | Site supervisor | Studio Lumen, on Koramangala and Whitefield. |

### 6.2 Projects

| Project | Type | Area | Original end | Health (computed) | Story |
| --- | --- | --- | --- | --- | --- |
| **Koramangala Apartment** | 3 BHK Apartment, 1,650 sqft, Bengaluru | Koramangala | 15 Dec 2026 | **Needs Attention** | Hero project for the demo. 2 pending updates, 1 pending change request, 1 payment awaiting acknowledgement. |
| **Whitefield Villa** | 4 BHK Villa, 3,200 sqft | Whitefield | 30 Nov 2026 | **At Risk** | Projected 18 days late, last update 11 days ago, 1 disputed payment. |
| **Indiranagar Penthouse** | 3 BHK Penthouse, 2,100 sqft | Indiranagar | 31 Jan 2027 | **On Track** | Healthy contrast. Early stage (about 25%). |

### 6.3 Koramangala Apartment (hero project) in detail

**Rooms**

| Room | Progress | Status | Active task |
| --- | --- | --- | --- |
| Living Room | 30% | awaiting approval | False ceiling framing |
| Kitchen | 50% | awaiting approval | Modular cabinet installation |
| Master Bedroom | 80% | in progress | Wardrobe paneling and finishing |
| Kids Bedroom | 20% | in progress | Electrical conduiting |
| Bathroom | 60% | in progress | Wall tiling |
| Balcony | 0% | not started | Awaiting material delivery |

Each room has 2 to 3 before photos, 3 inspiration items, and 4 to 6 material specs (e.g. *Kitchen: Hettich soft-close hardware, Kajaria 600×600 vitrified tiles, Quartz countertop in Calacatta*).

**Updates (newest first)**

| # | Room | Title | Progress | Status |
| --- | --- | --- | --- | --- |
| 1 | Kitchen | Base and wall cabinets installed | 50 → 65% | **Pending** |
| 2 | Living Room | False ceiling frame complete | 30 → 40% | **Pending** |
| 3 | Master Bedroom | Wardrobe shutters fitted | 70 → 80% | Approved |
| 4 | Bathroom | Wall tiling 60% complete | 40 → 60% | Approved |
| 5 | Kids Bedroom | Electrical conduits laid | 10 → 20% | Changes Requested (comment: "Please add a socket near the study desk") |
| 6 | Kitchen | Plumbing rough-in done | 30 → 50% | Approved |

Each update has 2 to 4 photos with captions and a short description.

**Money (computed from the rules in Section 7)**

| | Amount |
| --- | --- |
| Base budget | ₹17,90,000 |
| Pending change request | +₹1,40,000 and +5 days (Living Room cove-lit false ceiling) |
| **Budget after approving the change** | **₹19,30,000** |

| Date | Stage | Amount | Method | Status |
| --- | --- | --- | --- | --- |
| 02 Jul 2026 | Advance | ₹4,50,000 | UPI | Acknowledged |
| 10 Aug 2026 | Material | ₹3,00,000 | Bank Transfer | Acknowledged |
| 05 Sep 2026 | Carpentry | ₹1,50,000 | Cheque | Acknowledged |
| 20 Oct 2026 | Carpentry | ₹2,50,000 | UPI | **Awaiting acknowledgement** |

Total Paid (acknowledged) = **₹9,00,000**. Remaining = ₹8,90,000 now, **₹10,30,000** after the change request is approved.

**Change requests**

| Title | Raised by | Impact | Status |
| --- | --- | --- | --- |
| Cove-lit false ceiling in Living Room | Designer | +₹1,40,000, +5 days | **Pending** |
| Upgrade Master Bedroom wardrobe to full-height | Homeowner | +₹65,000, +3 days | Approved |
| Replace Kids Bedroom laminate with veneer | Homeowner | +₹40,000, +2 days | Rejected |
| Drop balcony wooden decking, use tiles | Designer | −₹55,000, −2 days | Approved |

(The base budget is already net of approved changes. Only **pending** requests are not yet applied.)

### 6.4 Whitefield Villa and Indiranagar Penthouse

Seed 5 to 6 rooms each, 3 to 4 updates each, 3 to 4 payments each, and 1 to 2 change requests each. Whitefield must include: 1 **disputed** payment (₹1,80,000 Cash, reason "Not received by us"), 0 pending updates, last update 11 days before `DEMO_NOW`. Indiranagar must include: no overdue items, progress about 25%.

### 6.5 Notifications

Seed 4 to 6 per role, referencing the pending items above (e.g. *Homeowner: "Kitchen update awaiting your approval"*, *"₹2.5L payment awaiting acknowledgement"*, *"Change request: Cove-lit false ceiling"*; *Designer: "Karthik acknowledged ₹3L payment"*).

---

## 7. Business rules

Implement as **pure functions in `lib/rules.ts`** with unit tests (Vitest). UI must derive values from these functions, never hard-code.

### 7.1 Project timeline

```
approvedDays        = sum(daysImpact) of approved change requests *applied after seed*
projectedEndDate    = originalEndDate + approvedDays  (+ seeded drift per project)
delayDays           = projectedEndDate - originalEndDate
```

Seed drift lets Whitefield show an 18-day delay without needing 18 days of change requests (store `seedDelayDays` on the project).

### 7.2 Health badge

| Health | Condition (first match wins) |
| --- | --- |
| **At Risk** | `delayDays > 14` **or** no approved/pending update in the last **10** days **or** any payment disputed |
| **Needs Attention** | `delayDays` between 5 and 14 **or** any update pending **> 3 days** **or** any payment awaiting ack **> 2 days** **or** a change request pending |
| **On Track** | Otherwise |

Return `{ health, reasons: string[] }`. Reasons feed the tooltip.

### 7.3 Progress

- **Room progress:** set by approved updates (`room.progress = update.proposedProgress`).
- **Project progress:** weighted average of room progress by `budgetAllocation`.
- A pending update shows its proposed progress as a ghost segment, not as real progress.

### 7.4 Update approval workflow (Homeowner)

| Action | Result |
| --- | --- |
| **Approve** | Update → `approved`. Room progress → `proposedProgress`. Project progress recalculates. Designer notified. Toast: "Kitchen progress updated to 65%". |
| **Request changes** | Comment **required**. Update → `changes_requested`. Progress unchanged. Designer notified. Designer can reply and post a revised update. |
| **Reject** | Confirm dialog + reason **required**. Update → `rejected`. Progress unchanged. |

Only `pending` updates can be actioned. Users with `view` access see actions disabled.

### 7.5 Payment workflow

```
Designer records → awaiting_ack
   ├─ Homeowner acknowledges → acknowledged   (counts toward Total Paid)
   └─ Homeowner disputes (reason) → disputed
          └─ Designer edits and re-submits → awaiting_ack
```

- **Total Paid** counts only `acknowledged` payments.
- "Awaiting acknowledgement" total is shown as a sub-line on the Paid card.
- **Remaining** = `estimatedCost − totalPaid`.
- Every status change writes an audit entry shown in the payment drawer.

### 7.6 Budget and change requests

```
estimatedCost = baseBudget + sum(costImpact of approved CRs applied after seed)
```

- Either role can raise a change request. The **counterparty** decides it.
- **Approve:** adds `costImpact` to estimated cost and `daysImpact` to projected end date; budget cards and timeline animate; notifications sent.
- **Reject:** no financial/timeline change; comment optional.
- Raiser can **withdraw** a pending request.
- Show the **impact preview** ("Estimated cost ₹17.9L → ₹19.3L, End date 15 Dec → 20 Dec") before the counterparty confirms.

### 7.7 Permissions matrix

| Capability | Homeowner (owner) | Family: view | Family: approve | Designer |
| --- | --- | --- | --- | --- |
| See project, rooms, financials | ✅ | ✅ | ✅ | ✅ |
| Create / configure project | ❌ | ❌ | ❌ | ✅ |
| Post site update | ❌ | ❌ | ❌ | ✅ |
| Approve / request changes / reject update | ✅ | ❌ | ✅ | ❌ |
| Record payment | ❌ | ❌ | ❌ | ✅ |
| Acknowledge / dispute payment | ✅ | ❌ | ✅ | ❌ |
| Raise change request | ✅ | ❌ | ✅ | ✅ |
| Decide change request | ✅ (if raised by designer) | ❌ | ✅ | ✅ (if raised by homeowner) |
| Edit room specs | ❌ | ❌ | ❌ | ✅ |
| Invite family | ✅ | ❌ | ❌ | ✅ |

---

## 8. App shell and global behavior

### 8.1 Layout

```
┌───────────┬──────────────────────────────────────────────────────────┐
│           │ Top bar: Project switcher │ Search │ 🔔 │ Role │ Avatar    │
│  Sidebar  ├──────────────────────────────────────────────────────────┤
│  248px    │                                                          │
│           │                    Page content                          │
│           │                                                          │
└───────────┴──────────────────────────────────────────────────────────┘
```

### 8.2 Sidebar

- **Logo** (Cheqzo wordmark) at top.
- **Projects** (portfolio, `/dashboard`) is always visible.
- When a project is active, a labeled group appears beneath it: **Overview, Updates, Financials, Change Requests, Rooms, Team**, each with a live badge count (pending updates, awaiting-ack payments, pending change requests).
- **Settings** pinned at the bottom.
- Active item: teal tint background + left accent bar. Collapsible to icons at widths under 1280px (optional).

> Design note: the original brief lists Projects, Financials, Change Requests, Rooms, Team and Settings. **Updates** and **Overview** are added because the approvals feed is the product's core loop. Financials/Change Requests/Rooms/Team are **scoped to the active project**.

### 8.3 Top bar

| Element | Behavior |
| --- | --- |
| **Project switcher** | Dropdown of the user's projects with HealthBadge. Switching keeps the current section (e.g. stays on Financials). |
| **Search (⌘K / Ctrl+K)** | Command palette: jump to projects, rooms, payments, change requests, and actions (e.g. "Record payment"). |
| **Notifications** | Bell with unread count; popover lists items; click navigates and marks read; "Mark all read". |
| **Demo role switcher** | Segmented control: *Homeowner view / Designer view*. Swaps the session user instantly (Ananya ↔ Rohan) and refreshes the current page. Badge labeled "Demo". |
| **Avatar menu** | Profile, Settings, Sign out. |

### 8.4 Global behaviors

- **Auth guard:** unauthenticated users go to `/login`. Authenticated users without a role go to `/role`.
- **Toasts** (Sonner) for every mutation, bottom-right.
- **Loading:** skeletons that match the final layout; never a bare spinner on a full page.
- **Errors:** friendly inline error with Retry. Provide a hidden `?fail=1` flag to force one error for demo recovery if needed.
- **Empty states:** every list has one.
- **404 / Not allowed:** branded page with a way back to the dashboard.
- **Keyboard:** `⌘K` palette, `Esc` closes drawers/dialogs/lightbox.

---

## 9. Route map

| # | Screen | Route | Roles |
| --- | --- | --- | --- |
| A1 | Login (phone) | `/login` | Public |
| A2 | OTP verification | `/login` (step 2) | Public |
| A3 | Role selection | `/role` | Authenticated |
| P1 | Portfolio dashboard | `/dashboard` | Both (role-aware) |
| P2 | Create project wizard | `/projects/new` | Designer |
| J1 | Project overview | `/projects/[id]` | Both |
| J2 | Updates feed and approvals | `/projects/[id]/updates` | Both |
| J3 | Post update | Sheet on J2 | Designer |
| J4 | Financials | `/projects/[id]/financials` | Both |
| J5 | Record payment | Dialog on J4 | Designer |
| J6 | Payment detail | Drawer on J4 | Both |
| J7 | Change requests | `/projects/[id]/changes` | Both |
| J8 | Raise change request | Dialog on J7 | Both |
| J9 | Rooms | `/projects/[id]/rooms` | Both |
| J10 | Room workspace | `/projects/[id]/rooms?room=[roomId]` | Both |
| J11 | Team | `/projects/[id]/team` | Both |
| J12 | Invite member | Dialog on J11 | Homeowner, Designer |
| J13 | Project settings | `/projects/[id]/settings` | Designer (edit), Homeowner (read) |
| S1 | Account settings and demo controls | `/settings` | Both |
| G1 | Notifications center | Popover in top bar | Both |
| G2 | Command palette | `⌘K` | Both |
| G3 | 404 / Not allowed | `not-found.tsx` | Both |

---

## 10. Screen specifications

Each screen lists **layout, content, functionality, states, and acceptance criteria**. Build exactly this.

---

### A1. Login: phone number

**Route** `/login`  **Roles** Public

**Layout:** Two-column split. Left 55%: brand panel with a large interior photo, tagline *"Every rupee, every room, every approval. In one place."*, and three short value props. Right 45%: centered form card (max 400px).

**Content:** Cheqzo logo, heading "Welcome back", phone input with `+91` prefix and flag, **Send OTP** primary button, small print "Demo: use any 10-digit number".

**Functionality**
- Zod validation: exactly 10 digits, starts with 6 to 9. Inline error text.
- Send OTP → 600 ms loading state → advance to A2.

**States:** idle, invalid, sending.

**Acceptance**
- [ ] Invalid number shows inline error and blocks submit.
- [ ] Enter key submits.
- [ ] Layout holds at 1280px and 1920px.

---

### A2. OTP verification

**Route** `/login` (step 2, animated swap)

**Content:** "Enter the 6-digit code sent to +91 98XXXXXX10", 6-box OTP input (auto-advance, paste support), **Verify** button, **Resend in 0:30** countdown, **Change number** link, hint "Demo OTP: 123456".

**Functionality**
- Correct OTP (`123456`) → success check animation → `/role`.
- Wrong OTP → shake + error "That code doesn't match. Try 123456."
- Resend enabled after countdown; shows toast "Code sent".

**Acceptance**
- [ ] Pasting 6 digits fills all boxes.
- [ ] Backspace moves focus back.
- [ ] Wrong code never navigates.

---

### A3. Role selection

**Route** `/role`

**Layout:** Centered, two large selectable cards side by side.

| Card | Title | Copy | Icon |
| --- | --- | --- | --- |
| 1 | **I'm a Homeowner** | Track progress, approve updates, stay in control of your budget. | Home |
| 2 | **I'm an Interior Designer** | Run projects, post site updates, record payments and get sign-offs. | Ruler/Pencil |

**Functionality:** Selecting a card highlights it, enables **Continue**. Continue sets session user (Homeowner → Ananya, Designer → Rohan) and routes to `/dashboard`.

**Acceptance**
- [ ] Continue is disabled until a role is chosen.
- [ ] Choice persists across refresh.

---

### P1. Portfolio dashboard

**Route** `/dashboard`  **Roles** Both, content differs

**Layout:** Page header + KPI row + **SplitPane** (project list left, project preview right).

**Page header:** Title "Your projects" (homeowner) / "Studio portfolio" (designer). Designer sees **+ New project** button.

**KPI row (4 StatCards)**

| Homeowner | Designer |
| --- | --- |
| Active projects | Active projects |
| Total budget (compact ₹) | Pending client approvals |
| Total paid | Payments awaiting acknowledgement |
| Items needing your action | Projects at risk |

**Project list (master)**
- Toggle **Grid / List** (default: list in split view).
- Search box + filter chips: *All, On Track, Needs Attention, At Risk*; sort by *Health, Progress, Deadline*.
- Each row/card: cover thumbnail, project name, property type + area, location, HealthBadge, progress bar with %, original → projected end date, and a small "2 pending" indicator.
- Selected item highlighted. Click selects and fills the preview; double-click or **Open project** navigates.

**Project preview (detail)**
- Cover image, name, location, studio/designer name.
- HealthBadge with reasons list ("Needs Attention: 1 change request pending, 2 updates awaiting approval").
- TimelineCompare (original vs projected).
- Mini budget summary: Estimated / Paid / Remaining (compact ₹) with a thin stacked bar.
- **Needs your action** list: up to 3 deep-links (e.g. "Approve Kitchen update", "Acknowledge ₹2.5L payment").
- Latest update thumbnail with caption.
- **Open project** primary button.

**States:** skeleton rows, empty ("No projects yet", designer CTA to create), filtered-empty.

**Acceptance**
- [ ] Homeowner sees 2 projects; Designer sees 3.
- [ ] Switching role in the top bar swaps data without a reload.
- [ ] Filters and sort work together.
- [ ] Each action link in the preview opens the right screen.

---

### P2. Create project wizard (Designer)

**Route** `/projects/new`

**Layout:** Left vertical stepper (4 steps) + right form card. Footer with **Back / Next / Save draft**.

| Step | Fields |
| --- | --- |
| **1. Basics** | Project name, property type (select), BHK, area (sqft), city, locality, cover image (upload or pick from 6 presets) |
| **2. Client** | Homeowner name, phone, email. Optional "Invite now" checkbox |
| **3. Floor plan and rooms** | Add rooms from presets (Living, Kitchen, Master Bedroom, Bedroom, Bathroom, Balcony, Dining, Study) or custom; per-room area and budget allocation. Live **allocation total** versus project budget with remaining-to-allocate indicator. Drag to reorder |
| **4. Budget and timeline** | Estimated budget (₹), start date, original end date. **Review summary** panel |

**Functionality**
- Zod validation per step; Next blocked until valid.
- Step 3 warns (not blocks) if allocation ≠ budget.
- **Create project** → 800 ms loading → success screen with confetti-free tasteful check, then routes to the new project's Overview with a toast "Project created".
- New project appears in dashboard and is fully usable (empty states everywhere are meaningful).

**Acceptance**
- [ ] Stepper allows going back without losing data.
- [ ] Created project persists after refresh.
- [ ] Overview of a new project shows empty states, not errors.

---

### J1. Project overview

**Route** `/projects/[id]`

**Layout:** Header strip + 12-column grid (8 / 4).

**Header strip:** project name (Fraunces), location · property type · area, HealthBadge, studio and designer, **overall progress** bar. Tabs are the sidebar group (no duplicate tab bar).

**Main column (8)**
1. **Budget summary cards** (3 StatCards): *Estimated cost*, *Total paid* (sub-line "₹2.5L awaiting acknowledgement"), *Remaining balance*. Donut chart beside them.
2. **Timeline:** TimelineCompare, with "Original 15 Dec 2026 → Projected 15 Dec 2026" and delay chip.
3. **Room progress grid:** cards per room with photo, name, progress, active task, status badge. Click → J10.
4. **Recent activity** list (updates, payments, change requests) with relative times.

**Side column (4)**
- **Needs your action** card (role-aware): pending updates, payments to acknowledge, change requests to decide (homeowner) or revisions requested, payments disputed (designer). Each links to the right screen.
- **Team** mini-list with avatars.
- **Key dates**: start, next payment stage, projected handover.

**Acceptance**
- [ ] All numbers equal the Financials and Rooms screens.
- [ ] Action card counts match sidebar badges.
- [ ] Approving an update elsewhere changes progress here instantly.

---

### J2. Updates feed and approvals

**Route** `/projects/[id]/updates`

**Layout:** SplitPane. Left: filters + feed. Right: update detail with decision panel.

**Left: feed**
- Filter chips: *All, Pending, Approved, Changes Requested, Rejected*; room filter dropdown; sort newest/oldest.
- Chronological cards grouped by date ("Today", "Last week", "September"). Each card: room tag, title, author + time, 3-photo thumbnail strip, status badge, progress delta chip ("50% → 65%").
- Designer sees **+ Post update** button (opens J3).

**Right: update detail**
- Title, room, author, timestamp, description.
- **Media gallery** (PhotoGrid) with before/progress/after tags; click opens Lightbox.
- **Progress change:** ProgressBar showing current vs proposed with ghost segment and delta.
- **Decision panel** (Homeowner/approver, only if `pending`):
  - **Approve** (primary)
  - **Request changes** (opens required comment field inline)
  - **Reject** (ConfirmDialog with required reason)
- **Discussion thread** below: comments with avatars, add-comment input (both roles).
- After a decision, the panel shows the decision summary (who, when, comment) instead of buttons.

**States:** skeleton, empty feed, nothing selected ("Select an update to review").

**Acceptance**
- [ ] Approve updates room progress, project progress, sidebar badge count, and Overview.
- [ ] Request changes without a comment is blocked with inline error.
- [ ] Reject requires reason and confirm.
- [ ] Designer view of the same update has no decision buttons but can comment.
- [ ] Lightbox keyboard navigation works.

---

### J3. Post update (Designer)

**Route** Sheet on J2 (right, 560px)

**Fields:** Room (select, required), Title, Description, **Photo uploader** (drag-and-drop, multi-file, thumbnails with caption input and kind select: before/progress/after), **Proposed progress** slider (0 to 100, shows delta against current), "Notify client" toggle (default on).

**Functionality**
- Validation: room, title, at least 1 photo, proposed progress ≥ current.
- Submit → 700 ms → update appears at top of feed as `pending`, room status becomes `awaiting_approval`, homeowner receives a notification, toast "Update sent for approval".

**Acceptance**
- [ ] Switching to Homeowner view shows the new update as pending with a notification.
- [ ] Uploaded images render in the feed during the session.

---

### J4. Financials

**Route** `/projects/[id]/financials`

**Layout:** KPI row, ledger table, side drawer for detail.

**Budget summary cards (3 + donut)**
- **Estimated cost** (with "+₹1.4L pending change" chip when applicable)
- **Total paid** (acknowledged only; sub-line "₹2.5L awaiting acknowledgement")
- **Remaining balance**
- Donut: Paid / Awaiting ack / Remaining.

**Payment stages strip:** horizontal stepper of stages (Advance → Design → Material → Carpentry → Electrical & Plumbing → Finishing → Handover) with amount received per stage.

**Payment history table** (DataTable)

| Column | Notes |
| --- | --- |
| Date | Sortable |
| Stage | Filterable |
| Method | Icon + label (UPI, Bank Transfer, Cash, Cheque); filterable |
| Reference | UTR / cheque number, copy on hover |
| Amount | Right-aligned, ₹ Indian format, sortable |
| Status | StatusBadge: Awaiting ack / Acknowledged ✓ / Disputed |
| Recorded by | Avatar + name |

- Search, filters (stage, method, status), **Export CSV** button (generates and downloads CSV from current rows).
- Totals row at the bottom of the filtered set.
- Designer sees **+ Record payment** (J5).
- Row click opens J6.

**Acceptance**
- [ ] Paid + Remaining = Estimated, always.
- [ ] Acknowledging a payment moves it into Total Paid and animates the cards.
- [ ] Filters combine; totals row follows them.
- [ ] CSV downloads with correct data.

---

### J5. Record payment (Designer)

**Route** Dialog on J4

**Fields:** Amount (₹, formatted as typed), Date (default `DEMO_NOW`), Stage (select), Method (segmented: UPI / Bank Transfer / Cash / Cheque), Reference (required for UPI, Bank Transfer, Cheque; hidden for Cash), Note, optional receipt image.

**Functionality:** Submit → payment appears as `awaiting_ack`; homeowner notified; toast "Payment recorded. Awaiting Ananya's acknowledgement."

**Acceptance**
- [ ] Amount cannot exceed Remaining without a warning dialog.
- [ ] Reference rules per method are enforced.

---

### J6. Payment detail drawer

**Route** Sheet on J4 (right, 480px)

**Content:** Amount (large), status badge, all fields, receipt preview, and an **Audit trail** timeline (Recorded by Rohan · 20 Oct, 10:42 → Acknowledged by Ananya · 21 Oct, 09:10).

**Actions**
- Homeowner on `awaiting_ack`: **Acknowledge** (primary) and **Dispute** (opens required-reason field).
- Designer on `disputed`: sees the reason and **Edit and resubmit**.
- Others: read-only.

**Acceptance**
- [ ] Every status change appends an audit entry.
- [ ] Dispute without a reason is blocked.

---

### J7. Change requests

**Route** `/projects/[id]/changes`

**Layout:** KPI row + SplitPane (table left, detail right).

**KPI row:** Pending requests, Net cost impact (approved), Net days impact (approved), Next decision due.

**Table columns:** Title, Room, Raised by (avatar + role), Cost impact (colored: red for increase, green for saving), Days impact, Status, Date. Filters: status, raised-by.

**Detail panel**
- Title, description, room, raised by, date.
- **Impact cards:** Cost impact (signed, large) and Timeline impact (signed days).
- **Impact preview** (pending only): "Estimated cost ₹17.9L → ₹19.3L" and "End date 15 Dec → 20 Dec" with mini animated bars.
- **Actions** (counterparty): **Approve** / **Reject** (optional comment). Raiser sees **Withdraw**.
- Decision summary once decided.

**Acceptance**
- [ ] Approving the seeded Cove-lit ceiling request changes budget to ₹19.3L and end date +5 days on Overview, Financials, and Dashboard, with animation.
- [ ] Designer cannot approve a request they raised.
- [ ] Rejected/withdrawn requests change nothing financially.

---

### J8. Raise change request

**Route** Dialog on J7 (both roles)

**Fields:** Title, Description, Room (optional), Cost impact (₹, can be negative via a Cost increase / Saving toggle), Timeline impact (days, same toggle).

**Functionality:** Submit → appears as `pending` for the counterparty; notification; toast.

**Acceptance**
- [ ] Zero cost and zero days is blocked ("Add a cost or timeline impact").
- [ ] Saving renders green with a minus sign.

---

### J9. Rooms list

**Route** `/projects/[id]/rooms`

**Layout:** SplitPane. Left: room list. Right: room workspace (J10). First room auto-selected.

**Room list item:** thumbnail, name, area, progress bar, status badge, active task, budget allocation (compact ₹). Search + status filter. Designer sees **+ Add room**.

**Acceptance**
- [ ] Selecting a room updates `?room=` so the URL is shareable.
- [ ] List and workspace progress always match.

---

### J10. Room workspace

**Route** `/projects/[id]/rooms?room=[roomId]`

**Header:** Room name, status badge, progress bar, budget allocation, area, active task (editable inline by designer).

**Tabs**

| Tab | Content | Designer actions |
| --- | --- | --- |
| **Overview** | Progress, active task, last 3 updates for this room, open change requests for this room, spend versus allocation | Edit active task |
| **Specs** | Table: Category, Item, Brand, Finish, Qty, Unit, Est. cost, Status. Group by category with subtotals; total versus allocation | Add / edit / delete spec; change status (proposed → approved → ordered → installed) |
| **Photos** | **Before photos** grid and **progress timeline** of approved update photos, each with the date | Upload before photos |
| **Inspiration** | Masonry board of inspiration images with tag chips and notes | Add / remove items |
| **Activity** | All events for the room in chronological order | None |

Homeowner can **approve a proposed spec** (changes status to `approved`) and comment on inspiration items.

**Acceptance**
- [ ] Spec subtotals and total are correct and compare against allocation (over-budget shows a warning).
- [ ] Photos tab shows before photos next to latest progress photo (before/after slider is a bonus).
- [ ] Homeowner view has no edit controls except approving specs.

---

### J11. Team

**Route** `/projects/[id]/team`

**Layout:** KPI-free; a single DataTable and a side card.

**Table columns:** Member (avatar, name, contact), Role, Access (*View / Approve / Full*), Status (Active / Invited), Last active, row actions menu (change access, resend invite, remove).

**Side card:** "Who can do what", a compact permission summary derived from Section 7.7.

**Header actions:** **+ Invite member** (J12).

**Acceptance**
- [ ] Owner and designer rows cannot be removed.
- [ ] Changing a family member's access immediately changes what they can do when you switch the demo user to them (see Settings, S1).

---

### J12. Invite member

**Route** Dialog on J11

**Fields:** Name, Phone or email, Role (Family / Site supervisor), Access (View only / Can approve).

**Functionality:** Submit → member appears as `invited`; after 5 seconds a simulated acceptance flips it to `active` and fires a toast (demo effect). Helper text explains each access level.

**Acceptance**
- [ ] Duplicate contacts are rejected.
- [ ] Invite and activation both persist.

---

### J13. Project settings

**Route** `/projects/[id]/settings`

**Sections:** General (name, location, cover image), Timeline (original end date; read-only projected date), Budget (base budget, read-only estimated cost), Danger zone (mark on hold / complete). Designer can edit; homeowner sees read-only values.

**Acceptance**
- [ ] Edits reflect everywhere after saving.
- [ ] Homeowner sees all fields disabled with an explanatory banner.

---

### S1. Account settings and demo controls

**Route** `/settings`

**Sections**
- **Profile:** name, phone, email, avatar.
- **Notification preferences:** toggles (updates, payments, change requests). Visual only.
- **Demo controls** (visible card, labeled "Demo tools"):
  - **Switch demo user:** Ananya (Homeowner), Rohan (Designer), Meera (Family, view only), Karthik (Homeowner of Indiranagar).
  - **Reset demo data** (ConfirmDialog) → reseeds store and reloads.
  - **Toggle artificial latency** (on by default).
- **Sign out.**

**Acceptance**
- [ ] Switching to Meera disables all approval and payment actions with tooltips.
- [ ] Reset restores every seeded value, including pending items.

---

### G1. Notifications

**Route** Popover in top bar

**Content:** Tabs *All / Unread*, list of items with icon by type, title, body, relative time, unread dot. Click navigates to the relevant screen (deep link to the specific update / payment / change request) and marks as read. **Mark all read** link.

**Acceptance**
- [ ] Doing an action as one role creates a notification for the other role.
- [ ] Unread count in the bell matches the list.

---

### G2. Command palette

**Route** `⌘K` / `Ctrl+K`

**Content:** Grouped results: *Projects, Rooms, Payments, Change requests, Actions*. Role-aware actions (e.g. "Record payment" for designer only). Arrow keys + Enter.

**Acceptance**
- [ ] Selecting a result navigates and closes.
- [ ] Opens from any screen and respects the active role.

---

### G3. 404 / Not allowed

Branded page with illustration (simple SVG), message, **Back to dashboard**. Used for unknown routes, unknown project ids, and when a role opens a forbidden route (e.g. homeowner visits `/projects/new`).

---

## 11. Phased build plan with Cursor prompts

> Use the exact prompts below. Each ends with a **Definition of Done (DoD)**.

### Phase 0: Rules and scaffolding

**Prompt**
```
@docs/CHEQZO_BUILD_GUIDE.md
Execute Phase 0 only.
1. Create the Next.js App Router project with TypeScript strict, Tailwind, shadcn/ui, and the libraries in Section 2.
2. Create the folder structure in Section 3 (empty files with TODO headers are fine).
3. Add .cursor/rules/cheqzo.mdc from Section 14.
4. Add Vitest and a sample test.
Do not build any screens.
```
**DoD:** `npm run dev`, `lint`, `build`, `test` all pass.

### Phase 1: Foundations (types, data, rules, design system)

**Prompt**
```
@docs/CHEQZO_BUILD_GUIDE.md
Execute Phase 1 only.
- Implement types (Section 5), format helpers (4.4), rules.ts (Section 7) with Vitest tests for health, progress, budget, and permissions.
- Implement seed.ts exactly per Section 6, including the Koramangala hero project, and the async mock API + persisted Zustand store with latency and reset.
- Implement design tokens (4.2), fonts, and the shared components in 4.3. Create a temporary /dev/components page that renders every shared component.
```
**DoD:** Rules tests pass; `/dev/components` shows all components; Koramangala computes **Needs Attention**, Whitefield **At Risk**, Indiranagar **On Track**; budget after CR = ₹19.3L.

### Phase 2: Auth and app shell

**Prompt**
```
@docs/CHEQZO_BUILD_GUIDE.md
Execute Phase 2 only: screens A1, A2, A3, G3 and the app shell (Section 8) including sidebar with badge counts, top bar, project switcher, demo role switcher, avatar menu, auth guard. Dashboard can be a placeholder.
```
**DoD:** Full login → role → shell flow works; role switcher swaps users; guards redirect correctly.

### Phase 3: Portfolio and project creation

**Prompt**
```
@docs/CHEQZO_BUILD_GUIDE.md
Execute Phase 3 only: screens P1 and P2 exactly as specified, role-aware, with skeletons, empty states, and filters.
```
**DoD:** All P1 and P2 acceptance checks pass; a created project survives refresh.

### Phase 4: Project overview and updates

**Prompt**
```
@docs/CHEQZO_BUILD_GUIDE.md
Execute Phase 4 only: J1, J2, J3 including Lightbox, approval workflow, discussion thread, post-update sheet, and notifications for decisions.
```
**DoD:** Approve/request changes/reject all behave per 7.4; progress and sidebar badges update everywhere.

### Phase 5: Financials

**Prompt**
```
@docs/CHEQZO_BUILD_GUIDE.md
Execute Phase 5 only: J4, J5, J6 with the dual-sided acknowledgement flow, audit trail, CSV export, and animated budget cards.
```
**DoD:** Paid + Remaining = Estimated at all times; acknowledging the seeded ₹2.5L payment moves Paid from ₹9.0L to ₹11.5L.

### Phase 6: Change requests

**Prompt**
```
@docs/CHEQZO_BUILD_GUIDE.md
Execute Phase 6 only: J7 and J8 with impact preview and cross-screen propagation (budget, timeline, health).
```
**DoD:** Approving the seeded request updates Overview, Financials, Dashboard, and health reasoning; designer cannot approve their own request.

### Phase 7: Rooms, team, settings

**Prompt**
```
@docs/CHEQZO_BUILD_GUIDE.md
Execute Phase 7 only: J9, J10, J11, J12, J13, S1, G1, G2.
```
**DoD:** All tabs in the room workspace function; switching to Meera disables approvals; notifications deep-link correctly.

### Phase 8: Demo polish

**Prompt**
```
@docs/CHEQZO_BUILD_GUIDE.md
Execute Phase 8 only: run through Section 12 (demo script) step by step in the browser, fix every dead end, then work through Section 13 until every box is ticked. Do not add features.
```
**DoD:** Demo script completes without errors; Section 13 fully checked.

---

## 12. Demo script

**Duration:** about 7 minutes. Start from a freshly reset state at 1440×900 or larger.

| Step | Action | What to say / show |
| --- | --- | --- |
| 1 | `/login` → enter any number → OTP `123456` → pick **Homeowner** | "Phone and OTP, nothing to install, no passwords." |
| 2 | **Dashboard** as Ananya: two projects, health badges, preview panel | "At a glance: one needs attention, one is at risk, and exactly why." Hover the badge for reasons. |
| 3 | Open **Koramangala Apartment** → Overview | Budget cards, timeline, room progress, "Needs your action". |
| 4 | **Updates** → open Kitchen update → lightbox through photos → **Approve** | Progress jumps 50% → 65%; sidebar badge drops; toast. |
| 5 | Open Living Room update → **Request changes** with a comment | "Nothing gets signed off without a paper trail." |
| 6 | **Financials** → open ₹2.5L payment → **Acknowledge** | Paid card counts up from ₹9.0L to ₹11.5L; audit trail visible. |
| 7 | **Change Requests** → Cove-lit ceiling → read **impact preview** → **Approve** | Estimated cost animates ₹17.9L → ₹19.3L; end date +5 days; health recalculates. |
| 8 | **Rooms** → Kitchen → Specs, Photos, Inspiration | "Everything about a room in one workspace." |
| 9 | Top bar **role switcher → Designer** | Same data, designer's view: portfolio of 3, Whitefield At Risk. |
| 10 | Designer: **Record payment** (₹1,00,000 UPI) and **Post update** (Balcony) | Switch back to homeowner to show both arrive as pending with notifications. |
| 11 | **Settings → Switch to Meera (view only)** | Approve buttons disabled with tooltip. "Family sees everything, controls nothing." |
| 12 | **Reset demo data** | Ready for the next run. |

---

## 13. Polish and QA checklist

### Visual

- [ ] Consistent spacing (8px grid), no text clipped or overflowing at 1280px.
- [ ] All status colors come from tokens; no ad-hoc hex values in components.
- [ ] Every image has a loading placeholder and an error fallback.
- [ ] Numbers use tabular figures; ₹ amounts are right-aligned in tables.
- [ ] Focus rings visible on all interactive elements.

### Behavior

- [ ] Every mutation shows a toast and updates all related screens without refresh.
- [ ] Sidebar badge counts, Overview action card, and notifications always agree.
- [ ] Every list has loading skeleton, empty, and filtered-empty states.
- [ ] Disabled actions always explain why (tooltip).
- [ ] Browser back/forward works; deep links (`?room=`, notification links) open the right state.
- [ ] Refresh preserves session, role, and all changes; **Reset demo data** restores the seed.

### Data integrity

- [ ] Paid + Remaining = Estimated on every screen.
- [ ] Project progress equals the weighted room average.
- [ ] Health badges recompute after every relevant action.
- [ ] No negative balances or progress above 100%.

### Quality gates

- [ ] `npm run lint`, `npm run test`, and `npm run build` all pass.
- [ ] Zero console errors or warnings during the full demo script.
- [ ] No `any` types; no unused code or leftover `TODO`s.
- [ ] `/dev/components` route removed or hidden behind an env flag.
- [ ] README explains setup, demo credentials (any 10-digit number, OTP `123456`), and how to reset data.

---

## 14. Cursor rules file

Save as `.cursor/rules/cheqzo.mdc`.

```
---
description: Cheqzo engineering rules
globs:
alwaysApply: true
---

# Cheqzo project rules

## Source of truth
- docs/CHEQZO_BUILD_GUIDE.md is the spec. Follow it exactly. If it is silent, choose the simplest option and log it in docs/DECISIONS.md.
- Build only the phase requested. Never start the next phase.

## Stack (do not substitute)
- Next.js App Router, TypeScript strict, Tailwind, shadcn/ui, lucide-react, TanStack Table, React Hook Form + Zod, Zustand (persist), Recharts, date-fns, framer-motion, Sonner, Vitest.

## Code standards
- No `any`. Prefer explicit types from src/types/index.ts.
- Business logic lives in src/lib/rules.ts as pure functions. Components must not re-implement health, progress, budget, or permission logic.
- All data access goes through src/data/api.ts (async, with latency). Components never import seed data directly.
- Use "use client" only where needed; keep pages as server components when possible.
- Small components (<200 lines). Shared UI goes in components/shared and is reused, not duplicated.
- Use design tokens (CSS variables). No hard-coded hex colors in components.
- Format money with formatINR / MoneyText and dates relative to DEMO_NOW, never Date.now().

## UX standards
- Every list: loading skeleton, empty state, filtered-empty state.
- Every mutation: toast + immediate cross-screen update.
- Disabled actions must show a tooltip explaining why.
- Desktop-first: design for 1440px, support down to 1280px. No mobile layouts.

## Process
- After changes run: npm run lint && npm run test && npm run build. Fix all errors before finishing.
- Do not add features, libraries, or files not required by the current phase.
- Summarize what changed and list any deviations from the guide at the end of each task.
```

---

## 15. Out of scope

Real authentication and SMS, real database or API, file storage, payment gateway or UPI integration, email/SMS/push notifications, mobile and tablet layouts, multi-language support, role-based admin console, analytics, and PDF invoice generation. These are natural next steps after the demo validates the product.

---

*End of document.*

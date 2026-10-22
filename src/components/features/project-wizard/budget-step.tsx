"use client";

import { Field } from "@/components/features/project-wizard/field";
import type { ProjectDraft } from "@/components/features/project-wizard/schema";
import { MoneyText } from "@/components/shared/MoneyText";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";
import { allocationStatus } from "@/lib/rules";

function money(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function BudgetStep({
  draft,
  errors,
  onChange,
}: {
  draft: ProjectDraft;
  errors: Record<string, string>;
  onChange: (patch: Partial<ProjectDraft>) => void;
}) {
  const status = allocationStatus(
    draft.rooms.map((room) => money(room.budgetAllocation)),
    money(draft.budget),
  );
  const startLabel = draft.startDate ? formatDate(draft.startDate) : "Not set";
  const endLabel = draft.originalEndDate ? formatDate(draft.originalEndDate) : "Not set";

  return (
    <div className="grid grid-cols-[1fr_280px] gap-8">
      <div className="space-y-4">
        <Field label="Estimated budget (₹)" htmlFor="budget" error={errors.budget}>
          <Input id="budget" className="h-10" inputMode="numeric" value={draft.budget} onChange={(event) => onChange({ budget: event.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Start date" htmlFor="start-date" error={errors.startDate}>
            <Input id="start-date" className="h-10" type="date" value={draft.startDate} onChange={(event) => onChange({ startDate: event.target.value })} />
          </Field>
          <Field label="Original end date" htmlFor="end-date" error={errors.originalEndDate}>
            <Input id="end-date" className="h-10" type="date" value={draft.originalEndDate} onChange={(event) => onChange({ originalEndDate: event.target.value })} />
          </Field>
        </div>
      </div>
      <aside className="rounded-xl border border-border bg-background p-4">
        <h2 className="text-base leading-6 font-semibold text-foreground">Review</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Project</dt>
            <dd>{draft.name || "Untitled"} · {draft.propertyType || "Type not set"} · {draft.bhk || "BHK not set"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Place</dt>
            <dd>{draft.locality || "Locality"}, {draft.city || "city"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Client</dt>
            <dd>{draft.clientName || "Not set"}{draft.inviteNow ? " · Invite on create" : ""}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Rooms</dt>
            <dd>{draft.rooms.length === 0 ? "None yet" : draft.rooms.map((room) => room.name).join(", ")}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Budget</dt>
            <dd>
              <MoneyText amount={money(draft.budget)} compact /> · allocated <MoneyText amount={status.allocated} compact />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Timeline</dt>
            <dd>{startLabel} → {endLabel}</dd>
          </div>
        </dl>
        {status.budgetSet && !status.matches ? (
          <p className="mt-3 text-xs text-warning">Room allocations do not add up to the budget. You can still create the project.</p>
        ) : null}
      </aside>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import { FolderOpenIcon } from "lucide-react";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { HealthBadge } from "@/components/shared/HealthBadge";
import { MoneyText } from "@/components/shared/MoneyText";
import { PhotoGrid } from "@/components/shared/PhotoGrid";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { CardSkeleton, Skeletons } from "@/components/shared/Skeletons";
import { SplitPane } from "@/components/shared/SplitPane";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TimelineCompare } from "@/components/shared/TimelineCompare";
import { Button } from "@/components/ui/button";
import { createSeedData, IDS } from "@/data/seed";
import { formatINR, formatINRCompact } from "@/lib/format";
import { approveChangeRequest, actorFromUser, projectHealth, summarizeProject } from "@/lib/rules";

interface LedgerRow {
  date: string;
  stage: string;
  amount: string;
  status: string;
}

const ledger: LedgerRow[] = [
  { date: "02 Jul 2026", stage: "Advance", amount: "₹4,50,000", status: "Acknowledged" },
  { date: "10 Aug 2026", stage: "Material", amount: "₹3,00,000", status: "Acknowledged" },
  { date: "05 Sep 2026", stage: "Carpentry", amount: "₹1,50,000", status: "Acknowledged" },
  { date: "20 Oct 2026", stage: "Carpentry", amount: "₹2,50,000", status: "Awaiting Ack" },
  { date: "02 May 2026", stage: "Advance", amount: "₹5,00,000", status: "Acknowledged" },
  { date: "18 Jul 2026", stage: "Material", amount: "₹7,50,000", status: "Acknowledged" },
  { date: "01 Sep 2026", stage: "Carpentry", amount: "₹2,20,000", status: "Acknowledged" },
  { date: "01 Oct 2026", stage: "Finishing", amount: "₹1,80,000", status: "Disputed" },
  { date: "05 Sep 2026", stage: "Advance", amount: "₹4,00,000", status: "Acknowledged" },
  { date: "20 Sep 2026", stage: "Design", amount: "₹1,50,000", status: "Acknowledged" },
  { date: "18 Oct 2026", stage: "Material", amount: "₹3,00,000", status: "Acknowledged" },
  { date: "12 Jun 2026", stage: "Design", amount: "₹80,000", status: "Acknowledged" },
];

export default function ComponentGalleryPage() {
  const seed = useMemo(() => createSeedData(), []);
  const proof = useMemo(() => {
    const summaries = seed.projects.map((project) => ({
      project,
      health: projectHealth({
        project,
        updates: seed.updates,
        payments: seed.payments,
        changeRequests: seed.changeRequests,
      }),
      summary: summarizeProject({
        project,
        rooms: seed.rooms,
        updates: seed.updates,
        payments: seed.payments,
        changeRequests: seed.changeRequests,
      }),
    }));
    const hero = seed.projects.find((project) => project.id === IDS.koramangala);
    const cove = seed.changeRequests.find((request) => request.id === IDS.cove);
    const ananya = seed.users.find((person) => person.id === IDS.ananya);
    const approved =
      hero && cove && ananya ? approveChangeRequest({ request: cove, actor: actorFromUser(ananya) }) : null;
    const afterApproval =
      approved && approved.ok && hero
        ? summarizeProject({
            project: hero,
            rooms: seed.rooms,
            updates: seed.updates,
            payments: seed.payments,
            changeRequests: seed.changeRequests.map((request) =>
              request.id === IDS.cove ? approved.value.request : request,
            ),
          }).estimatedCost
        : 0;
    return { summaries, afterApproval };
  }, [seed]);

  const columns = useMemo<LegacyColumnDef<LedgerRow>[]>(
    () => [
      { accessorKey: "date", header: "Date" },
      { accessorKey: "stage", header: "Stage" },
      { accessorKey: "amount", header: "Amount" },
      { accessorKey: "status", header: "Status" },
    ],
    [],
  );
  const [selected, setSelected] = useState(ledger[0]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmed, setConfirmed] = useState("");

  return (
    <main className="page-enter mx-auto max-w-[1600px] space-y-12 px-8 py-8">
      <header>
        <p className="text-xs tracking-wide text-muted-foreground uppercase">Temporary gallery</p>
        <h1 className="font-display text-[28px] leading-9 font-semibold">Shared components</h1>
      </header>

      <section className="space-y-4">
        <h2 className="text-base leading-6 font-semibold">Health from the seed</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {proof.summaries.map(({ project, health }) => (
            <article key={project.id} className="hover-lift rounded-xl border border-border bg-surface p-4">
              <p className="font-medium">{project.name}</p>
              <div className="mt-3">
                <HealthBadge health={health.health} reasons={health.reasons} />
              </div>
            </article>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Budget after the cove-lit change request: <MoneyText amount={proof.afterApproval} compact />
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Estimated cost" value={1790000} formatValue={formatINRCompact} delta={{ label: "+₹1.4L pending", tone: "neutral" }} />
        <StatCard label="Total paid" value={900000} formatValue={formatINR} subline="₹2.5L awaiting acknowledgement" />
        <StatCard label="Remaining" value={890000} formatValue={formatINRCompact} />
      </section>

      <section className="flex flex-wrap gap-2">
        <StatusBadge status="pending" />
        <StatusBadge status="approved" />
        <StatusBadge status="changes_requested" />
        <StatusBadge status="rejected" />
        <StatusBadge status="awaiting_ack" />
        <StatusBadge status="acknowledged" />
        <StatusBadge status="disputed" />
        <StatusBadge status="invited" />
        <StatusBadge status="active" />
      </section>

      <section className="max-w-xl space-y-4">
        <ProgressBar value={50} proposed={65} label="50% → 65%" />
        <TimelineCompare startDate="2026-06-15" originalEnd="2026-12-15" projectedEnd="2026-12-20" />
      </section>

      <section>
        <SplitPane
          list={
            <ul>
              {proof.summaries.map(({ project, health, summary }) => (
                <li key={project.id} className="border-b border-border px-4 py-3">
                  <p className="font-medium">{project.name}</p>
                  <p className="text-xs text-muted-foreground">{Math.round(summary.progress)}% complete</p>
                  <div className="mt-2">
                    <HealthBadge health={health.health} reasons={health.reasons} />
                  </div>
                </li>
              ))}
            </ul>
          }
          detail={
            <div className="space-y-3 p-6">
              <h2 className="font-display text-[28px] leading-9 font-semibold">{selected?.stage} payment</h2>
              <p className="text-sm text-muted-foreground">Select a ledger row to see it here.</p>
              <MoneyText amount={250000} />
            </div>
          }
        />
      </section>

      <PhotoGrid
        photos={[
          { url: "https://picsum.photos/seed/gallery-1/1200/800", caption: "Cabinet run", kind: "progress" },
          { url: "https://picsum.photos/seed/gallery-2/1200/800", caption: "Ceiling frame", kind: "before" },
          { url: "https://picsum.photos/seed/gallery-3/1200/800", caption: "Wardrobe shutters", kind: "after" },
        ]}
      />

      <DataTable
        data={ledger}
        columns={columns}
        searchPlaceholder="Search payments"
        filters={[{ id: "status", label: "Status", options: ["Acknowledged", "Awaiting Ack", "Disputed"] }]}
        onRowClick={setSelected}
        emptyTitle="No payments"
        emptyDescription="Nothing matches this search."
      />

      <div className="flex flex-wrap items-center gap-3">
        <RoleGuard allowed={false} reason="Only the homeowner can approve">
          <Button>Approve</Button>
        </RoleGuard>
        <RoleGuard allowed={false} mode="hide" reason="Hidden">
          <Button>Hidden action</Button>
        </RoleGuard>
        <Button onClick={() => setConfirmOpen(true)}>Reject</Button>
        {confirmed ? <p className="text-sm text-muted-foreground">Rejected: {confirmed}</p> : null}
      </div>

      <EmptyState
        icon={FolderOpenIcon}
        title="No projects yet"
        description="Create a project to see it in the portfolio."
        actionLabel="New project"
        onAction={() => undefined}
      />

      <section className="space-y-3">
        <h2 className="text-base leading-6 font-semibold">Skeletons</h2>
        <CardSkeleton />
        <Skeletons />
      </section>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Reject this update?"
        description="The room progress stays where it is."
        confirmLabel="Reject"
        requireReason
        onConfirm={(reason) => setConfirmed(reason ?? "")}
      />
    </main>
  );
}

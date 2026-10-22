"use client";

import { Plus } from "lucide-react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";

import { BudgetSummary } from "@/components/features/financials/budget-summary";
import { PaymentDrawer } from "@/components/features/financials/payment-drawer";
import { PaymentLedger } from "@/components/features/financials/payment-ledger";
import { RecordPaymentDialog } from "@/components/features/financials/record-payment-dialog";
import { StageStrip } from "@/components/features/financials/stage-strip";
import { CardSkeleton, TableSkeleton } from "@/components/shared/Skeletons";
import { Button } from "@/components/ui/button";
import { useCurrentUser, useLiveDb, useStoresReady } from "@/data/live";
import { paymentQuery, pendingChangeChip, type PaymentQuery } from "@/lib/financials";
import { actorFromUser, can, summarizeProject } from "@/lib/rules";

export function FinancialsScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const route = useParams<{ projectId: string }>();
  const ready = useStoresReady();
  const user = useCurrentUser();
  const db = useLiveDb();

  function writeParams(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (!value) next.delete(key);
      else next.set(key, value);
    }
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  if (!ready || !user) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="grid grid-cols-3 gap-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <TableSkeleton />
      </div>
    );
  }

  const project = db.projects.find((item) => item.id === route.projectId);
  if (!project) return null;

  const payments = db.payments.filter((item) => item.projectId === project.id);
  const summary = summarizeProject({
    project,
    rooms: db.rooms,
    updates: db.updates,
    payments: db.payments,
    changeRequests: db.changeRequests,
  });
  const actor = actorFromUser(user);
  const canRecord = can(actor, "record_payment").allowed;
  const query = paymentQuery({
    search: params.get("q"),
    stage: params.get("stage"),
    method: params.get("method"),
    status: params.get("status"),
  });
  const selected = payments.find((item) => item.id === params.get("payment")) ?? null;
  const homeownerName = db.users.find((item) => item.id === project.homeownerId)?.name ?? "the client";

  function applyQuery(next: PaymentQuery) {
    writeParams({
      stage: next.stage === "all" ? null : next.stage,
      method: next.method === "all" ? null : next.method,
      status: next.status === "all" ? null : next.status,
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="font-display text-[28px] leading-9 font-semibold text-foreground">Financials</h1>
        {canRecord ? (
          <Button type="button" onClick={() => writeParams({ record: "1" })}>
            <Plus />
            Record payment
          </Button>
        ) : null}
      </header>
      <BudgetSummary summary={summary} chip={pendingChangeChip(db.changeRequests, project.id)} />
      <StageStrip payments={payments} />
      <PaymentLedger
        payments={payments}
        users={db.users}
        query={query}
        projectName={project.name}
        onQuery={applyQuery}
        onOpen={(paymentId) => writeParams({ payment: paymentId })}
      />
      <PaymentDrawer
        payment={selected}
        users={db.users}
        actor={actor}
        userId={user.id}
        remaining={summary.remaining}
        homeownerName={homeownerName}
        onOpenChange={(open) => {
          if (!open) writeParams({ payment: null });
        }}
      />
      {canRecord ? (
        <RecordPaymentDialog
          open={params.get("record") === "1"}
          onOpenChange={(open) => {
            if (!open) writeParams({ record: null });
          }}
          userId={user.id}
          projectId={project.id}
          payments={payments}
          remaining={summary.remaining}
          homeownerName={homeownerName}
          onRecorded={(paymentId) => writeParams({ record: null, payment: paymentId })}
        />
      ) : null}
    </div>
  );
}

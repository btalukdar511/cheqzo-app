"use client";

import { PaymentActions } from "@/components/features/financials/payment-actions";
import { PersonChip } from "@/components/features/financials/person-chip";
import { MoneyText } from "@/components/shared/MoneyText";
import { SeedImage } from "@/components/shared/SeedImage";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatDate, formatDateTime } from "@/lib/format";
import { personName } from "@/lib/project-view";
import type { Actor } from "@/lib/rules";
import type { Payment, User } from "@/types";

const AUDIT_LABEL = {
  recorded: "Recorded",
  acknowledged: "Acknowledged",
  disputed: "Disputed",
  resubmitted: "Resubmitted",
} as const;

export function PaymentDrawer({
  payment,
  users,
  actor,
  userId,
  remaining,
  homeownerName,
  onOpenChange,
}: {
  payment: Payment | null;
  users: User[];
  actor: Actor;
  userId: string;
  remaining: number;
  homeownerName: string;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={payment !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[480px] gap-0 overflow-y-auto sm:max-w-[480px]" style={{ width: 480, maxWidth: 480 }}>
        {payment ? (
          <>
            <SheetHeader>
              <SheetTitle>Payment</SheetTitle>
              <SheetDescription>Amount, receipt, and the acknowledgement trail.</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-5 px-4 pb-6">
              <div className="flex items-end justify-between gap-3">
                <MoneyText amount={payment.amount} className="font-display text-[32px] leading-10 font-semibold text-foreground" />
                <StatusBadge status={payment.status} />
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <Detail label="Date" value={formatDate(payment.date)} />
                <Detail label="Stage" value={payment.stage} />
                <Detail label="Method" value={payment.method} />
                <Detail label="Reference" value={payment.reference ?? "—"} />
                <div className="col-span-2">
                  <dt className="text-xs text-muted-foreground">Recorded by</dt>
                  <dd className="mt-1">
                    <PersonChip user={users.find((user) => user.id === payment.recordedById)} />
                  </dd>
                </div>
                {payment.note ? (
                  <div className="col-span-2">
                    <dt className="text-xs text-muted-foreground">Note</dt>
                    <dd className="mt-1 text-foreground">{payment.note}</dd>
                  </div>
                ) : null}
              </dl>
              {payment.receiptUrl ? (
                <div className="relative h-44 overflow-hidden rounded-lg border border-border">
                  <SeedImage src={payment.receiptUrl} alt="Receipt" sizes="480px" />
                </div>
              ) : null}
              {payment.disputeReason ? (
                <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">Disputed: {payment.disputeReason}</p>
              ) : null}
              <section>
                <h3 className="text-sm font-semibold text-foreground">Audit trail</h3>
                <ol className="mt-3">
                  {payment.audit.map((entry) => (
                    <li key={entry.id} className="relative border-l border-border pb-4 pl-4 last:pb-0">
                      <span className="absolute top-1.5 -left-1 size-2 rounded-full bg-primary" />
                      <p className="text-sm text-foreground">
                        {AUDIT_LABEL[entry.action]} by {personName(users, entry.actorId)}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(entry.at)}</p>
                      {entry.note ? <p className="mt-1 text-sm text-foreground">{entry.note}</p> : null}
                    </li>
                  ))}
                </ol>
              </section>
              <PaymentActions
                key={payment.id + payment.status}
                payment={payment}
                actor={actor}
                userId={userId}
                remaining={remaining}
                homeownerName={homeownerName}
              />
            </div>
          </>
        ) : (
          <SheetHeader>
            <SheetTitle>Payment</SheetTitle>
            <SheetDescription>Select a payment to see it here.</SheetDescription>
          </SheetHeader>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-foreground">{value}</dd>
    </div>
  );
}

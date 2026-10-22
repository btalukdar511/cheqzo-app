"use client";

import { useState } from "react";
import { toast } from "sonner";

import { PaymentForm } from "@/components/features/financials/payment-form";
import { blankPayment, writeFromValues } from "@/components/features/financials/payment-schema";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/data/api";
import { recordPaymentToast } from "@/lib/financials";
import type { Payment } from "@/types";

export function RecordPaymentDialog({
  open,
  onOpenChange,
  userId,
  projectId,
  payments,
  remaining,
  homeownerName,
  onRecorded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  projectId: string;
  payments: Payment[];
  remaining: number;
  homeownerName: string;
  onRecorded: (paymentId: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>The client acknowledges this before it counts as paid.</DialogDescription>
        </DialogHeader>
        {open ? (
          <PaymentForm
            defaultValues={blankPayment(payments)}
            remaining={remaining}
            submitLabel="Record payment"
            confirmLabel="Record anyway"
            busy={busy}
            onSubmit={async (values) => {
              setBusy(true);
              try {
                const created = await api.recordPayment(userId, projectId, writeFromValues(values));
                toast.success(recordPaymentToast(homeownerName));
                onRecorded(created.id);
                return true;
              } catch (caught) {
                toast.error(caught instanceof Error ? caught.message : "Could not record the payment");
                return false;
              } finally {
                setBusy(false);
              }
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

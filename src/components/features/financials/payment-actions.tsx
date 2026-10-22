"use client";

import { useState } from "react";
import { toast } from "sonner";

import { PaymentForm } from "@/components/features/financials/payment-form";
import { valuesFromPayment, writeFromValues } from "@/components/features/financials/payment-schema";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/data/api";
import { resubmitPaymentToast } from "@/lib/financials";
import { can, type Actor } from "@/lib/rules";
import type { Payment } from "@/types";

export function PaymentActions({
  payment,
  actor,
  userId,
  remaining,
  homeownerName,
}: {
  payment: Payment;
  actor: Actor;
  userId: string;
  remaining: number;
  homeownerName: string;
}) {
  const decision = can(actor, "decide_payment");
  const record = can(actor, "record_payment");
  const [busy, setBusy] = useState(false);
  const [disputing, setDisputing] = useState(false);
  const [reason, setReason] = useState("");
  const [editing, setEditing] = useState(false);
  const trimmed = reason.trim();

  async function acknowledge() {
    setBusy(true);
    try {
      await api.acknowledgePayment(userId, payment.id);
      toast.success("Payment acknowledged");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not acknowledge the payment");
    } finally {
      setBusy(false);
    }
  }

  async function dispute() {
    if (!trimmed) return;
    setBusy(true);
    try {
      await api.disputePayment(userId, payment.id, trimmed);
      toast.success("Payment disputed");
      setDisputing(false);
      setReason("");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not dispute the payment");
    } finally {
      setBusy(false);
    }
  }

  if (payment.status === "disputed" && record.allowed) {
    if (!editing) {
      return (
        <Button type="button" onClick={() => setEditing(true)}>
          Edit and resubmit
        </Button>
      );
    }
    return (
      <div className="space-y-3">
        <PaymentForm
          defaultValues={valuesFromPayment(payment)}
          remaining={remaining}
          submitLabel="Resubmit"
          confirmLabel="Resubmit anyway"
          busy={busy}
          onSubmit={async (values) => {
            setBusy(true);
            try {
              await api.resubmitPayment(userId, payment.id, writeFromValues(values));
              toast.success(resubmitPaymentToast(homeownerName));
              setEditing(false);
              return true;
            } catch (caught) {
              toast.error(caught instanceof Error ? caught.message : "Could not resubmit the payment");
              return false;
            } finally {
              setBusy(false);
            }
          }}
        />
        <Button type="button" variant="outline" onClick={() => setEditing(false)} disabled={busy}>
          Cancel
        </Button>
      </div>
    );
  }

  if (payment.status !== "awaiting_ack") return null;
  if (!decision.allowed && actor.role !== "homeowner") return null;

  const blocked = !decision.allowed;

  return (
    <div className="space-y-3">
      {disputing ? (
        <div className="space-y-2">
          <label className="block space-y-1.5 text-sm font-medium text-foreground">
            Reason
            <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Why is this payment disputed?" />
          </label>
          {reason.length > 0 && !trimmed ? <p className="text-xs text-danger">A reason is required</p> : null}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setDisputing(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={() => void dispute()} disabled={busy || !trimmed}>
              Dispute payment
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <RoleGuard allowed={!blocked} reason={decision.reason}>
            <Button type="button" onClick={() => void acknowledge()} disabled={busy || blocked}>
              Acknowledge
            </Button>
          </RoleGuard>
          <RoleGuard allowed={!blocked} reason={decision.reason}>
            <Button type="button" variant="outline" onClick={() => setDisputing(true)} disabled={busy || blocked}>
              Dispute
            </Button>
          </RoleGuard>
        </div>
      )}
    </div>
  );
}

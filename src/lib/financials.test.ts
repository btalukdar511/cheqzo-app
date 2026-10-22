import { describe, expect, it } from "vitest";

import { createSeedData, IDS } from "@/data/seed";
import {
  exceedsRemaining,
  financialSlices,
  formatInrInput,
  parseInrInput,
  paymentCsvName,
  paymentsToCsv,
  pendingChangeChip,
  queryPayments,
  recordPaymentToast,
  stageState,
  stageTotals,
} from "@/lib/financials";
import { formatINRCompact } from "@/lib/format";
import {
  acknowledgePayment,
  actorFromUser,
  disputePayment,
  recordPayment,
  resubmitPayment,
  summarizeProject,
} from "@/lib/rules";
import type { User } from "@/types";

function user(data: ReturnType<typeof createSeedData>, id: string): User {
  const found = data.users.find((item) => item.id === id);
  if (!found) throw new Error(id);
  return found;
}

function koramangala() {
  const data = createSeedData();
  const project = data.projects.find((item) => item.id === IDS.koramangala);
  if (!project) throw new Error("missing project");
  return { data, project };
}

describe("financials", () => {
  it("keeps paid plus remaining equal to the estimated cost", () => {
    const { data, project } = koramangala();
    const before = summarizeProject({
      project,
      rooms: data.rooms,
      updates: data.updates,
      payments: data.payments,
      changeRequests: data.changeRequests,
    });
    expect(before.totalPaid).toBe(900_000);
    expect(before.remaining).toBe(890_000);
    expect(before.totalPaid + before.remaining).toBe(before.estimatedCost);
    expect(formatINRCompact(before.totalPaid)).toBe("₹9L");

    const payment = data.payments.find((item) => item.id === IDS.payAwaiting);
    if (!payment) throw new Error("missing payment");
    const acknowledged = acknowledgePayment({
      payment,
      actor: actorFromUser(user(data, IDS.ananya)),
      designerId: IDS.rohan,
    });
    if (!acknowledged.ok) throw new Error(acknowledged.reason);
    const after = summarizeProject({
      project,
      rooms: data.rooms,
      updates: data.updates,
      payments: data.payments.map((item) => (item.id === payment.id ? acknowledged.value.payment : item)),
      changeRequests: data.changeRequests,
    });
    expect(after.totalPaid).toBe(1_150_000);
    expect(formatINRCompact(after.totalPaid)).toBe("₹11.5L");
    expect(after.awaitingAcknowledgement).toBe(0);
    expect(after.totalPaid + after.remaining).toBe(after.estimatedCost);
  });

  it("rolls stage money up and labels the pending change", () => {
    const { data } = koramangala();
    const payments = data.payments.filter((item) => item.projectId === IDS.koramangala);
    const carpentry = stageTotals(payments).find((stage) => stage.stage === "Carpentry");
    expect(carpentry).toMatchObject({ acknowledged: 150_000, awaiting: 250_000, disputed: 0 });
    if (!carpentry) throw new Error("missing stage");
    expect(stageState(carpentry)).toBe("current");
    expect(pendingChangeChip(data.changeRequests, IDS.koramangala)?.label).toBe("+₹1.4L pending change");
    const slices = financialSlices({ totalPaid: 900_000, awaitingAcknowledgement: 250_000, remaining: 890_000 });
    expect(slices.map((slice) => slice.amount)).toEqual([900_000, 250_000, 640_000]);
    expect(slices.reduce((total, slice) => total + slice.amount, 0)).toBe(1_790_000);
  });

  it("combines search and filters, and exports those rows", () => {
    const { data } = koramangala();
    const payments = data.payments.filter((item) => item.projectId === IDS.koramangala);
    const carpentryAck = queryPayments(
      payments,
      { search: "", stage: "Carpentry", method: "all", status: "awaiting_ack" },
      data.users,
    );
    expect(carpentryAck.map((item) => item.id)).toEqual([IDS.payAwaiting]);
    const byReference = queryPayments(
      payments,
      { search: "UTR261020", stage: "all", method: "UPI", status: "all" },
      data.users,
    );
    expect(byReference).toHaveLength(1);
    const none = queryPayments(
      payments,
      { search: "kitchen", stage: "Material", method: "all", status: "disputed" },
      data.users,
    );
    expect(none).toHaveLength(0);
    const csv = paymentsToCsv(carpentryAck, data.users);
    expect(csv).toContain("250000");
    expect(csv).toContain("Awaiting Ack");
    expect(csv).toContain("Rohan Mehta");
    expect(csv).not.toContain("450000");
    expect(paymentCsvName("Koramangala Apartment")).toBe("koramangala-apartment-payments.csv");
    const row = carpentryAck[0];
    if (!row) throw new Error("missing row");
    expect(paymentsToCsv([{ ...row, reference: '=HYPERLINK("x")' }], data.users)).toContain("'=HYPERLINK");
  });

  it("formats rupee input and warns above the remaining balance", () => {
    expect(formatInrInput("250000")).toBe("2,50,000");
    expect(parseInrInput("₹2,50,000")).toBe(250_000);
    expect(formatInrInput("")).toBe("");
    expect(exceedsRemaining(900_000, 890_000)).toBe(true);
    expect(exceedsRemaining(250_000, 890_000)).toBe(false);
    expect(recordPaymentToast("Ananya Rao")).toBe("Payment recorded. Awaiting Ananya's acknowledgement.");
  });

  it("records, disputes, and resubmits with an audit entry each time", () => {
    const data = createSeedData();
    const rohan = actorFromUser(user(data, IDS.rohan));
    const ananya = actorFromUser(user(data, IDS.ananya));
    const missing = recordPayment({
      actor: rohan,
      projectId: IDS.koramangala,
      homeownerId: IDS.ananya,
      amount: 100_000,
      date: "2026-10-22",
      method: "UPI",
      stage: "Finishing",
    });
    expect(missing.ok).toBe(false);

    const recorded = recordPayment({
      actor: rohan,
      projectId: IDS.koramangala,
      homeownerId: IDS.ananya,
      amount: 100_000,
      date: "2026-10-22",
      method: "UPI",
      reference: "UTR261022",
      stage: "Finishing",
      note: "Site visit",
    });
    if (!recorded.ok) throw new Error(recorded.reason);
    expect(recorded.value.payment.status).toBe("awaiting_ack");
    expect(recorded.value.payment.audit.map((entry) => entry.action)).toEqual(["recorded"]);
    expect(recorded.value.notification.userId).toBe(IDS.ananya);
    expect(recorded.value.notification.href).toContain(`payment=${recorded.value.payment.id}`);

    const cash = recordPayment({
      actor: rohan,
      projectId: IDS.koramangala,
      homeownerId: IDS.ananya,
      amount: 1000,
      date: "2026-10-22",
      method: "Cash",
      stage: "Handover",
    });
    expect(cash.ok).toBe(true);

    const blocked = disputePayment({
      payment: recorded.value.payment,
      actor: ananya,
      reason: "  ",
      designerId: IDS.rohan,
    });
    expect(blocked.ok).toBe(false);

    const disputed = disputePayment({
      payment: recorded.value.payment,
      actor: ananya,
      reason: "Amount does not match the receipt",
      designerId: IDS.rohan,
    });
    if (!disputed.ok) throw new Error(disputed.reason);
    expect(disputed.value.payment.audit.at(-1)?.action).toBe("disputed");

    const resent = resubmitPayment({
      payment: disputed.value.payment,
      actor: rohan,
      homeownerId: IDS.ananya,
      patch: { amount: 90_000, reference: "UTR261022B", method: "UPI" },
    });
    if (!resent.ok) throw new Error(resent.reason);
    expect(resent.value.payment.status).toBe("awaiting_ack");
    expect(resent.value.payment.amount).toBe(90_000);
    expect(resent.value.payment.audit.at(-1)?.action).toBe("resubmitted");
    expect(resent.value.notification.userId).toBe(IDS.ananya);
  });
});

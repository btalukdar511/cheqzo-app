import { z } from "zod";

import { DEMO_NOW_ISO } from "@/lib/demo";
import { formatInrInput, parseInrInput } from "@/lib/financials";
import { nextPaymentStage } from "@/lib/project-view";
import { PAYMENT_METHODS, PAYMENT_STAGES, paymentDraftIssues, type PaymentWrite } from "@/lib/rules";
import type { Payment } from "@/types";

export interface PaymentFormValues {
  amount: string;
  date: string;
  stage: Payment["stage"];
  method: Payment["method"];
  reference: string;
  note: string;
  receiptUrl: string;
}

export function blankPayment(payments: Payment[]): PaymentFormValues {
  const next = nextPaymentStage(payments);
  const stage = PAYMENT_STAGES.find((item) => item === next) ?? "Advance";
  return {
    amount: "",
    date: DEMO_NOW_ISO.slice(0, 10),
    stage,
    method: "UPI",
    reference: "",
    note: "",
    receiptUrl: "",
  };
}

export function valuesFromPayment(payment: Payment): PaymentFormValues {
  return {
    amount: formatInrInput(String(payment.amount)),
    date: payment.date.slice(0, 10),
    stage: payment.stage,
    method: payment.method,
    reference: payment.reference ?? "",
    note: payment.note ?? "",
    receiptUrl: payment.receiptUrl ?? "",
  };
}

export function writeFromValues(values: PaymentFormValues): PaymentWrite {
  return {
    amount: parseInrInput(values.amount),
    date: values.date,
    stage: values.stage,
    method: values.method,
    reference: values.method === "Cash" ? undefined : values.reference.trim(),
    note: values.note.trim() || undefined,
    receiptUrl: values.receiptUrl || undefined,
  };
}

export const paymentSchema = z
  .object({
    amount: z.string(),
    date: z.string(),
    stage: z.enum(PAYMENT_STAGES),
    method: z.enum(PAYMENT_METHODS),
    reference: z.string(),
    note: z.string(),
    receiptUrl: z.string(),
  })
  .superRefine((value, ctx) => {
    const issues = paymentDraftIssues({
      amount: parseInrInput(value.amount),
      date: value.date,
      method: value.method,
      reference: value.reference,
      stage: value.stage,
    });
    for (const [path, message] of Object.entries(issues)) {
      if (!message) continue;
      ctx.addIssue({ code: "custom", message, path: [path] });
    }
  });

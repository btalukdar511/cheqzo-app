import { formatDate, formatINR, formatINRCompact } from "@/lib/format";
import { budgetSlices, personName, type BudgetSlice } from "@/lib/project-view";
import {
  isPaymentMethod,
  isPaymentStage,
  isPaymentStatus,
  PAYMENT_STAGES,
  type ProjectSummary,
} from "@/lib/rules";
import type { ChangeRequest, Payment, User } from "@/types";

export interface PaymentQuery {
  search: string;
  stage: Payment["stage"] | "all";
  method: Payment["method"] | "all";
  status: Payment["status"] | "all";
}

export const PAYMENT_STATUS_LABEL: Record<Payment["status"], string> = {
  awaiting_ack: "Awaiting Ack",
  acknowledged: "Acknowledged",
  disputed: "Disputed",
};

export function paymentQuery(params: {
  search: string | null;
  stage: string | null;
  method: string | null;
  status: string | null;
}): PaymentQuery {
  return {
    search: params.search ?? "",
    stage: params.stage && isPaymentStage(params.stage) ? params.stage : "all",
    method: params.method && isPaymentMethod(params.method) ? params.method : "all",
    status: params.status && isPaymentStatus(params.status) ? params.status : "all",
  };
}

export function queryPayments(payments: Payment[], query: PaymentQuery, users: User[]): Payment[] {
  const needle = query.search.trim().toLowerCase();
  return payments.filter((payment) => {
    if (query.stage !== "all" && payment.stage !== query.stage) return false;
    if (query.method !== "all" && payment.method !== query.method) return false;
    if (query.status !== "all" && payment.status !== query.status) return false;
    if (!needle) return true;
    const haystack = [
      formatDate(payment.date),
      payment.stage,
      payment.method,
      payment.reference ?? "",
      String(payment.amount),
      formatINR(payment.amount),
      formatINRCompact(payment.amount),
      PAYMENT_STATUS_LABEL[payment.status],
      personName(users, payment.recordedById),
      payment.note ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
}

export interface StageTotal {
  stage: Payment["stage"];
  acknowledged: number;
  awaiting: number;
  disputed: number;
}

export function stageTotals(payments: Payment[]): StageTotal[] {
  return PAYMENT_STAGES.map((stage) => {
    const rows = payments.filter((payment) => payment.stage === stage);
    return {
      stage,
      acknowledged: sum(rows.filter((payment) => payment.status === "acknowledged")),
      awaiting: sum(rows.filter((payment) => payment.status === "awaiting_ack")),
      disputed: sum(rows.filter((payment) => payment.status === "disputed")),
    };
  });
}

export type StageState = "complete" | "current" | "disputed" | "upcoming";

export function stageState(stage: StageTotal): StageState {
  if (stage.awaiting > 0) return "current";
  if (stage.disputed > 0 && stage.acknowledged === 0) return "disputed";
  if (stage.acknowledged > 0) return "complete";
  if (stage.disputed > 0) return "disputed";
  return "upcoming";
}

export function pendingChangeChip(
  requests: ChangeRequest[],
  projectId: string,
): { label: string; tone: "neutral" } | null {
  const pending = requests.filter((request) => request.projectId === projectId && request.status === "pending");
  if (pending.length === 0) return null;
  const impact = pending.reduce((total, request) => total + request.costImpact, 0);
  if (impact === 0) return null;
  const amount = impact > 0 ? `+${formatINRCompact(impact)}` : formatINRCompact(impact);
  const noun = pending.length === 1 ? "change" : "changes";
  return { label: `${amount} pending ${noun}`, tone: "neutral" };
}

export function financialSlices(
  summary: Pick<ProjectSummary, "totalPaid" | "awaitingAcknowledgement" | "remaining">,
): BudgetSlice[] {
  return budgetSlices(summary).map((slice) => {
    if (slice.key === "awaiting") return { ...slice, label: "Awaiting ack" };
    if (slice.key === "remaining") return { ...slice, label: "Remaining" };
    return slice;
  });
}

export function exceedsRemaining(amount: number, balance: number): boolean {
  return amount > balance;
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

export function recordPaymentToast(homeownerName: string): string {
  return `Payment recorded. Awaiting ${firstName(homeownerName)}'s acknowledgement.`;
}

export function resubmitPaymentToast(homeownerName: string): string {
  return `Payment resubmitted. Awaiting ${firstName(homeownerName)}'s acknowledgement.`;
}

export function formatInrInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 9);
  if (!digits) return "";
  return new Intl.NumberFormat("en-IN").format(Number(digits));
}

export function parseInrInput(formatted: string): number {
  const digits = formatted.replace(/\D/g, "").slice(0, 9);
  if (!digits) return 0;
  return Number(digits);
}

export function paymentsToCsv(payments: Payment[], users: User[]): string {
  const header = ["Date", "Stage", "Method", "Reference", "Amount", "Status", "Recorded by"];
  const lines = payments.map((payment) => [
    formatDate(payment.date),
    payment.stage,
    payment.method,
    payment.reference ?? "",
    String(payment.amount),
    PAYMENT_STATUS_LABEL[payment.status],
    personName(users, payment.recordedById),
  ]);
  return [header, ...lines].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
}

export function paymentCsvName(projectName: string): string {
  const slug = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "project"}-payments.csv`;
}

function sum(payments: Payment[]): number {
  return payments.reduce((total, payment) => total + payment.amount, 0);
}

function escapeCsv(value: string): string {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  if (/[",\n\r]/.test(safe)) return `"${safe.replace(/"/g, '""')}"`;
  return safe;
}

"use client";

import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import { Banknote, Building2, Copy, QrCode, ScrollText, type LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { PersonChip } from "@/components/features/financials/person-chip";
import { MoneyText } from "@/components/shared/MoneyText";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PAYMENT_STATUS_LABEL } from "@/lib/financials";
import { formatDate } from "@/lib/format";
import type { Payment, User } from "@/types";

const METHOD_ICON: Record<Payment["method"], LucideIcon> = {
  UPI: QrCode,
  "Bank Transfer": Building2,
  Cash: Banknote,
  Cheque: ScrollText,
};

export const STATUS_OPTIONS: { id: Payment["status"]; label: string }[] = [
  { id: "awaiting_ack", label: "Awaiting Ack" },
  { id: "acknowledged", label: "Acknowledged" },
  { id: "disputed", label: "Disputed" },
];

export function paymentColumns(users: User[]): LegacyColumnDef<Payment>[] {
  return [
    {
      id: "date",
      header: "Date",
      accessorFn: (payment) => payment.date,
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      id: "stage",
      header: "Stage",
      accessorFn: (payment) => payment.stage,
      enableSorting: false,
    },
    {
      id: "method",
      header: "Method",
      accessorFn: (payment) => payment.method,
      enableSorting: false,
      cell: ({ row }) => {
        const Icon = METHOD_ICON[row.original.method];
        return (
          <span className="inline-flex items-center gap-1.5">
            <Icon className="size-3.5 text-muted-foreground" />
            {row.original.method}
          </span>
        );
      },
    },
    {
      id: "reference",
      header: "Reference",
      accessorFn: (payment) => payment.reference ?? "",
      enableSorting: false,
      cell: ({ row }) => <ReferenceCell reference={row.original.reference} />,
    },
    {
      id: "amount",
      header: "Amount",
      accessorFn: (payment) => payment.amount,
      meta: { align: "right" },
      cell: ({ row }) => <MoneyText amount={row.original.amount} />,
    },
    {
      id: "status",
      header: "Status",
      accessorFn: (payment) => PAYMENT_STATUS_LABEL[payment.status],
      enableSorting: false,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "recordedBy",
      header: "Recorded by",
      accessorFn: (payment) => users.find((user) => user.id === payment.recordedById)?.name ?? "",
      enableSorting: false,
      cell: ({ row }) => <PersonChip user={users.find((user) => user.id === row.original.recordedById)} />,
    },
  ];
}

export function LedgerTotal({ rows }: { rows: Payment[] }) {
  const total = rows.reduce((sum, payment) => sum + payment.amount, 0);
  return (
    <tr>
      <td colSpan={4} className="px-3 py-2 text-xs font-medium text-muted-foreground">
        Total · {rows.length} {rows.length === 1 ? "payment" : "payments"}
      </td>
      <td className="px-3 py-2 text-right font-medium text-foreground">
        <MoneyText amount={total} />
      </td>
      <td colSpan={2} />
    </tr>
  );
}

export function LedgerFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      aria-label={label}
      className="h-8 rounded-lg border border-border bg-surface px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      value={value === "all" ? "" : value}
      onChange={(event) => onChange(event.target.value || "all")}
    >
      <option value="">{label}</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function ReferenceCell({ reference }: { reference?: string }) {
  if (!reference) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="group inline-flex items-center gap-1">
      <span>{reference}</span>
      <button
        type="button"
        aria-label={`Copy reference ${reference}`}
        className="rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 focus:opacity-100"
        onClick={(event) => {
          event.stopPropagation();
          void navigator.clipboard.writeText(reference).then(
            () => toast.success("Reference copied"),
            () => toast.error("Couldn't copy the reference"),
          );
        }}
      >
        <Copy className="size-3" />
      </button>
    </span>
  );
}

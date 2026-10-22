"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";

import { LedgerFilter, LedgerTotal, paymentColumns, STATUS_OPTIONS } from "@/components/features/financials/payment-columns";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { paymentCsvName, paymentsToCsv, queryPayments, type PaymentQuery } from "@/lib/financials";
import { PAYMENT_METHODS, PAYMENT_STAGES } from "@/lib/rules";
import type { Payment, User } from "@/types";

export function PaymentLedger({
  payments,
  users,
  query,
  projectName,
  onQuery,
  onOpen,
}: {
  payments: Payment[];
  users: User[];
  query: PaymentQuery;
  projectName: string;
  onQuery: (next: PaymentQuery) => void;
  onOpen: (paymentId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const active = { ...query, search };
  const visible = queryPayments(payments, active, users);
  const filtered = search.trim() !== "" || query.stage !== "all" || query.method !== "all" || query.status !== "all";
  const columns = useMemo(() => paymentColumns(users), [users]);

  function download() {
    const blob = new Blob([paymentsToCsv(visible, users)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = paymentCsvName(projectName);
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search payments"
          aria-label="Search payments"
          className="max-w-xs"
        />
        <LedgerFilter
          label="Stage"
          value={query.stage}
          options={PAYMENT_STAGES.map((stage) => ({ id: stage, label: stage }))}
          onChange={(stage) => onQuery({ ...query, stage: stage as PaymentQuery["stage"] })}
        />
        <LedgerFilter
          label="Method"
          value={query.method}
          options={PAYMENT_METHODS.map((method) => ({ id: method, label: method }))}
          onChange={(method) => onQuery({ ...query, method: method as PaymentQuery["method"] })}
        />
        <LedgerFilter
          label="Status"
          value={query.status}
          options={STATUS_OPTIONS}
          onChange={(status) => onQuery({ ...query, status: status as PaymentQuery["status"] })}
        />
        <Button type="button" variant="outline" className="ml-auto" onClick={download}>
          <Download />
          Export CSV
        </Button>
      </div>
      <DataTable
        data={visible}
        columns={columns}
        showControls={false}
        hideIdlePagination
        initialSorting={[{ id: "date", desc: true }]}
        onRowClick={(payment) => onOpen(payment.id)}
        emptyTitle={payments.length === 0 ? "No payments yet" : "No payments match"}
        emptyDescription={
          payments.length === 0 || !filtered
            ? "Recorded payments will show up here."
            : "Try a different search or filter."
        }
        footer={(rows) => <LedgerTotal rows={rows} />}
      />
    </section>
  );
}

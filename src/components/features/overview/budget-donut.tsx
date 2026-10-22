"use client";

import { useSyncExternalStore } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { MoneyText } from "@/components/shared/MoneyText";
import type { BudgetSlice } from "@/lib/project-view";

const FILL: Record<BudgetSlice["key"], string> = {
  paid: "var(--success)",
  awaiting: "var(--warning)",
  remaining: "var(--border)",
};

const SWATCH: Record<BudgetSlice["key"], string> = {
  paid: "bg-success",
  awaiting: "bg-warning",
  remaining: "bg-border",
};

function mounted(): boolean {
  return true;
}

export function BudgetDonut({ slices }: { slices: BudgetSlice[] }) {
  const ready = useSyncExternalStore(() => () => undefined, mounted, () => false);
  const drawn = slices.filter((slice) => slice.amount > 0);

  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="mx-auto h-36 w-36">
        {ready && drawn.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={drawn} dataKey="amount" nameKey="label" innerRadius={42} outerRadius={62} paddingAngle={2} stroke="none">
                {drawn.map((slice) => (
                  <Cell key={slice.key} fill={FILL[slice.key]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full rounded-full border-[12px] border-border" />
        )}
      </div>
      <ul className="space-y-1">
        {slices.map((slice) => (
          <li key={slice.key} className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className={`size-1.5 rounded-full ${SWATCH[slice.key]}`} />
              {slice.label}
            </span>
            <MoneyText amount={slice.amount} compact className="text-foreground" />
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { permissionSummary } from "@/lib/team";

export function PermissionCard() {
  const rows = permissionSummary();
  return (
    <aside className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
      <h2 className="text-sm font-semibold text-foreground">Who can do what</h2>
      <p className="mt-1 text-xs text-muted-foreground">Owner, view-only family, family who can approve, and the designer.</p>
      <table className="mt-3 w-full text-xs">
        <thead>
          <tr className="text-muted-foreground">
            <th className="py-1 text-left font-medium"> </th>
            <th className="px-1 py-1 font-medium">Owner</th>
            <th className="px-1 py-1 font-medium">View</th>
            <th className="px-1 py-1 font-medium">Approve</th>
            <th className="px-1 py-1 font-medium">Designer</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-border">
              <th className="py-1.5 pr-2 text-left font-normal text-foreground">{row.label}</th>
              <Mark on={row.owner} />
              <Mark on={row.view} />
              <Mark on={row.approve} />
              <Mark on={row.designer} />
            </tr>
          ))}
        </tbody>
      </table>
    </aside>
  );
}

function Mark({ on }: { on: boolean }) {
  return <td className="px-1 text-center text-foreground">{on ? "Yes" : "—"}</td>;
}

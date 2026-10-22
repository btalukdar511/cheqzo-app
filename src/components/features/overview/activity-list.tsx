import { History } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/EmptyState";
import { relativeTime } from "@/lib/format";
import type { ActivityEntry } from "@/lib/project-view";

export function ActivityList({ items }: { items: ActivityEntry[] }) {
  return (
    <section className="rounded-xl border border-border bg-surface shadow-[var(--shadow-card)]">
      <h2 className="border-b border-border px-5 py-4 text-base leading-6 font-semibold text-foreground">Recent activity</h2>
      {items.length === 0 ? (
        <EmptyState icon={History} title="No activity yet" description="Updates, payments, and change requests will collect here." />
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id} className="border-b border-border last:border-b-0">
              <Link
                href={item.href}
                className="flex items-baseline justify-between gap-4 px-5 py-3 outline-none hover:bg-secondary/60 focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm text-foreground">{item.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{item.meta}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(item.at)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

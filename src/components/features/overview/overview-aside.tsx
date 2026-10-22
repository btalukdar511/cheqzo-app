import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { SeedImage } from "@/components/shared/SeedImage";
import { formatDate } from "@/lib/format";
import { nextPaymentStage, type ActionItem } from "@/lib/project-view";
import type { NavBadges } from "@/lib/rules";
import type { Payment, Project, TeamMember, User } from "@/types";

const ROLE_LABEL: Record<TeamMember["role"], string> = {
  owner: "Homeowner",
  family: "Family",
  designer: "Designer",
  site_supervisor: "Site supervisor",
};

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function avatarFor(member: TeamMember, users: User[]): string | undefined {
  return users.find((user) => user.phone === member.contact)?.avatarUrl;
}

export function OverviewAside({
  project,
  payments,
  team,
  users,
  badges,
  actions,
  projectedEnd,
}: {
  project: Project;
  payments: Payment[];
  team: TeamMember[];
  users: User[];
  badges: NavBadges;
  actions: ActionItem[];
  projectedEnd: string;
}) {
  const waiting = badges.updates + badges.payments + badges.changes;
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-base leading-6 font-semibold text-foreground">Needs your action</h2>
        {waiting === 0 && actions.length === 0 ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-success" />
            Nothing needs you right now.
          </p>
        ) : (
          <>
            <p className="mt-2 text-xs leading-4 text-muted-foreground">
              {badges.updates} pending {badges.updates === 1 ? "update" : "updates"} · {badges.payments} awaiting acknowledgement ·{" "}
              {badges.changes} change {badges.changes === 1 ? "request" : "requests"}
            </p>
            {actions.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Nothing is waiting on you.</p>
            ) : (
              <ul className="mt-3 space-y-1">
                {actions.map((action) => (
                  <li key={action.id}>
                    <Link href={action.href} className="block rounded-lg px-2 py-1.5 text-sm text-primary hover:bg-secondary">
                      {action.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
      <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-base leading-6 font-semibold text-foreground">Team</h2>
        <ul className="mt-3 space-y-3">
          {team.map((member) => {
            const photo = avatarFor(member, users);
            return (
              <li key={member.id} className="flex items-center gap-3">
                <span className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-xs font-medium text-foreground">
                  {photo ? <SeedImage src={photo} alt="" sizes="32px" /> : initials(member.name)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm text-foreground">{member.name}</span>
                  <span className="block text-xs text-muted-foreground">{ROLE_LABEL[member.role]}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>
      <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-base leading-6 font-semibold text-foreground">Key dates</h2>
        <dl className="mt-3 space-y-3 text-sm">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">Start</dt>
            <dd className="text-foreground">{formatDate(project.startDate)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">Next payment stage</dt>
            <dd className="text-right text-foreground">{nextPaymentStage(payments)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">Projected handover</dt>
            <dd className="text-foreground">{formatDate(projectedEnd)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

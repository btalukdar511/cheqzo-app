"use client";

import Link from "next/link";

import { HealthBadge } from "@/components/shared/HealthBadge";
import { MoneyText } from "@/components/shared/MoneyText";
import { SeedImage } from "@/components/shared/SeedImage";
import { TimelineCompare } from "@/components/shared/TimelineCompare";
import { Button } from "@/components/ui/button";
import type { PortfolioItem } from "@/lib/portfolio";

function BudgetBar({ paid, remaining, estimated }: { paid: number; remaining: number; estimated: number }) {
  const paidWidth = estimated > 0 ? Math.min(100, (paid / estimated) * 100) : 0;
  const remainingWidth = estimated > 0 ? Math.min(100 - paidWidth, (Math.max(remaining, 0) / estimated) * 100) : 0;
  return (
    <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-secondary">
      <span className="h-full bg-primary" style={{ width: `${paidWidth}%` }} />
      <span className="h-full bg-brass/45" style={{ width: `${remainingWidth}%` }} />
    </div>
  );
}

export function ProjectPreview({ item, onOpen }: { item: PortfolioItem; onOpen: (id: string) => void }) {
  const { project, summary } = item;
  const actions = item.actions.slice(0, 3);
  return (
    <div className="space-y-5 p-5">
      <div className="relative aspect-[16/8] overflow-hidden rounded-xl">
        <SeedImage src={project.coverImage} alt="" sizes="640px" />
      </div>
      <div>
        <h2 className="font-display text-2xl leading-8 font-semibold text-foreground">{project.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {project.location.area}, {project.location.city}
        </p>
        <p className="text-sm text-muted-foreground">
          {project.studioName} · {item.designerName}
        </p>
      </div>
      <div>
        <HealthBadge health={summary.health} reasons={summary.reasons} />
        {summary.reasons.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
            {summary.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">Nothing is blocking this project.</p>
        )}
      </div>
      <TimelineCompare startDate={project.startDate} originalEnd={summary.originalEndDate} projectedEnd={summary.projectedEndDate} />
      <div>
        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
          <p>Estimated <span className="block text-sm text-foreground"><MoneyText amount={summary.estimatedCost} compact /></span></p>
          <p>Paid <span className="block text-sm text-foreground"><MoneyText amount={summary.totalPaid} compact /></span></p>
          <p>Remaining <span className="block text-sm text-foreground"><MoneyText amount={summary.remaining} compact /></span></p>
        </div>
        <BudgetBar paid={summary.totalPaid} remaining={summary.remaining} estimated={summary.estimatedCost} />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">Needs your action</h3>
        {actions.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nothing needs you right now.</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {actions.map((action) => (
              <li key={action.id}>
                <Link href={action.href} className="block rounded-lg px-2 py-1.5 text-sm text-primary hover:bg-secondary">
                  {action.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      {item.latestUpdate ? (
        <Link href={item.latestUpdate.href} className="flex gap-3 rounded-lg hover:bg-secondary">
          <span className="relative size-16 shrink-0 overflow-hidden rounded-lg">
            <SeedImage src={item.latestUpdate.photoUrl} alt="" sizes="64px" />
          </span>
          <span>
            <span className="block text-xs text-muted-foreground">Latest update</span>
            <span className="block text-sm font-medium text-foreground">{item.latestUpdate.title}</span>
            <span className="block text-xs text-muted-foreground">{item.latestUpdate.caption}</span>
          </span>
        </Link>
      ) : (
        <p className="text-sm text-muted-foreground">No updates yet.</p>
      )}
      <Button onClick={() => onOpen(project.id)}>Open project</Button>
    </div>
  );
}

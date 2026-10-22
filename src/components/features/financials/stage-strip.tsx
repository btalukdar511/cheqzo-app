import { MoneyText } from "@/components/shared/MoneyText";
import { stageState, stageTotals, type StageState, type StageTotal } from "@/lib/financials";
import { formatINRCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Payment } from "@/types";

const MARK: Record<StageState, string> = {
  complete: "border-success bg-success text-primary-foreground",
  current: "border-warning bg-warning text-primary-foreground",
  disputed: "border-danger bg-danger text-primary-foreground",
  upcoming: "border-border bg-surface text-muted-foreground",
};

export function StageStrip({ payments }: { payments: Payment[] }) {
  const stages = stageTotals(payments);

  return (
    <section className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
      <h2 className="text-sm font-semibold text-foreground">Payment stages</h2>
      <ol className="mt-4 grid grid-cols-7 gap-2">
        {stages.map((stage, index) => (
          <StageStep key={stage.stage} stage={stage} index={index} last={index === stages.length - 1} />
        ))}
      </ol>
    </section>
  );
}

function StageStep({ stage, index, last }: { stage: StageTotal; index: number; last: boolean }) {
  const state = stageState(stage);
  const figure = stageFigure(stage);

  return (
    <li className="relative min-w-0 text-center">
      {last ? null : <span className="absolute top-3 left-1/2 h-px w-full bg-border" aria-hidden />}
      <span className={cn("relative mx-auto flex size-6 items-center justify-center rounded-full border text-[10px] font-semibold", MARK[state])}>
        {index + 1}
      </span>
      <p className="mt-2 text-[11px] leading-4 font-medium text-foreground">{stage.stage}</p>
      <MoneyText amount={figure.amount} compact className="mt-1 block text-xs text-foreground" />
      {figure.caption ? <p className="text-[10px] leading-4 text-muted-foreground">{figure.caption}</p> : null}
    </li>
  );
}

function stageFigure(stage: StageTotal): { amount: number; caption?: string } {
  if (stage.acknowledged > 0 && stage.awaiting > 0) {
    return { amount: stage.acknowledged, caption: `${formatINRCompact(stage.awaiting)} awaiting` };
  }
  if (stage.acknowledged > 0) return { amount: stage.acknowledged };
  if (stage.awaiting > 0) return { amount: stage.awaiting, caption: "Awaiting" };
  if (stage.disputed > 0) return { amount: stage.disputed, caption: "Disputed" };
  return { amount: 0 };
}

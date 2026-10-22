import { formatINR, formatINRCompact } from "@/lib/format";
import { cn } from "@/lib/utils";

interface MoneyTextProps {
  amount: number;
  compact?: boolean;
  className?: string;
}

export function MoneyText({ amount, compact = false, className }: MoneyTextProps) {
  return <span className={cn("tabular-nums", className)}>{compact ? formatINRCompact(amount) : formatINR(amount)}</span>;
}

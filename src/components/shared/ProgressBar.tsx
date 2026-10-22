interface ProgressBarProps {
  value: number;
  proposed?: number;
  label?: string;
}

function clamp(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function ProgressBar({ value, proposed, label }: ProgressBarProps) {
  const current = clamp(value);
  const ghost = proposed === undefined ? undefined : clamp(proposed);
  return (
    <div className="flex w-full items-center gap-3">
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-secondary">
        {ghost !== undefined && ghost > current ? (
          <span className="absolute inset-y-0 left-0 rounded-full bg-brass/35" style={{ width: `${ghost}%` }} />
        ) : null}
        <span
          className="progress-fill absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-200"
          style={{ width: `${current}%` }}
        />
      </div>
      {label ? <span className="text-xs leading-4 text-muted-foreground tabular-nums">{label}</span> : null}
    </div>
  );
}

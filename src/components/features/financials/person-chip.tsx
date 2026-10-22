import { SeedImage } from "@/components/shared/SeedImage";
import type { User } from "@/types";

export function PersonChip({ user }: { user?: User }) {
  const name = user?.name ?? "Someone";
  const letters = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <span className="relative flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-[10px] font-medium text-foreground">
        {user?.avatarUrl ? <SeedImage src={user.avatarUrl} alt="" sizes="24px" /> : letters}
      </span>
      <span className="truncate">{name}</span>
    </span>
  );
}

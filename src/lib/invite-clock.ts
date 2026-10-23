const WAIT_MS = 5000;

const timers = new Map<string, ReturnType<typeof setTimeout>>();
const listeners = new Set<(memberId: string) => void>();

export function armInvite(memberId: string): void {
  if (typeof window === "undefined") return;
  const existing = timers.get(memberId);
  if (existing) clearTimeout(existing);
  timers.set(
    memberId,
    setTimeout(() => {
      timers.delete(memberId);
      for (const listener of listeners) listener(memberId);
    }, WAIT_MS),
  );
}

export function subscribeInvites(listener: (memberId: string) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

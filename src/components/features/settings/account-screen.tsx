"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { SeedImage } from "@/components/shared/SeedImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/data/api";
import { useCurrentUser, useLiveDb, useStoresReady } from "@/data/live";
import { DEMO_DESIGNER_ID, DEMO_FAMILY_ID, DEMO_HOMEOWNER_ID, DEMO_INDIRANAGAR_ID } from "@/lib/demo";
import { activeProjectId } from "@/lib/navigation";
import { canSeeProject } from "@/lib/rules";
import { cn } from "@/lib/utils";
import { useDb } from "@/store/db";
import { useSession } from "@/store/session";
import type { User } from "@/types";

function accountLabel(user: User): string {
  if (user.id === DEMO_DESIGNER_ID) return "Rohan (Designer)";
  if (user.id === DEMO_FAMILY_ID) {
    return user.access === "approve" ? "Meera (Family, can approve)" : "Meera (Family, view only)";
  }
  if (user.id === DEMO_INDIRANAGAR_ID) return "Karthik (Homeowner of Indiranagar)";
  return "Ananya (Homeowner)";
}

export function AccountScreen() {
  const ready = useStoresReady();
  const user = useCurrentUser();
  const db = useLiveDb();
  const pathname = usePathname();
  const router = useRouter();
  const setUserId = useSession((state) => state.setUserId);
  const signOut = useSession((state) => state.signOut);
  const latency = useDb((state) => state.latencyEnabled);
  const [resetOpen, setResetOpen] = useState(false);
  const [prefs, setPrefs] = useState({ updates: true, payments: true, changes: true });
  if (!ready || !user) return <div className="h-64 animate-pulse rounded-xl bg-secondary" aria-busy="true" />;

  function switchTo(nextId: string) {
    const next = db.users.find((item) => item.id === nextId);
    setUserId(nextId);
    const projectId = activeProjectId(pathname);
    if (next && projectId && !canSeeProject(next, projectId, db.projects, db.teamMembers)) {
      router.push("/dashboard");
      return;
    }
    router.refresh();
  }

  async function reset() {
    await api.reset();
    window.location.reload();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-[28px] leading-9 font-semibold text-foreground">Settings</h1>
      <ProfileCard key={user.id} user={user} />
      <section className="space-y-3 rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-base font-semibold text-foreground">Notification preferences</h2>
        <p className="text-sm text-muted-foreground">These toggles are for the demo. They do not change what gets sent.</p>
        <Preference label="Updates" on={prefs.updates} onToggle={() => setPrefs((current) => ({ ...current, updates: !current.updates }))} />
        <Preference label="Payments" on={prefs.payments} onToggle={() => setPrefs((current) => ({ ...current, payments: !current.payments }))} />
        <Preference label="Change requests" on={prefs.changes} onToggle={() => setPrefs((current) => ({ ...current, changes: !current.changes }))} />
      </section>
      <section className="space-y-4 rounded-xl border border-brass/40 bg-surface p-5 shadow-[var(--shadow-card)]">
        <div>
          <p className="text-xs font-medium tracking-wide text-brass uppercase">Demo tools</p>
          <h2 className="mt-1 text-base font-semibold text-foreground">Switch demo user</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[DEMO_HOMEOWNER_ID, DEMO_DESIGNER_ID, DEMO_FAMILY_ID, DEMO_INDIRANAGAR_ID].map((id) => {
            const item = db.users.find((candidate) => candidate.id === id);
            if (!item) return null;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={item.id === user.id}
                onClick={() => switchTo(item.id)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-left text-sm",
                  item.id === user.id ? "border-primary bg-primary/10 text-foreground" : "border-border text-foreground hover:bg-secondary",
                )}
              >
                {accountLabel(item)}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => setResetOpen(true)}>
            Reset demo data
          </Button>
          <Button type="button" variant="outline" onClick={() => void api.setLatency(!latency)}>
            Artificial latency: {latency ? "On" : "Off"}
          </Button>
        </div>
      </section>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          signOut();
          router.replace("/login");
        }}
      >
        Sign out
      </Button>
      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset demo data?"
        description="Projects, decisions, and invites return to the original story. Your signed-in user stays."
        confirmLabel="Reset"
        onConfirm={() => void reset()}
      />
    </div>
  );
}

function ProfileCard({ user }: { user: User }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await api.updateProfile(user.id, { name, email, avatarUrl });
      toast.success("Profile saved");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not save your profile");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <h2 className="text-base font-semibold text-foreground">Profile</h2>
      <div className="flex items-center gap-3">
        <span className="relative size-14 overflow-hidden rounded-full bg-secondary">
          {avatarUrl ? <SeedImage src={avatarUrl} alt="" sizes="56px" /> : null}
        </span>
        <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
          Change photo
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (avatarUrl?.startsWith("blob:")) URL.revokeObjectURL(avatarUrl);
            setAvatarUrl(URL.createObjectURL(file));
          }}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-foreground">Name</span>
          <Input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-foreground">Phone</span>
          <Input value={user.phone} disabled />
        </label>
        <label className="col-span-2 space-y-1.5 text-sm">
          <span className="font-medium text-foreground">Email</span>
          <Input value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
      </div>
      <Button type="button" onClick={() => void save()} disabled={busy}>
        Save profile
      </Button>
    </section>
  );
}

function Preference({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <button type="button" aria-pressed={on} onClick={onToggle} className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
      <span className="text-foreground">{label}</span>
      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", on ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground")}>
        {on ? "On" : "Off"}
      </span>
    </button>
  );
}

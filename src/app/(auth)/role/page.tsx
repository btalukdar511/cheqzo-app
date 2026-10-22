"use client";

import { House, PencilRuler, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { DisabledHint } from "@/components/shell/DisabledHint";
import { Wordmark } from "@/components/shell/Wordmark";
import { Button } from "@/components/ui/button";
import { DEMO_DESIGNER_ID, DEMO_HOMEOWNER_ID } from "@/lib/demo";
import { cn } from "@/lib/utils";
import { useSession } from "@/store/session";

const ROLES: {
  id: "homeowner" | "designer";
  title: string;
  copy: string;
  icon: LucideIcon;
  userId: string;
}[] = [
  {
    id: "homeowner",
    title: "I'm a Homeowner",
    copy: "Track progress, approve updates, stay in control of your budget.",
    icon: House,
    userId: DEMO_HOMEOWNER_ID,
  },
  {
    id: "designer",
    title: "I'm an Interior Designer",
    copy: "Run projects, post site updates, record payments and get sign-offs.",
    icon: PencilRuler,
    userId: DEMO_DESIGNER_ID,
  },
];

export default function RolePage() {
  const [role, setRole] = useState<(typeof ROLES)[number]["id"] | null>(null);
  const setUserId = useSession((state) => state.setUserId);
  const router = useRouter();

  function continueWithRole() {
    const selected = ROLES.find((item) => item.id === role);
    if (!selected) return;
    setUserId(selected.userId);
    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-8">
      <Wordmark />
      <h1 className="mt-8 font-display text-[28px] leading-9 font-semibold text-foreground">Choose a role</h1>
      <div className="mt-8 grid w-full max-w-3xl grid-cols-2 gap-4">
        {ROLES.map((item) => {
          const selected = role === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setRole(item.id)}
              className={cn(
                "rounded-xl border bg-surface p-6 text-left shadow-[var(--shadow-card)] outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                selected ? "border-primary bg-sidebar-accent" : "border-border hover:shadow-[var(--shadow-lift)]",
              )}
            >
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-lg text-primary",
                  selected ? "bg-surface" : "bg-sidebar-accent",
                )}
              >
                <Icon className="size-5" />
              </span>
              <span className="mt-4 block text-base leading-6 font-semibold text-foreground">{item.title}</span>
              <span className="mt-2 block text-sm leading-5 text-muted-foreground">{item.copy}</span>
            </button>
          );
        })}
      </div>
      <DisabledHint disabled={!role} reason="Choose a role to continue">
        <Button className="mt-8 h-10 px-6" disabled={!role} onClick={continueWithRole}>
          Continue
        </Button>
      </DisabledHint>
    </main>
  );
}

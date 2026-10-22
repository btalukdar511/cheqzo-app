"use client";

import { Check, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";

import { BasicsStep } from "@/components/features/project-wizard/basics-step";
import { BudgetStep } from "@/components/features/project-wizard/budget-step";
import { ClientStep } from "@/components/features/project-wizard/client-step";
import { RoomsStep } from "@/components/features/project-wizard/rooms-step";
import {
  clearDraft,
  draftToInput,
  parseStored,
  readRawDraft,
  subscribeDraft,
  validateStep,
  writeDraft,
  type ProjectDraft,
} from "@/components/features/project-wizard/schema";
import { DisabledHint } from "@/components/shell/DisabledHint";
import { Button } from "@/components/ui/button";
import { api } from "@/data/api";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";

const STEPS = [
  { id: "basics", title: "Basics", hint: "Name, place, and cover" },
  { id: "client", title: "Client", hint: "Who the home is for" },
  { id: "rooms", title: "Floor plan and rooms", hint: "Rooms and allocations" },
  { id: "budget", title: "Budget and timeline", hint: "Cost and dates" },
] as const;

export function ProjectWizard({ userId }: { userId: string }) {
  const router = useRouter();
  const saved = useSyncExternalStore(subscribeDraft, readRawDraft, () => "");
  const [edits, setEdits] = useState<{ base: string; draft: ProjectDraft } | null>(null);
  const draft = edits?.base === saved ? edits.draft : parseStored(saved);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<Project | null>(null);

  useEffect(() => {
    if (!created) return;
    const id = window.setTimeout(() => router.push(`/projects/${created.id}`), 900);
    return () => window.clearTimeout(id);
  }, [created, router]);

  function patch(next: Partial<ProjectDraft>) {
    setEdits({ base: saved, draft: { ...draft, ...next } });
  }

  function goTo(index: number) {
    if (index <= step) {
      setErrors({});
      setStep(index);
      return;
    }
    for (let cursor = step; cursor < index; cursor += 1) {
      const nextErrors = validateStep(cursor, draft);
      if (Object.keys(nextErrors).length > 0) {
        setStep(cursor);
        setErrors(nextErrors);
        return;
      }
    }
    setErrors({});
    setStep(index);
  }

  function next() {
    const nextErrors = validateStep(step, draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function saveDraft() {
    writeDraft(draft);
    toast.success("Draft saved");
  }

  async function create() {
    for (let cursor = 0; cursor < STEPS.length; cursor += 1) {
      const nextErrors = validateStep(cursor, draft);
      if (Object.keys(nextErrors).length > 0) {
        setStep(cursor);
        setErrors(nextErrors);
        return;
      }
    }
    setCreating(true);
    try {
      const project = await api.createProject(userId, draftToInput(draft));
      clearDraft();
      toast.success("Project created");
      setCreated(project);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the project");
      setCreating(false);
    }
  }

  if (created) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
          <Check className="size-7" />
        </span>
        <h1 className="mt-4 font-display text-[28px] leading-9 font-semibold text-foreground">Project created</h1>
        <p className="mt-2 text-sm text-muted-foreground">{created.name} is in the studio portfolio.</p>
        <Button className="mt-6" onClick={() => router.push(`/projects/${created.id}`)}>
          Open project
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-[28px] leading-9 font-semibold text-foreground">New project</h1>
      <div className="mt-6 grid grid-cols-[240px_1fr] items-start gap-8">
        <ol className="space-y-1" aria-label="Create project steps">
          {STEPS.map((item, index) => {
            const current = index === step;
            const done = index < step;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  aria-current={current ? "step" : undefined}
                  onClick={() => goTo(index)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left",
                    current ? "bg-primary/10 text-primary" : "text-foreground hover:bg-secondary",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full text-xs",
                      current ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="size-3.5" /> : index + 1}
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{item.title}</span>
                    <span className="block text-xs text-muted-foreground">{item.hint}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <section className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-base leading-6 font-semibold text-foreground">{STEPS[step]?.title}</h2>
          <div className="mt-5">
            {step === 0 ? <BasicsStep draft={draft} errors={errors} onChange={patch} /> : null}
            {step === 1 ? <ClientStep draft={draft} errors={errors} onChange={patch} /> : null}
            {step === 2 ? <RoomsStep draft={draft} errors={errors} onChange={patch} /> : null}
            {step === 3 ? <BudgetStep draft={draft} errors={errors} onChange={patch} /> : null}
          </div>
          <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
            <DisabledHint disabled={step === 0} reason="This is the first step">
              <Button type="button" variant="outline" disabled={step === 0} onClick={() => goTo(step - 1)}>
                Back
              </Button>
            </DisabledHint>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={saveDraft}>
                Save draft
              </Button>
              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={next}>
                  Next
                </Button>
              ) : (
                <DisabledHint disabled={creating} reason="Creating the project">
                  <Button type="button" disabled={creating} onClick={() => void create()}>
                    {creating ? <LoaderCircle className="animate-spin" /> : null}
                    {creating ? "Creating" : "Create project"}
                  </Button>
                </DisabledHint>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

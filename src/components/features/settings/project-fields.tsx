"use client";

import { useRef } from "react";

import { COVER_PRESETS } from "@/components/features/project-wizard/schema";
import { MoneyText } from "@/components/shared/MoneyText";
import { SeedImage } from "@/components/shared/SeedImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";
import { formatInrInput } from "@/lib/financials";
import { cn } from "@/lib/utils";

export interface ProjectFormState {
  name: string;
  area: string;
  city: string;
  coverImage: string;
  originalEndDate: string;
  budget: string;
}

export function ProjectFields({
  form,
  editable,
  projectedEnd,
  estimatedCost,
  onChange,
}: {
  form: ProjectFormState;
  editable: boolean;
  projectedEnd: string;
  estimatedCost: number;
  onChange: (patch: Partial<ProjectFormState>) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-base font-semibold text-foreground">General</h2>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Name</span>
          <Input value={form.name} disabled={!editable} onChange={(event) => onChange({ name: event.target.value })} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Locality</span>
            <Input value={form.area} disabled={!editable} onChange={(event) => onChange({ area: event.target.value })} />
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium">City</span>
            <Input value={form.city} disabled={!editable} onChange={(event) => onChange({ city: event.target.value })} />
          </label>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {COVER_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              disabled={!editable}
              aria-label={preset.label}
              onClick={() => onChange({ coverImage: preset.src })}
              className={cn("relative aspect-[3/2] overflow-hidden rounded-lg", form.coverImage === preset.src ? "ring-2 ring-primary" : "")}
            >
              <SeedImage src={preset.src} alt="" sizes="120px" />
            </button>
          ))}
        </div>
        {editable ? (
          <>
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
              Upload cover
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onChange({ coverImage: URL.createObjectURL(file) });
              }}
            />
          </>
        ) : null}
      </section>
      <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-base font-semibold text-foreground">Timeline</h2>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Original end date</span>
          <Input type="date" value={form.originalEndDate} disabled={!editable} onChange={(event) => onChange({ originalEndDate: event.target.value })} />
        </label>
        <p className="text-sm text-muted-foreground">Projected handover {formatDate(projectedEnd)}</p>
      </section>
      <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-base font-semibold text-foreground">Budget</h2>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Base budget</span>
          <Input inputMode="numeric" value={form.budget} disabled={!editable} onChange={(event) => onChange({ budget: formatInrInput(event.target.value) })} />
        </label>
        <p className="text-sm text-muted-foreground">
          Estimated cost <MoneyText amount={estimatedCost} />
        </p>
      </section>
    </>
  );
}

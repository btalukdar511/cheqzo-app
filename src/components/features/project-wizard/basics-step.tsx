"use client";

import { useRef } from "react";

import { SeedImage } from "@/components/shared/SeedImage";
import { Field } from "@/components/features/project-wizard/field";
import { BHK_OPTIONS, COVER_PRESETS, PROPERTY_TYPES, type ProjectDraft } from "@/components/features/project-wizard/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function BasicsStep({
  draft,
  errors,
  onChange,
}: {
  draft: ProjectDraft;
  errors: Record<string, string>;
  onChange: (patch: Partial<ProjectDraft>) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const uploaded = draft.coverImage.startsWith("blob:");

  function onFile(file: File | undefined) {
    if (!file) return;
    if (draft.coverImage.startsWith("blob:")) URL.revokeObjectURL(draft.coverImage);
    onChange({ coverImage: URL.createObjectURL(file) });
  }

  return (
    <div className="space-y-4">
      <Field label="Project name" htmlFor="project-name" error={errors.name}>
        <Input id="project-name" className="h-10" value={draft.name} onChange={(event) => onChange({ name: event.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Property type" htmlFor="property-type" error={errors.propertyType}>
          <Select value={draft.propertyType || undefined} onValueChange={(value) => onChange({ propertyType: value as ProjectDraft["propertyType"] })}>
            <SelectTrigger id="property-type" className="w-full">
              <SelectValue placeholder="Choose a type" />
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="BHK" htmlFor="bhk" error={errors.bhk}>
          <Select value={draft.bhk || undefined} onValueChange={(value) => onChange({ bhk: value })}>
            <SelectTrigger id="bhk" className="w-full">
              <SelectValue placeholder="Choose a BHK" />
            </SelectTrigger>
            <SelectContent>
              {BHK_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Area (sqft)" htmlFor="area" error={errors.areaSqft}>
          <Input id="area" className="h-10" inputMode="numeric" value={draft.areaSqft} onChange={(event) => onChange({ areaSqft: event.target.value })} />
        </Field>
        <Field label="City" htmlFor="city" error={errors.city}>
          <Input id="city" className="h-10" value={draft.city} onChange={(event) => onChange({ city: event.target.value })} />
        </Field>
        <Field label="Locality" htmlFor="locality" error={errors.locality}>
          <Input id="locality" className="h-10" value={draft.locality} onChange={(event) => onChange({ locality: event.target.value })} />
        </Field>
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">Cover image</p>
        <div className="mt-2 grid grid-cols-6 gap-2">
          {COVER_PRESETS.map((preset) => {
            const selected = draft.coverImage === preset.src;
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={selected}
                aria-label={preset.label}
                onClick={() => onChange({ coverImage: preset.src })}
                className={cn("relative aspect-[3/2] overflow-hidden rounded-lg ring-2", selected ? "ring-primary" : "ring-transparent")}
              >
                <SeedImage src={preset.src} alt="" sizes="120px" />
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(event) => onFile(event.target.files?.[0])} />
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
            Upload a cover
          </Button>
          {uploaded ? <p className="text-xs text-muted-foreground">Uploaded photos stay for this session.</p> : null}
        </div>
        {errors.coverImage ? <p className="mt-1 text-xs text-danger">{errors.coverImage}</p> : null}
      </div>
    </div>
  );
}

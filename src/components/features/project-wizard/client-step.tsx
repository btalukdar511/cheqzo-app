"use client";

import { Field } from "@/components/features/project-wizard/field";
import type { ProjectDraft } from "@/components/features/project-wizard/schema";
import { Input } from "@/components/ui/input";
import { normalizePhone } from "@/lib/auth";

export function ClientStep({
  draft,
  errors,
  onChange,
}: {
  draft: ProjectDraft;
  errors: Record<string, string>;
  onChange: (patch: Partial<ProjectDraft>) => void;
}) {
  return (
    <div className="space-y-4">
      <Field label="Homeowner name" htmlFor="client-name" error={errors.clientName}>
        <Input id="client-name" className="h-10" value={draft.clientName} onChange={(event) => onChange({ clientName: event.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Phone" htmlFor="client-phone" error={errors.clientPhone}>
          <Input
            id="client-phone"
            className="h-10"
            inputMode="numeric"
            placeholder="98450 11101"
            value={draft.clientPhone}
            onChange={(event) => onChange({ clientPhone: normalizePhone(event.target.value) })}
          />
        </Field>
        <Field label="Email" htmlFor="client-email" error={errors.clientEmail}>
          <Input
            id="client-email"
            className="h-10"
            type="email"
            value={draft.clientEmail}
            onChange={(event) => onChange({ clientEmail: event.target.value })}
          />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          className="size-4 accent-primary"
          checked={draft.inviteNow}
          onChange={(event) => onChange({ inviteNow: event.target.checked })}
        />
        Invite now
      </label>
      <p className="text-xs leading-4 text-muted-foreground">
        An existing homeowner number is linked to that account. A new number is saved as the client.
      </p>
    </div>
  );
}

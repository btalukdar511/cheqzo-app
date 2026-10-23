"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/data/api";
import { formatInrInput, parseInrInput } from "@/lib/financials";
import { SPEC_CATEGORIES } from "@/lib/rooms";
import type { SpecDraft } from "@/lib/rules";
import type { MaterialSpec } from "@/types";

function draftFrom(spec: MaterialSpec | null): SpecDraft {
  return {
    category: spec?.category ?? "Flooring",
    item: spec?.item ?? "",
    brand: spec?.brand ?? "",
    finish: spec?.finish ?? "",
    quantity: spec?.quantity ?? 1,
    unit: spec?.unit ?? "",
    estCost: spec?.estCost ?? 0,
  };
}

export function SpecDialog({
  open,
  onOpenChange,
  userId,
  roomId,
  spec,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  roomId: string;
  spec: MaterialSpec | null;
}) {
  const [draft, setDraft] = useState<SpecDraft>(() => draftFrom(spec));
  const [cost, setCost] = useState(() => (spec ? formatInrInput(String(spec.estCost)) : ""));
  const [busy, setBusy] = useState(false);

  function patch(next: Partial<SpecDraft>) {
    setDraft((current) => ({ ...current, ...next }));
  }

  async function save() {
    const payload = { ...draft, estCost: parseInrInput(cost) };
    setBusy(true);
    try {
      if (spec) await api.updateSpec(userId, roomId, spec.id, payload);
      else await api.addSpec(userId, roomId, payload);
      toast.success(spec ? "Spec updated" : "Spec added");
      onOpenChange(false);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not save the spec");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{spec ? "Edit spec" : "Add spec"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <label className="col-span-2 space-y-1.5 text-sm">
            <span className="font-medium text-foreground">Category</span>
            <Select value={draft.category} onValueChange={(value) => patch({ category: value as SpecDraft["category"] })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPEC_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="col-span-2 space-y-1.5 text-sm">
            <span className="font-medium text-foreground">Item</span>
            <Input value={draft.item} onChange={(event) => patch({ item: event.target.value })} />
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-foreground">Brand</span>
            <Input value={draft.brand ?? ""} onChange={(event) => patch({ brand: event.target.value })} />
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-foreground">Finish</span>
            <Input value={draft.finish ?? ""} onChange={(event) => patch({ finish: event.target.value })} />
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-foreground">Qty</span>
            <Input inputMode="decimal" value={String(draft.quantity)} onChange={(event) => patch({ quantity: Number(event.target.value) })} />
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-foreground">Unit</span>
            <Input value={draft.unit} onChange={(event) => patch({ unit: event.target.value })} />
          </label>
          <label className="col-span-2 space-y-1.5 text-sm">
            <span className="font-medium text-foreground">Estimated cost</span>
            <Input inputMode="numeric" value={cost} onChange={(event) => setCost(formatInrInput(event.target.value))} />
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={busy}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

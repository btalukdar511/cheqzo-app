"use client";

import { useState } from "react";
import { toast } from "sonner";

import { ROOM_TYPES } from "@/components/features/project-wizard/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/data/api";
import { formatInrInput, parseInrInput } from "@/lib/financials";
import type { Room } from "@/types";

export function AddRoomDialog({
  open,
  onOpenChange,
  userId,
  projectId,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  projectId: string;
  onAdded: (roomId: string) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<Room["type"]>("living");
  const [area, setArea] = useState("");
  const [budget, setBudget] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      const room = await api.addRoom(userId, projectId, {
        name,
        type,
        areaSqft: Number(area),
        budgetAllocation: parseInrInput(budget),
      });
      toast.success("Room added");
      setName("");
      setArea("");
      setBudget("");
      onAdded(room.id);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not add the room");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add room</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-foreground">Name</span>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-foreground">Type</span>
            <Select value={type} onValueChange={(value) => setType(value as Room["type"])}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROOM_TYPES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-foreground">Area (sqft)</span>
              <Input inputMode="numeric" value={area} onChange={(event) => setArea(event.target.value.replace(/\D/g, ""))} />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-foreground">Budget allocation</span>
              <Input inputMode="numeric" value={budget} onChange={(event) => setBudget(formatInrInput(event.target.value))} />
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={busy}>
            Add room
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

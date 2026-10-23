"use client";

import { useState } from "react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/data/api";
import { formatInrInput, parseInrInput } from "@/lib/financials";
import { cn } from "@/lib/utils";
import type { Room } from "@/types";

const schema = z
  .object({
    title: z.string().trim().min(1, "Enter a title"),
    description: z.string().trim().min(1, "Enter a description"),
    roomId: z.string(),
    cost: z.string(),
    costDirection: z.enum(["increase", "saving"]),
    days: z.string(),
    daysDirection: z.enum(["increase", "saving"]),
  })
  .superRefine((value, ctx) => {
    const cost = parseInrInput(value.cost);
    const days = Number(value.days.replace(/[^\d]/g, "") || "0");
    if (!Number.isInteger(days)) {
      ctx.addIssue({ code: "custom", message: "Use a whole number of days", path: ["days"] });
    }
    const signedCost = value.costDirection === "saving" ? -cost : cost;
    const signedDays = value.daysDirection === "saving" ? -days : days;
    if (signedCost === 0 && signedDays === 0) {
      ctx.addIssue({ code: "custom", message: "Add a cost or timeline impact", path: ["cost"] });
    }
  });

type FormValues = z.infer<typeof schema>;

function DirectionToggle({
  value,
  onChange,
  labels,
}: {
  value: "increase" | "saving";
  onChange: (value: "increase" | "saving") => void;
  labels: [string, string];
}) {
  return (
    <div className="flex rounded-lg border border-border p-0.5" role="group">
      {(["increase", "saving"] as const).map((option, index) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={cn(
            "flex-1 rounded-md px-2 py-1 text-xs font-medium",
            value === option ? "bg-primary text-primary-foreground" : "text-foreground",
          )}
        >
          {labels[index]}
        </button>
      ))}
    </div>
  );
}

export function RaiseChangeDialog({
  open,
  onOpenChange,
  userId,
  projectId,
  rooms,
  onRaised,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  projectId: string;
  rooms: Room[];
  onRaised: (requestId: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", roomId: "none", cost: "", costDirection: "increase", days: "", daysDirection: "increase" },
  });
  const roomId = useWatch({ control: form.control, name: "roomId" });
  const costValue = useWatch({ control: form.control, name: "cost" });
  const costDirection = useWatch({ control: form.control, name: "costDirection" });
  const daysDirection = useWatch({ control: form.control, name: "daysDirection" });
  const errors = form.formState.errors;

  async function onSubmit(values: FormValues) {
    const cost = parseInrInput(values.cost);
    const days = Number(values.days.replace(/[^\d]/g, "") || "0");
    setBusy(true);
    try {
      const created = await api.raiseChangeRequest(userId, projectId, {
        title: values.title,
        description: values.description,
        roomId: values.roomId === "none" ? undefined : values.roomId,
        costImpact: values.costDirection === "saving" ? -cost : cost,
        daysImpact: values.daysDirection === "saving" ? -days : days,
      });
      toast.success("Change request sent");
      form.reset();
      onRaised(created.id);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not raise the request");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Raise change request</DialogTitle>
          <DialogDescription>The other side decides. A saving is a negative cost or fewer days.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-foreground">Title</span>
            <Input {...form.register("title")} />
            {errors.title ? <span className="text-xs text-danger">{errors.title.message}</span> : null}
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-foreground">Description</span>
            <Textarea {...form.register("description")} />
            {errors.description ? <span className="text-xs text-danger">{errors.description.message}</span> : null}
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-foreground">Room</span>
            <Select value={roomId} onValueChange={(value) => form.setValue("roomId", value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific room</SelectItem>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-foreground">Cost impact</span>
              <DirectionToggle value={costDirection} onChange={(value) => form.setValue("costDirection", value)} labels={["Cost increase", "Saving"]} />
              <Input
                inputMode="numeric"
                value={costValue}
                onChange={(event) => form.setValue("cost", formatInrInput(event.target.value), { shouldValidate: true })}
                placeholder="₹"
              />
              {errors.cost ? <span className="text-xs text-danger">{errors.cost.message}</span> : null}
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-foreground">Timeline impact</span>
              <DirectionToggle value={daysDirection} onChange={(value) => form.setValue("daysDirection", value)} labels={["More days", "Fewer days"]} />
              <Input inputMode="numeric" {...form.register("days")} placeholder="Days" />
              {errors.days ? <span className="text-xs text-danger">{errors.days.message}</span> : null}
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Sending…" : "Send request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

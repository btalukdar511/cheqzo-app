"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";

import { PhotoUploader } from "@/components/features/updates/photo-uploader";
import {
  blankPost,
  postUpdateSchema,
  revokePhotos,
  type PostFormValues,
} from "@/components/features/updates/post-update-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/data/api";
import { cn } from "@/lib/utils";
import type { Room } from "@/types";

export function PostUpdateSheet({
  open,
  onOpenChange,
  userId,
  projectId,
  rooms,
  onPosted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  projectId: string;
  rooms: Room[];
  onPosted: (updateId: string) => void;
}) {
  const [sending, setSending] = useState(false);
  const schema = useMemo(() => postUpdateSchema(() => rooms), [rooms]);
  const form = useForm<PostFormValues>({
    defaultValues: blankPost(rooms),
    resolver: (values, context, options) => zodResolver(schema)(values, context, options),
  });
  const photos = useWatch({ control: form.control, name: "photos" });
  const roomId = useWatch({ control: form.control, name: "roomId" });
  const proposed = useWatch({ control: form.control, name: "proposedProgress" });
  const notify = useWatch({ control: form.control, name: "notifyClient" });
  const room = rooms.find((item) => item.id === roomId);
  const current = room?.progress ?? 0;
  const errors = form.formState.errors;

  function dismiss(next: boolean) {
    if (next) {
      onOpenChange(true);
      return;
    }
    revokePhotos(form.getValues("photos"));
    form.reset(blankPost(rooms));
    onOpenChange(false);
  }

  function chooseRoom(nextId: string) {
    form.setValue("roomId", nextId, { shouldValidate: true });
    const next = rooms.find((item) => item.id === nextId);
    if (next && form.getValues("proposedProgress") < next.progress) {
      form.setValue("proposedProgress", next.progress);
    }
  }

  async function onSubmit(values: PostFormValues) {
    setSending(true);
    try {
      const created = await api.postUpdate(userId, { projectId, ...values });
      form.reset(blankPost(rooms));
      onOpenChange(false);
      onPosted(created.id);
      toast.success("Update sent for approval");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not send the update");
    } finally {
      setSending(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={dismiss}>
      <SheetContent side="right" className="w-[560px] gap-0 overflow-y-auto sm:max-w-[560px]" style={{ width: 560, maxWidth: 560 }}>
        <SheetHeader>
          <SheetTitle>Post update</SheetTitle>
          <SheetDescription>The client reviews this before the room progress changes.</SheetDescription>
        </SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-4 px-4 pb-4">
          <label className="block space-y-1.5 text-sm font-medium text-foreground">
            Room
            <Select value={roomId} onValueChange={chooseRoom}>
              <SelectTrigger aria-label="Room" className="w-full font-normal">
                <SelectValue placeholder="Choose a room" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.roomId?.message ? <span className="block text-xs font-normal text-danger">{errors.roomId.message}</span> : null}
          </label>
          <label className="block space-y-1.5 text-sm font-medium text-foreground">
            Title
            <Input {...form.register("title")} placeholder="What changed on site" />
            {errors.title?.message ? <span className="block text-xs font-normal text-danger">{errors.title.message}</span> : null}
          </label>
          <label className="block space-y-1.5 text-sm font-medium text-foreground">
            Description
            <Textarea {...form.register("description")} placeholder="A short note for the client" />
          </label>
          <PhotoUploader
            photos={photos}
            error={errors.photos?.message}
            onChange={(next) => form.setValue("photos", next, { shouldValidate: true })}
          />
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <label htmlFor="proposed-progress" className="font-medium text-foreground">
                Proposed progress
              </label>
              <span className="tabular-nums text-muted-foreground">
                {current}% → {proposed}%
                {proposed > current ? ` (+${proposed - current})` : ""}
              </span>
            </div>
            <input
              id="proposed-progress"
              type="range"
              min={current}
              max={100}
              step={1}
              value={proposed}
              onChange={(event) => form.setValue("proposedProgress", Number(event.target.value), { shouldValidate: true })}
              className="w-full accent-primary"
            />
            {errors.proposedProgress?.message ? <p className="text-xs text-danger">{errors.proposedProgress.message}</p> : null}
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-foreground">Notify client</span>
            <button
              type="button"
              role="switch"
              aria-checked={notify}
              onClick={() => form.setValue("notifyClient", !notify)}
              className={cn("relative h-5 w-9 rounded-full transition-colors", notify ? "bg-primary" : "bg-border")}
            >
              <span
                className={cn(
                  "absolute top-0.5 size-4 rounded-full bg-surface transition-transform",
                  notify ? "translate-x-4" : "translate-x-0.5",
                )}
              />
            </button>
          </div>
          <SheetFooter className="px-0">
            <Button type="submit" disabled={sending}>
              {sending ? "Sending…" : "Send for approval"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

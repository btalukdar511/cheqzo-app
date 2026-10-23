"use client";

import { useState } from "react";

import { DisabledHint } from "@/components/shell/DisabledHint";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  requireReason?: boolean;
  reasonLabel?: string;
  onConfirm: (reason?: string) => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  requireReason = false,
  reasonLabel = "Reason",
  onConfirm,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState("");
  const trimmed = reason.trim();
  const blocked = requireReason && trimmed.length === 0;

  function confirm() {
    if (blocked) return;
    onConfirm(requireReason ? trimmed : undefined);
    setReason("");
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setReason("");
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {requireReason ? (
          <label className="block space-y-1.5 text-sm">
            <span className="text-foreground">{reasonLabel}</span>
            <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Add a reason" />
          </label>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <DisabledHint disabled={blocked} reason="Add a reason first">
            <Button variant="destructive" onClick={confirm} disabled={blocked}>
              {confirmLabel}
            </Button>
          </DisabledHint>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

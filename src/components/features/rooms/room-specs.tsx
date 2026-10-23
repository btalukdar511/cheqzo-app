"use client";

import { useState } from "react";
import { toast } from "sonner";

import { SpecDialog } from "@/components/features/rooms/spec-dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { MoneyText } from "@/components/shared/MoneyText";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/data/api";
import { overAllocation, specGroups, specTotal } from "@/lib/rooms";
import { SPEC_STATUSES, can, type Actor } from "@/lib/rules";
import type { MaterialSpec, Room } from "@/types";

export function RoomSpecs({ room, userId, actor }: { room: Room; userId: string; actor: Actor }) {
  const [editing, setEditing] = useState<MaterialSpec | null>(null);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<MaterialSpec | null>(null);
  const designer = can(actor, "edit_room");
  const approver = can(actor, "decide_update");
  const total = specTotal(room.specs);
  const over = overAllocation(total, room.budgetAllocation);
  const groups = specGroups(room.specs);

  async function setStatus(specId: string, status: MaterialSpec["status"]) {
    try {
      await api.setSpecStatus(userId, room.id, specId, status);
      toast.success(status === "approved" ? "Spec approved" : "Spec status updated");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not update the spec");
    }
  }

  async function remove() {
    if (!removing) return;
    try {
      await api.deleteSpec(userId, room.id, removing.id);
      toast.success("Spec removed");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not remove the spec");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <MoneyText amount={total} /> of <MoneyText amount={room.budgetAllocation} /> allocated
        </p>
        {designer.allowed ? (
          <Button type="button" onClick={() => setAdding(true)}>
            Add spec
          </Button>
        ) : null}
      </div>
      {over > 0 ? (
        <p className="rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">
          Specs are over the room allocation by <MoneyText amount={over} />.
        </p>
      ) : null}
      {groups.length === 0 ? <p className="text-sm text-muted-foreground">No specs yet.</p> : null}
      {groups.map((group) => (
        <section key={group.category}>
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">{group.category}</h3>
            <MoneyText amount={group.subtotal} className="text-sm text-muted-foreground" />
          </div>
          <table className="w-full text-sm">
            <tbody>
              {group.items.map((spec) => (
                <tr key={spec.id} className="border-t border-border">
                  <td className="py-2 pr-2 text-foreground">
                    <span className="block">{spec.item}</span>
                    <span className="text-xs text-muted-foreground">
                      {[spec.brand, spec.finish, `${spec.quantity} ${spec.unit}`].filter(Boolean).join(" · ")}
                    </span>
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    <MoneyText amount={spec.estCost} />
                  </td>
                  <td className="py-2 pl-3 text-right">
                    {designer.allowed ? (
                      <Select value={spec.status} onValueChange={(value) => void setStatus(spec.id, value as MaterialSpec["status"])}>
                        <SelectTrigger aria-label={`${spec.item} status`} className="ml-auto w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SPEC_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status === "proposed" ? "Proposed" : status === "approved" ? "Approved" : status === "ordered" ? "Ordered" : "Installed"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : spec.status === "proposed" ? (
                      <RoleGuard allowed={approver.allowed} reason={approver.reason}>
                        <Button size="sm" onClick={() => void setStatus(spec.id, "approved")}>
                          Approve
                        </Button>
                      </RoleGuard>
                    ) : (
                      <StatusBadge status={spec.status} />
                    )}
                  </td>
                  {designer.allowed ? (
                    <td className="py-2 pl-2 text-right whitespace-nowrap">
                      <button type="button" className="rounded-sm text-xs font-medium text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50" onClick={() => setEditing(spec)}>
                        Edit
                      </button>
                      <button type="button" className="ml-2 rounded-sm text-xs font-medium text-danger outline-none focus-visible:ring-3 focus-visible:ring-ring/50" onClick={() => setRemoving(spec)}>
                        Delete
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
      <SpecDialog
        key={editing?.id ?? (adding ? "new" : "closed")}
        open={adding || editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAdding(false);
            setEditing(null);
          }
        }}
        userId={userId}
        roomId={room.id}
        spec={editing}
      />
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => { if (!open) setRemoving(null); }}
        title="Delete this spec?"
        description={removing ? `${removing.item} will leave the room total.` : ""}
        confirmLabel="Delete"
        onConfirm={() => void remove()}
      />
    </div>
  );
}

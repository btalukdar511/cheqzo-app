import { describe, expect, it } from "vitest";

import { createSeedData, IDS } from "@/data/seed";
import { committedSpend, overAllocation, roomActivity, specGroups, specTotal } from "@/lib/rooms";
import { actorFromUser, addSpec, setSpecStatus } from "@/lib/rules";
import type { User } from "@/types";

function user(id: string): User {
  const found = createSeedData().users.find((item) => item.id === id);
  if (!found) throw new Error(id);
  return found;
}

describe("room specs", () => {
  const data = createSeedData();
  const living = data.rooms.find((room) => room.id === IDS.living);
  if (!living) throw new Error("missing living room");

  it("groups subtotals and flags a total above the allocation", () => {
    const groups = specGroups(living.specs);
    const flooring = groups.find((group) => group.category === "Flooring");
    expect(flooring?.subtotal).toBe(185000);
    expect(specTotal(living.specs)).toBe(185000 + 28000 + 96000 + 22000 + 85000);
    expect(overAllocation(specTotal(living.specs), living.budgetAllocation)).toBe(0);
    expect(committedSpend(living.specs)).toBe(185000);
    expect(overAllocation(living.budgetAllocation + 1, living.budgetAllocation)).toBe(1);
  });

  it("lets the homeowner approve a proposed spec and blocks other edits", () => {
    const proposed = living.specs.find((spec) => spec.status === "proposed");
    if (!proposed) throw new Error("missing proposed spec");
    const approved = setSpecStatus({
      actor: actorFromUser(user(IDS.ananya)),
      room: living,
      specId: proposed.id,
      status: "approved",
    });
    if (!approved.ok) throw new Error(approved.reason);
    expect(approved.value.room.specs.find((spec) => spec.id === proposed.id)?.status).toBe("approved");

    const ordered = setSpecStatus({
      actor: actorFromUser(user(IDS.ananya)),
      room: living,
      specId: proposed.id,
      status: "ordered",
    });
    expect(ordered.ok).toBe(false);

    const added = addSpec({
      actor: actorFromUser(user(IDS.meera)),
      room: living,
      draft: { category: "Lighting", item: "Sconce", quantity: 2, unit: "nos", estCost: 4000 },
    });
    expect(added.ok).toBe(false);
  });

  it("lists living-room updates and the cove request in chronological order", () => {
    const events = roomActivity({
      roomId: IDS.living,
      updates: data.updates,
      changeRequests: data.changeRequests,
    });
    expect(events.map((event) => event.id)).toEqual([IDS.cove, "upd_kora_living_frame"]);
    expect(events[0]?.at < events[1]?.at).toBe(true);
  });
});

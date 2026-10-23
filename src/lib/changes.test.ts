import { describe, expect, it } from "vitest";

import { createSeedData, IDS } from "@/data/seed";
import { changeKpis, previewCopy, queryChanges, signedMoney } from "@/lib/changes";
import { formatINRCompact } from "@/lib/format";
import { actorFromUser, estimatedCost, raiseChangeRequest, rejectChangeRequest, withdrawChangeRequest } from "@/lib/rules";
import type { Project, User } from "@/types";

function user(id: string): User {
  const found = createSeedData().users.find((item) => item.id === id);
  if (!found) throw new Error(id);
  return found;
}

function project(id: string): Project {
  const found = createSeedData().projects.find((item) => item.id === id);
  if (!found) throw new Error(id);
  return found;
}

describe("change requests", () => {
  const data = createSeedData();
  const hero = project(IDS.koramangala);
  const requests = data.changeRequests.filter((item) => item.projectId === hero.id);

  it("sums approved cost and days, and names the oldest pending decision", () => {
    const kpis = changeKpis(requests);
    expect(kpis.pending).toBe(1);
    expect(kpis.netCost).toBe(10_000);
    expect(kpis.netDays).toBe(1);
    expect(kpis.nextDue).toBe("2026-10-18T15:00:00");
  });

  it("previews the cove-lit ceiling as ₹17.9L to ₹19.3L and 15 Dec to 20 Dec", () => {
    const cove = requests.find((item) => item.id === IDS.cove);
    if (!cove) throw new Error("missing cove");
    const copy = previewCopy(hero, data.changeRequests, cove);
    expect(copy.cost).toBe("Estimated cost ₹17.9L → ₹19.3L");
    expect(copy.end).toBe("End date 15 Dec → 20 Dec");
    expect(formatINRCompact(copy.costAfter)).toBe("₹19.3L");
  });

  it("blocks a request with no cost or timeline impact and keeps a saving negative", () => {
    const blocked = raiseChangeRequest({
      actor: actorFromUser(user(IDS.ananya)),
      project: hero,
      draft: { title: "Nothing", description: "No change", costImpact: 0, daysImpact: 0 },
    });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.reason).toBe("Add a cost or timeline impact");

    const saving = raiseChangeRequest({
      actor: actorFromUser(user(IDS.rohan)),
      project: hero,
      draft: { title: "Drop a pendant", description: "Use the existing light", costImpact: -12000, daysImpact: 0 },
      requestId: "cr_new",
      notificationId: "nt_new",
    });
    if (!saving.ok) throw new Error(saving.reason);
    expect(saving.value.request.costImpact).toBe(-12000);
    expect(signedMoney(saving.value.request.costImpact)).toBe("−₹12,000");
    expect(saving.value.notification.userId).toBe(IDS.ananya);
    expect(saving.value.notification.href).toBe(`/projects/${IDS.koramangala}/changes?request=cr_new`);
    expect(queryChanges([saving.value.request], { status: "pending", raisedBy: "designer" })).toHaveLength(1);
  });

  it("leaves the budget unchanged when a request is rejected or withdrawn", () => {
    const cove = requests.find((item) => item.id === IDS.cove);
    if (!cove) throw new Error("missing cove");
    const rejected = rejectChangeRequest({ request: cove, actor: actorFromUser(user(IDS.ananya)), comment: "Not now" });
    if (!rejected.ok) throw new Error(rejected.reason);
    const next = data.changeRequests.map((item) => (item.id === cove.id ? rejected.value.request : item));
    expect(estimatedCost(hero, next)).toBe(1_790_000);
    expect(rejected.value.notification.href).toContain("request=");

    const withdrawn = withdrawChangeRequest({ request: cove, actor: actorFromUser(user(IDS.rohan)) });
    if (!withdrawn.ok) throw new Error(withdrawn.reason);
    const afterWithdraw = data.changeRequests.map((item) => (item.id === cove.id ? withdrawn.value.request : item));
    expect(estimatedCost(hero, afterWithdraw)).toBe(1_790_000);
    expect(withdrawn.value.request.status).toBe("withdrawn");
  });
});

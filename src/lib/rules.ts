import { addDays, differenceInCalendarDays, format, isAfter, isValid, parseISO } from "date-fns";

import { phoneSchema, normalizePhone } from "@/lib/auth";
import { createId, DEMO_NOW, uniqueId } from "@/lib/demo";
import { formatINRCompact } from "@/lib/format";
import type {
  ChangeRequest,
  Comment,
  Health,
  InspirationItem,
  MaterialSpec,
  MemberAccess,
  Notification,
  Payment,
  PaymentAuditEntry,
  Project,
  Role,
  Room,
  SiteUpdate,
  TeamMember,
  User,
} from "@/types";

export interface Actor {
  id: string;
  role: Role;
  access: MemberAccess;
}

export type Capability =
  | "see_project"
  | "create_project"
  | "post_update"
  | "decide_update"
  | "record_payment"
  | "decide_payment"
  | "raise_change_request"
  | "decide_change_request"
  | "edit_room"
  | "edit_project"
  | "invite_member";

export interface PermissionContext {
  raisedByRole?: Role;
  raisedById?: string;
}

export interface Permission {
  allowed: boolean;
  reason: string;
}

export interface HealthResult {
  health: Health;
  reasons: string[];
}

export interface ProjectSummary {
  health: Health;
  reasons: string[];
  progress: number;
  estimatedCost: number;
  totalPaid: number;
  awaitingAcknowledgement: number;
  remaining: number;
  delayDays: number;
  projectedEndDate: string;
  originalEndDate: string;
}

export type RuleResult<T> = { ok: true; value: T } | { ok: false; reason: string };

export function actorFromUser(user: User): Actor {
  return { id: user.id, role: user.role, access: user.access };
}

function forProject<T extends { projectId: string }>(items: T[], projectId: string): T[] {
  return items.filter((item) => item.projectId === projectId);
}

function countsAfterSeed(request: ChangeRequest): boolean {
  return request.status === "approved" && !request.appliedToBaseline;
}

export function approvedChangeDays(project: Project, changeRequests: ChangeRequest[]): number {
  return forProject(changeRequests, project.id)
    .filter(countsAfterSeed)
    .reduce((total, request) => total + request.daysImpact, 0);
}

export function delayDays(project: Project, changeRequests: ChangeRequest[]): number {
  return project.seedDelayDays + approvedChangeDays(project, changeRequests);
}

export function projectedEndDate(project: Project, changeRequests: ChangeRequest[]): Date {
  return addDays(parseISO(project.originalEndDate), delayDays(project, changeRequests));
}

export function estimatedCost(project: Project, changeRequests: ChangeRequest[]): number {
  const added = forProject(changeRequests, project.id)
    .filter(countsAfterSeed)
    .reduce((total, request) => total + request.costImpact, 0);
  return project.baseBudget + added;
}

export function totalPaid(payments: Payment[]): number {
  return payments
    .filter((payment) => payment.status === "acknowledged")
    .reduce((total, payment) => total + payment.amount, 0);
}

export function awaitingAcknowledgement(payments: Payment[]): number {
  return payments
    .filter((payment) => payment.status === "awaiting_ack")
    .reduce((total, payment) => total + payment.amount, 0);
}

export function remaining(project: Project, changeRequests: ChangeRequest[], payments: Payment[]): number {
  return estimatedCost(project, changeRequests) - totalPaid(forProject(payments, project.id));
}

export function projectProgress(rooms: Pick<Room, "progress" | "budgetAllocation">[]): number {
  const allocation = rooms.reduce((total, room) => total + room.budgetAllocation, 0);
  if (allocation === 0) return 0;
  const weighted = rooms.reduce((total, room) => total + room.progress * room.budgetAllocation, 0);
  return weighted / allocation;
}

export function pendingProposal(roomId: string, updates: SiteUpdate[]): number | undefined {
  const pending = updates
    .filter((update) => update.roomId === roomId && update.status === "pending")
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  return pending[0]?.proposedProgress;
}

function daysSince(iso: string, now: Date): number {
  return differenceInCalendarDays(now, parseISO(iso));
}

export function projectHealth(input: {
  project: Project;
  updates: SiteUpdate[];
  payments: Payment[];
  changeRequests: ChangeRequest[];
  now?: Date;
}): HealthResult {
  const now = input.now ?? DEMO_NOW;
  const updates = forProject(input.updates, input.project.id);
  const payments = forProject(input.payments, input.project.id);
  const changeRequests = forProject(input.changeRequests, input.project.id);
  const lateBy = delayDays(input.project, input.changeRequests);

  const activity = updates.filter((update) => update.status === "approved" || update.status === "pending");
  const newest = activity.reduce<string | null>((latest, update) => {
    if (!latest || update.createdAt > latest) return update.createdAt;
    return latest;
  }, null);
  const quietDays = newest ? daysSince(newest, now) : null;
  const isStale = quietDays === null || quietDays > 10;
  const hasDispute = payments.some((payment) => payment.status === "disputed");

  const atRisk: string[] = [];
  if (lateBy > 14) atRisk.push(`Projected ${lateBy} days late`);
  if (isStale) atRisk.push(quietDays === null ? "No updates yet" : `No update in ${quietDays} days`);
  if (hasDispute) atRisk.push("Payment disputed");
  if (atRisk.length > 0) return { health: "at_risk", reasons: atRisk };

  const attention: string[] = [];
  if (lateBy >= 5 && lateBy <= 14) attention.push(`Projected ${lateBy} days late`);
  const oldPending = updates.filter((update) => update.status === "pending" && daysSince(update.createdAt, now) > 3);
  if (oldPending.length > 0) {
    attention.push(
      `${oldPending.length} update${oldPending.length === 1 ? "" : "s"} pending for more than 3 days`,
    );
  }
  const oldAck = payments.filter(
    (payment) => payment.status === "awaiting_ack" && daysSince(payment.date, now) > 2,
  );
  if (oldAck.length > 0) {
    attention.push(
      `${oldAck.length} payment${oldAck.length === 1 ? "" : "s"} awaiting acknowledgement`,
    );
  }
  const pendingRequests = changeRequests.filter((request) => request.status === "pending");
  if (pendingRequests.length > 0) {
    attention.push(
      `${pendingRequests.length} change request${pendingRequests.length === 1 ? "" : "s"} pending`,
    );
  }
  if (attention.length > 0) return { health: "needs_attention", reasons: attention };
  return { health: "on_track", reasons: [] };
}

export function summarizeProject(input: {
  project: Project;
  rooms: Room[];
  updates: SiteUpdate[];
  payments: Payment[];
  changeRequests: ChangeRequest[];
  now?: Date;
}): ProjectSummary {
  const health = projectHealth(input);
  const projectPayments = forProject(input.payments, input.project.id);
  const end = projectedEndDate(input.project, input.changeRequests);
  return {
    health: health.health,
    reasons: health.reasons,
    progress: projectProgress(forProject(input.rooms, input.project.id)),
    estimatedCost: estimatedCost(input.project, input.changeRequests),
    totalPaid: totalPaid(projectPayments),
    awaitingAcknowledgement: awaitingAcknowledgement(projectPayments),
    remaining: remaining(input.project, input.changeRequests, input.payments),
    delayDays: delayDays(input.project, input.changeRequests),
    projectedEndDate: format(end, "yyyy-MM-dd"),
    originalEndDate: input.project.originalEndDate,
  };
}

function deny(reason: string): Permission {
  return { allowed: false, reason };
}

function allow(): Permission {
  return { allowed: true, reason: "" };
}

export function can(actor: Actor, capability: Capability, context?: PermissionContext): Permission {
  if (capability === "see_project") return allow();

  if (actor.access === "view") return deny("You have view-only access");

  const isDesigner = actor.role === "designer" && actor.access === "full";
  const isOwner = actor.role === "homeowner" && actor.access === "full";
  const canApprove = actor.role === "homeowner" && (actor.access === "full" || actor.access === "approve");

  switch (capability) {
    case "create_project":
    case "post_update":
    case "record_payment":
    case "edit_room":
    case "edit_project":
      if (isDesigner) return allow();
      if (capability === "post_update") return deny("Only the designer can post updates");
      if (capability === "record_payment") return deny("Only the designer can record payments");
      if (capability === "edit_room") return deny("Only the designer can edit room specs");
      if (capability === "edit_project") return deny("Only the designer can edit project settings");
      return deny("Only a designer can create a project");
    case "decide_update":
    case "decide_payment":
      if (canApprove) return allow();
      if (isDesigner) {
        return deny(
          capability === "decide_update"
            ? "Only the homeowner can approve"
            : "Only the homeowner can acknowledge payments",
        );
      }
      return deny("You have view-only access");
    case "raise_change_request":
      if (isDesigner || canApprove) return allow();
      return deny("You can't raise a change request");
    case "decide_change_request": {
      if (!context?.raisedByRole || !context.raisedById) {
        return deny("This request can't be decided");
      }
      if (context.raisedById === actor.id) return deny("You can't decide a request you raised");
      if (isDesigner && context.raisedByRole === "homeowner") return allow();
      if (canApprove && context.raisedByRole === "designer") return allow();
      if (isDesigner) return deny("You can't decide a request you raised");
      return deny("Only the counterparty can decide this request");
    }
    case "invite_member":
      if (isOwner || isDesigner) return allow();
      return deny("Only the homeowner or designer can invite members");
    default:
      return deny("You can't do that");
  }
}

export interface NavBadges {
  updates: number;
  payments: number;
  changes: number;
}

export function projectNavBadges(
  projectId: string,
  updates: SiteUpdate[],
  payments: Payment[],
  changeRequests: ChangeRequest[],
): NavBadges {
  return {
    updates: forProject(updates, projectId).filter((item) => item.status === "pending").length,
    payments: forProject(payments, projectId).filter((item) => item.status === "awaiting_ack").length,
    changes: forProject(changeRequests, projectId).filter((item) => item.status === "pending").length,
  };
}

export function projectsForUser(user: User, projects: Project[], teamMembers: TeamMember[]): Project[] {
  if (user.accountKind === "designer") return projects.filter((project) => project.designerId === user.id);
  if (user.accountKind === "family") {
    const ids = new Set(
      teamMembers
        .filter((member) => member.role === "family" && member.contact === user.phone)
        .map((member) => member.projectId),
    );
    return projects.filter((project) => ids.has(project.id));
  }
  return projects.filter((project) => project.homeownerId === user.id);
}

export function canSeeProject(
  user: User,
  projectId: string,
  projects: Project[],
  teamMembers: TeamMember[],
): boolean {
  return projectsForUser(user, projects, teamMembers).some((project) => project.id === projectId);
}

function fail<T>(reason: string): RuleResult<T> {
  return { ok: false, reason };
}

export function approveUpdate(input: {
  update: SiteUpdate;
  room: Room;
  actor: Actor;
  now?: string;
  notificationId?: string;
}): RuleResult<{ update: SiteUpdate; room: Room; notification: Notification }> {
  const permission = can(input.actor, "decide_update");
  if (!permission.allowed) return fail(permission.reason);
  if (input.update.status !== "pending") return fail("Only pending updates can be actioned");
  const at = input.now ?? DEMO_NOW.toISOString();
  const progress = input.update.proposedProgress;
  return {
    ok: true,
    value: {
      update: {
        ...input.update,
        status: "approved",
        decision: { byId: input.actor.id, at },
      },
      room: {
        ...input.room,
        progress,
        status: progress >= 100 ? "completed" : "in_progress",
      },
      notification: {
        id: input.notificationId ?? createId("nt"),
        userId: input.update.authorId,
        projectId: input.update.projectId,
        type: "update_decided",
        title: "Update approved",
        body: `${input.room.name} progress updated to ${progress}%`,
        createdAt: at,
        read: false,
        href: `/projects/${input.update.projectId}/updates?update=${input.update.id}`,
      },
    },
  };
}

export function requestUpdateChanges(input: {
  update: SiteUpdate;
  actor: Actor;
  comment: string;
  now?: string;
  commentId?: string;
  notificationId?: string;
}): RuleResult<{ update: SiteUpdate; notification: Notification }> {
  const permission = can(input.actor, "decide_update");
  if (!permission.allowed) return fail(permission.reason);
  if (input.update.status !== "pending") return fail("Only pending updates can be actioned");
  const comment = input.comment.trim();
  if (!comment) return fail("A comment is required");
  const at = input.now ?? DEMO_NOW.toISOString();
  return {
    ok: true,
    value: {
      update: {
        ...input.update,
        status: "changes_requested",
        decision: { byId: input.actor.id, at, comment },
        thread: [
          ...input.update.thread,
          { id: input.commentId ?? createId("cmt"), authorId: input.actor.id, text: comment, createdAt: at },
        ],
      },
      notification: {
        id: input.notificationId ?? createId("nt"),
        userId: input.update.authorId,
        projectId: input.update.projectId,
        type: "update_decided",
        title: "Changes requested",
        body: comment,
        createdAt: at,
        read: false,
        href: `/projects/${input.update.projectId}/updates?update=${input.update.id}`,
      },
    },
  };
}

export function rejectUpdate(input: {
  update: SiteUpdate;
  actor: Actor;
  reason: string;
  now?: string;
  notificationId?: string;
}): RuleResult<{ update: SiteUpdate; notification: Notification }> {
  const permission = can(input.actor, "decide_update");
  if (!permission.allowed) return fail(permission.reason);
  if (input.update.status !== "pending") return fail("Only pending updates can be actioned");
  const reason = input.reason.trim();
  if (!reason) return fail("A reason is required");
  const at = input.now ?? DEMO_NOW.toISOString();
  return {
    ok: true,
    value: {
      update: {
        ...input.update,
        status: "rejected",
        decision: { byId: input.actor.id, at, comment: reason },
      },
      notification: {
        id: input.notificationId ?? createId("nt"),
        userId: input.update.authorId,
        projectId: input.update.projectId,
        type: "update_decided",
        title: "Update rejected",
        body: reason,
        createdAt: at,
        read: false,
        href: `/projects/${input.update.projectId}/updates?update=${input.update.id}`,
      },
    },
  };
}

export function postUpdate(input: {
  actor: Actor;
  room: Room;
  homeownerId: string;
  title: string;
  description: string;
  photos: SiteUpdate["photos"];
  proposedProgress: number;
  notifyClient: boolean;
  now?: string;
  updateId?: string;
  notificationId?: string;
}): RuleResult<{ update: SiteUpdate; room: Room; notification?: Notification }> {
  const permission = can(input.actor, "post_update");
  if (!permission.allowed) return fail(permission.reason);
  const title = input.title.trim();
  if (!title) return fail("Enter a title");
  if (input.photos.length === 0) return fail("Add at least one photo");
  if (input.photos.some((photo) => !photo.url || !photo.kind)) return fail("Each photo needs an image");
  if (!Number.isFinite(input.proposedProgress) || input.proposedProgress < 0 || input.proposedProgress > 100) {
    return fail("Proposed progress has to be between 0 and 100");
  }
  if (input.proposedProgress < input.room.progress) {
    return fail("Proposed progress has to be at least the current progress");
  }
  const at = input.now ?? DEMO_NOW.toISOString();
  const id = input.updateId ?? createId("upd");
  const update: SiteUpdate = {
    id,
    projectId: input.room.projectId,
    roomId: input.room.id,
    authorId: input.actor.id,
    title,
    description: input.description.trim(),
    photos: input.photos.map((photo) => ({
      url: photo.url,
      caption: photo.caption.trim(),
      kind: photo.kind,
    })),
    previousProgress: input.room.progress,
    proposedProgress: input.proposedProgress,
    status: "pending",
    createdAt: at,
    thread: [],
  };
  const notification: Notification | undefined = input.notifyClient
    ? {
        id: input.notificationId ?? createId("nt"),
        userId: input.homeownerId,
        projectId: input.room.projectId,
        type: "update_pending",
        title: `${input.room.name} update awaiting your approval`,
        body: title,
        createdAt: at,
        read: false,
        href: `/projects/${input.room.projectId}/updates?update=${id}`,
      }
    : undefined;
  return {
    ok: true,
    value: {
      update,
      room: { ...input.room, status: "awaiting_approval" },
      notification,
    },
  };
}

export function addUpdateComment(input: {
  update: SiteUpdate;
  actor: Actor;
  text: string;
  now?: string;
  commentId?: string;
}): RuleResult<{ update: SiteUpdate }> {
  const text = input.text.trim();
  if (!text) return fail("Write a comment");
  const at = input.now ?? DEMO_NOW.toISOString();
  return {
    ok: true,
    value: {
      update: {
        ...input.update,
        thread: [
          ...input.update.thread,
          { id: input.commentId ?? createId("cmt"), authorId: input.actor.id, text, createdAt: at },
        ],
      },
    },
  };
}

export const PAYMENT_STAGES = [
  "Advance",
  "Design",
  "Material",
  "Carpentry",
  "Electrical & Plumbing",
  "Finishing",
  "Handover",
] as const;

export const PAYMENT_METHODS = ["UPI", "Bank Transfer", "Cash", "Cheque"] as const;

export const PAYMENT_STATUSES = ["awaiting_ack", "acknowledged", "disputed"] as const;

export function isPaymentStage(value: string): value is Payment["stage"] {
  return (PAYMENT_STAGES as readonly string[]).includes(value);
}

export function isPaymentMethod(value: string): value is Payment["method"] {
  return (PAYMENT_METHODS as readonly string[]).includes(value);
}

export function isPaymentStatus(value: string): value is Payment["status"] {
  return (PAYMENT_STATUSES as readonly string[]).includes(value);
}

export function normalizePaymentDate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const dated = /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? `${trimmed}T12:00:00` : trimmed;
  if (!isValid(parseISO(dated))) return null;
  return dated;
}

export interface PaymentDraftIssues {
  amount?: string;
  date?: string;
  stage?: string;
  reference?: string;
}

export interface PaymentWrite {
  amount: number;
  date: string;
  method: Payment["method"];
  reference?: string;
  stage: Payment["stage"];
  note?: string;
  receiptUrl?: string;
}

export function paymentDraftIssues(input: {
  amount: number;
  date: string;
  method: Payment["method"];
  reference?: string;
  stage: string;
}): PaymentDraftIssues {
  const issues: PaymentDraftIssues = {};
  if (!Number.isInteger(input.amount) || input.amount <= 0) issues.amount = "Enter an amount";
  if (!normalizePaymentDate(input.date)) issues.date = "Choose a date";
  if (!isPaymentStage(input.stage)) issues.stage = "Choose a stage";
  if (input.method !== "Cash" && !input.reference?.trim()) {
    issues.reference = "Add a reference for this payment method";
  }
  return issues;
}

function firstDraftIssue(issues: PaymentDraftIssues): string | null {
  return issues.amount ?? issues.date ?? issues.stage ?? issues.reference ?? null;
}

function paymentHref(projectId: string, paymentId: string): string {
  return `/projects/${projectId}/financials?payment=${paymentId}`;
}

function auditEntry(
  action: PaymentAuditEntry["action"],
  actorId: string,
  at: string,
  note?: string,
  id?: string,
): PaymentAuditEntry {
  return { id: id ?? createId("aud"), at, actorId, action, note };
}

export function recordPayment(input: PaymentWrite & {
  actor: Actor;
  projectId: string;
  homeownerId: string;
  now?: string;
  paymentId?: string;
  notificationId?: string;
  auditId?: string;
}): RuleResult<{ payment: Payment; notification: Notification }> {
  const permission = can(input.actor, "record_payment");
  if (!permission.allowed) return fail(permission.reason);
  const problem = firstDraftIssue(paymentDraftIssues(input));
  if (problem) return fail(problem);
  const date = normalizePaymentDate(input.date);
  if (!date) return fail("Choose a date");
  const at = input.now ?? DEMO_NOW.toISOString();
  const id = input.paymentId ?? createId("pay");
  const reference = input.method === "Cash" ? undefined : input.reference?.trim();
  const note = input.note?.trim() || undefined;
  const receiptUrl = input.receiptUrl || undefined;
  const payment: Payment = {
    id,
    projectId: input.projectId,
    amount: input.amount,
    date,
    method: input.method,
    reference,
    stage: input.stage,
    note,
    receiptUrl,
    recordedById: input.actor.id,
    status: "awaiting_ack",
    audit: [auditEntry("recorded", input.actor.id, at, note, input.auditId)],
  };
  return {
    ok: true,
    value: {
      payment,
      notification: {
        id: input.notificationId ?? createId("nt"),
        userId: input.homeownerId,
        projectId: input.projectId,
        type: "payment_ack",
        title: `${formatINRCompact(input.amount)} payment awaiting acknowledgement`,
        body: input.stage,
        createdAt: at,
        read: false,
        href: paymentHref(input.projectId, id),
      },
    },
  };
}

export function acknowledgePayment(input: {
  payment: Payment;
  actor: Actor;
  designerId: string;
  now?: string;
}): RuleResult<{ payment: Payment; notification: Notification }> {
  const permission = can(input.actor, "decide_payment");
  if (!permission.allowed) return fail(permission.reason);
  if (input.payment.status !== "awaiting_ack") return fail("This payment is not awaiting acknowledgement");
  const at = input.now ?? DEMO_NOW.toISOString();
  return {
    ok: true,
    value: {
      payment: {
        ...input.payment,
        status: "acknowledged",
        ackAt: at,
        disputeReason: undefined,
        audit: [...input.payment.audit, auditEntry("acknowledged", input.actor.id, at)],
      },
      notification: {
        id: createId("nt"),
        userId: input.designerId,
        projectId: input.payment.projectId,
        type: "payment_ack",
        title: "Payment acknowledged",
        body: "A payment was acknowledged",
        createdAt: at,
        read: false,
        href: paymentHref(input.payment.projectId, input.payment.id),
      },
    },
  };
}

export function disputePayment(input: {
  payment: Payment;
  actor: Actor;
  reason: string;
  designerId: string;
  now?: string;
}): RuleResult<{ payment: Payment; notification: Notification }> {
  const permission = can(input.actor, "decide_payment");
  if (!permission.allowed) return fail(permission.reason);
  if (input.payment.status !== "awaiting_ack") return fail("This payment is not awaiting acknowledgement");
  const reason = input.reason.trim();
  if (!reason) return fail("A reason is required");
  const at = input.now ?? DEMO_NOW.toISOString();
  return {
    ok: true,
    value: {
      payment: {
        ...input.payment,
        status: "disputed",
        disputeReason: reason,
        audit: [...input.payment.audit, auditEntry("disputed", input.actor.id, at, reason)],
      },
      notification: {
        id: createId("nt"),
        userId: input.designerId,
        projectId: input.payment.projectId,
        type: "payment_ack",
        title: "Payment disputed",
        body: reason,
        createdAt: at,
        read: false,
        href: paymentHref(input.payment.projectId, input.payment.id),
      },
    },
  };
}

export function resubmitPayment(input: {
  payment: Payment;
  actor: Actor;
  homeownerId: string;
  patch?: Partial<PaymentWrite>;
  now?: string;
  auditId?: string;
  notificationId?: string;
}): RuleResult<{ payment: Payment; notification: Notification }> {
  const permission = can(input.actor, "record_payment");
  if (!permission.allowed) return fail(permission.reason);
  if (input.payment.status !== "disputed") return fail("Only a disputed payment can be resubmitted");
  const method = input.patch?.method ?? input.payment.method;
  const stage = input.patch?.stage ?? input.payment.stage;
  const amount = input.patch?.amount ?? input.payment.amount;
  const date = input.patch?.date ?? input.payment.date;
  const reference =
    method === "Cash"
      ? undefined
      : input.patch && "reference" in input.patch
        ? input.patch.reference
        : input.payment.reference;
  const problem = firstDraftIssue(paymentDraftIssues({ amount, date, method, reference, stage }));
  if (problem) return fail(problem);
  const normalized = normalizePaymentDate(date);
  if (!normalized) return fail("Choose a date");
  const at = input.now ?? DEMO_NOW.toISOString();
  const note = input.patch && "note" in input.patch ? input.patch.note?.trim() || undefined : input.payment.note;
  const receiptUrl =
    input.patch && "receiptUrl" in input.patch ? input.patch.receiptUrl || undefined : input.payment.receiptUrl;
  return {
    ok: true,
    value: {
      payment: {
        ...input.payment,
        amount,
        date: normalized,
        method,
        stage,
        reference: method === "Cash" ? undefined : reference?.trim() || undefined,
        note,
        receiptUrl,
        status: "awaiting_ack",
        disputeReason: undefined,
        ackAt: undefined,
        audit: [...input.payment.audit, auditEntry("resubmitted", input.actor.id, at, undefined, input.auditId)],
      },
      notification: {
        id: input.notificationId ?? createId("nt"),
        userId: input.homeownerId,
        projectId: input.payment.projectId,
        type: "payment_ack",
        title: "Payment resubmitted",
        body: "A disputed payment was sent again for acknowledgement",
        createdAt: at,
        read: false,
        href: paymentHref(input.payment.projectId, input.payment.id),
      },
    },
  };
}

export function approveChangeRequest(input: {
  request: ChangeRequest;
  actor: Actor;
  now?: string;
  notificationId?: string;
}): RuleResult<{ request: ChangeRequest; notification: Notification }> {
  const permission = can(input.actor, "decide_change_request", {
    raisedByRole: input.request.raisedByRole,
    raisedById: input.request.raisedById,
  });
  if (!permission.allowed) return fail(permission.reason);
  if (input.request.status !== "pending") return fail("Only pending requests can be decided");
  const at = input.now ?? DEMO_NOW.toISOString();
  return {
    ok: true,
    value: {
      request: {
        ...input.request,
        status: "approved",
        decidedAt: at,
        appliedToBaseline: false,
      },
      notification: {
        id: input.notificationId ?? createId("nt"),
        userId: input.request.raisedById,
        projectId: input.request.projectId,
        type: "change_request",
        title: "Change request approved",
        body: input.request.title,
        createdAt: at,
        read: false,
        href: `/projects/${input.request.projectId}/changes?request=${input.request.id}`,
      },
    },
  };
}

export function rejectChangeRequest(input: {
  request: ChangeRequest;
  actor: Actor;
  comment?: string;
  now?: string;
  notificationId?: string;
}): RuleResult<{ request: ChangeRequest; notification: Notification }> {
  const permission = can(input.actor, "decide_change_request", {
    raisedByRole: input.request.raisedByRole,
    raisedById: input.request.raisedById,
  });
  if (!permission.allowed) return fail(permission.reason);
  if (input.request.status !== "pending") return fail("Only pending requests can be decided");
  const at = input.now ?? DEMO_NOW.toISOString();
  return {
    ok: true,
    value: {
      request: {
        ...input.request,
        status: "rejected",
        decidedAt: at,
        decisionComment: input.comment?.trim() || undefined,
      },
      notification: {
        id: input.notificationId ?? createId("nt"),
        userId: input.request.raisedById,
        projectId: input.request.projectId,
        type: "change_request",
        title: "Change request rejected",
        body: input.request.title,
        createdAt: at,
        read: false,
        href: `/projects/${input.request.projectId}/changes?request=${input.request.id}`,
      },
    },
  };
}

export function withdrawChangeRequest(input: {
  request: ChangeRequest;
  actor: Actor;
  now?: string;
}): RuleResult<{ request: ChangeRequest }> {
  if (input.request.raisedById !== input.actor.id) return fail("Only the person who raised this can withdraw it");
  if (input.request.status !== "pending") return fail("Only pending requests can be withdrawn");
  const at = input.now ?? DEMO_NOW.toISOString();
  return {
    ok: true,
    value: {
      request: { ...input.request, status: "withdrawn", decidedAt: at },
    },
  };
}

export interface AllocationStatus {
  allocated: number;
  remaining: number;
  budgetSet: boolean;
  matches: boolean;
}

export function allocationStatus(allocations: number[], budget: number): AllocationStatus {
  const allocated = allocations.reduce((total, value) => total + value, 0);
  const budgetSet = budget > 0;
  return {
    allocated,
    remaining: budget - allocated,
    budgetSet,
    matches: budgetSet && allocated === budget,
  };
}

export interface ProjectRoomDraft {
  name: string;
  type: Room["type"];
  areaSqft: number;
  budgetAllocation: number;
}

export interface ProjectCreateInput {
  name: string;
  propertyType: Project["propertyType"];
  bhk: string;
  areaSqft: number;
  city: string;
  locality: string;
  coverImage: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  inviteNow: boolean;
  rooms: ProjectRoomDraft[];
  budget: number;
  startDate: string;
  originalEndDate: string;
}

export interface CreatedProject {
  project: Project;
  rooms: Room[];
  teamMembers: TeamMember[];
  user?: User;
  notification?: Notification;
}

export function buildProject(input: {
  actor: Actor;
  designer: User;
  existingUsers: User[];
  draft: ProjectCreateInput;
  now?: string;
}): RuleResult<CreatedProject> {
  const permission = can(input.actor, "create_project");
  if (!permission.allowed) return fail(permission.reason);
  if (input.actor.id !== input.designer.id) return fail("Only a designer can create a project");

  const draft = input.draft;
  const name = draft.name.trim();
  if (name.length < 2) return fail("Enter a project name");
  if (draft.budget <= 0) return fail("Enter the estimated budget");
  const start = parseISO(draft.startDate);
  const end = parseISO(draft.originalEndDate);
  if (!isValid(start) || !isValid(end) || !isAfter(end, start)) {
    return fail("The end date has to be after the start");
  }
  for (const room of draft.rooms) {
    if (!room.name.trim() || room.areaSqft <= 0 || room.budgetAllocation < 0) {
      return fail("Complete each room before creating the project");
    }
  }

  const phone = normalizePhone(draft.clientPhone);
  if (!phoneSchema.safeParse(phone).success) return fail("Enter a valid mobile number");
  const existing = input.existingUsers.find((user) => user.phone === phone);
  if (existing?.role === "designer") return fail("That number belongs to a designer");

  const at = input.now ?? DEMO_NOW.toISOString();
  const homeowner: User = existing ?? {
    id: uniqueId("usr"),
    name: draft.clientName.trim(),
    phone,
    email: draft.clientEmail.trim(),
    role: "homeowner",
    access: "full",
    accountKind: "owner",
  };

  const project: Project = {
    id: uniqueId("prj"),
    name,
    propertyType: draft.propertyType,
    bhk: draft.bhk,
    areaSqft: draft.areaSqft,
    location: { area: draft.locality.trim(), city: draft.city.trim() },
    homeownerId: homeowner.id,
    designerId: input.designer.id,
    studioName: input.designer.studioName ?? "Studio",
    startDate: draft.startDate,
    originalEndDate: draft.originalEndDate,
    baseBudget: draft.budget,
    coverImage: draft.coverImage,
    status: "active",
    seedDelayDays: 0,
  };

  const rooms: Room[] = draft.rooms.map((room) => ({
    id: uniqueId("rm"),
    projectId: project.id,
    name: room.name.trim(),
    type: room.type,
    areaSqft: room.areaSqft,
    progress: 0,
    status: "not_started",
    activeTask: "Not started",
    budgetAllocation: room.budgetAllocation,
    beforePhotos: [],
    inspiration: [],
    specs: [],
  }));

  const teamMembers: TeamMember[] = [
    {
      id: uniqueId("tm"),
      projectId: project.id,
      name: input.designer.name,
      contact: input.designer.phone,
      role: "designer",
      access: "full",
      status: "active",
    },
    {
      id: uniqueId("tm"),
      projectId: project.id,
      name: homeowner.name,
      contact: homeowner.phone,
      role: "owner",
      access: "full",
      status: draft.inviteNow ? "invited" : "active",
    },
  ];

  const notification: Notification | undefined = draft.inviteNow
    ? {
        id: uniqueId("nt"),
        userId: homeowner.id,
        projectId: project.id,
        type: "invite",
        title: `Invitation to ${project.name}`,
        body: `${input.designer.name} invited you to follow this project.`,
        createdAt: at,
        read: false,
        href: `/projects/${project.id}`,
      }
    : undefined;

  return {
    ok: true,
    value: {
      project,
      rooms,
      teamMembers,
      user: existing ? undefined : homeowner,
      notification,
    },
  };
}

export function impactPreview(project: Project, changeRequests: ChangeRequest[], request: ChangeRequest): {
  costBefore: number;
  costAfter: number;
  endBefore: string;
  endAfter: string;
} {
  const before = estimatedCost(project, changeRequests);
  const endBefore = projectedEndDate(project, changeRequests);
  const endAfter = addDays(endBefore, request.daysImpact);
  return {
    costBefore: before,
    costAfter: before + request.costImpact,
    endBefore: format(endBefore, "yyyy-MM-dd"),
    endAfter: format(endAfter, "yyyy-MM-dd"),
  };
}

export interface ChangeRequestDraft {
  title: string;
  description: string;
  roomId?: string;
  costImpact: number;
  daysImpact: number;
}

export function raiseChangeRequest(input: {
  actor: Actor;
  project: Project;
  draft: ChangeRequestDraft;
  now?: string;
  requestId?: string;
  notificationId?: string;
}): RuleResult<{ request: ChangeRequest; notification: Notification }> {
  const permission = can(input.actor, "raise_change_request");
  if (!permission.allowed) return fail(permission.reason);
  const title = input.draft.title.trim();
  const description = input.draft.description.trim();
  if (!title) return fail("Enter a title");
  if (!description) return fail("Enter a description");
  if (!Number.isFinite(input.draft.costImpact) || !Number.isFinite(input.draft.daysImpact)) {
    return fail("Enter a cost and timeline impact");
  }
  if (!Number.isInteger(input.draft.daysImpact)) return fail("Timeline impact has to be a whole number of days");
  if (input.draft.costImpact === 0 && input.draft.daysImpact === 0) return fail("Add a cost or timeline impact");
  const at = input.now ?? DEMO_NOW.toISOString();
  const id = input.requestId ?? createId("cr");
  const counterpartyId = input.actor.role === "designer" ? input.project.homeownerId : input.project.designerId;
  return {
    ok: true,
    value: {
      request: {
        id,
        projectId: input.project.id,
        roomId: input.draft.roomId || undefined,
        title,
        description,
        raisedById: input.actor.id,
        raisedByRole: input.actor.role,
        costImpact: input.draft.costImpact,
        daysImpact: input.draft.daysImpact,
        status: "pending",
        createdAt: at,
      },
      notification: {
        id: input.notificationId ?? createId("nt"),
        userId: counterpartyId,
        projectId: input.project.id,
        type: "change_request",
        title: `Change request: ${title}`,
        body: input.draft.description.trim(),
        createdAt: at,
        read: false,
        href: `/projects/${input.project.id}/changes?request=${id}`,
      },
    },
  };
}

export function addRoom(input: {
  actor: Actor;
  projectId: string;
  draft: ProjectRoomDraft;
  roomId?: string;
}): RuleResult<{ room: Room }> {
  const permission = can(input.actor, "edit_room");
  if (!permission.allowed) return fail(permission.reason);
  const name = input.draft.name.trim();
  if (name.length < 2) return fail("Enter a room name");
  if (!isRoomType(input.draft.type)) return fail("Choose a room type");
  if (!Number.isFinite(input.draft.areaSqft) || input.draft.areaSqft <= 0) return fail("Enter the area");
  if (!Number.isFinite(input.draft.budgetAllocation) || input.draft.budgetAllocation < 0) {
    return fail("Enter a budget allocation");
  }
  return {
    ok: true,
    value: {
      room: {
        id: input.roomId ?? createId("rm"),
        projectId: input.projectId,
        name,
        type: input.draft.type,
        areaSqft: input.draft.areaSqft,
        progress: 0,
        status: "not_started",
        activeTask: "Not started",
        budgetAllocation: input.draft.budgetAllocation,
        beforePhotos: [],
        inspiration: [],
        specs: [],
      },
    },
  };
}

const ROOM_TYPE_VALUES = ["living", "kitchen", "bedroom", "bathroom", "balcony", "dining", "study"] as const;

export function isRoomType(value: string): value is Room["type"] {
  return (ROOM_TYPE_VALUES as readonly string[]).includes(value);
}

export function updateActiveTask(input: { actor: Actor; room: Room; activeTask: string }): RuleResult<{ room: Room }> {
  const permission = can(input.actor, "edit_room");
  if (!permission.allowed) return fail(permission.reason);
  const activeTask = input.activeTask.trim();
  if (!activeTask) return fail("Enter the active task");
  return { ok: true, value: { room: { ...input.room, activeTask } } };
}

export interface SpecDraft {
  category: MaterialSpec["category"];
  item: string;
  brand?: string;
  finish?: string;
  quantity: number;
  unit: string;
  estCost: number;
}

const SPEC_CATEGORIES = ["Flooring", "Walls", "Ceiling", "Furniture", "Lighting", "Fixtures", "Hardware"] as const;

export function isSpecCategory(value: string): value is MaterialSpec["category"] {
  return (SPEC_CATEGORIES as readonly string[]).includes(value);
}

export const SPEC_STATUSES = ["proposed", "approved", "ordered", "installed"] as const;

function specFromDraft(draft: SpecDraft, id: string, status: MaterialSpec["status"]): RuleResult<MaterialSpec> {
  const item = draft.item.trim();
  const unit = draft.unit.trim();
  if (!isSpecCategory(draft.category)) return fail("Choose a category");
  if (!item) return fail("Enter the item");
  if (!unit) return fail("Enter a unit");
  if (!Number.isFinite(draft.quantity) || draft.quantity <= 0) return fail("Enter a quantity");
  if (!Number.isFinite(draft.estCost) || draft.estCost < 0) return fail("Enter an estimated cost");
  return {
    ok: true,
    value: {
      id,
      category: draft.category,
      item,
      brand: draft.brand?.trim() || undefined,
      finish: draft.finish?.trim() || undefined,
      quantity: draft.quantity,
      unit,
      estCost: draft.estCost,
      status,
    },
  };
}

export function addSpec(input: { actor: Actor; room: Room; draft: SpecDraft; specId?: string }): RuleResult<{ room: Room }> {
  const permission = can(input.actor, "edit_room");
  if (!permission.allowed) return fail(permission.reason);
  const spec = specFromDraft(input.draft, input.specId ?? createId("spec"), "proposed");
  if (!spec.ok) return spec;
  return { ok: true, value: { room: { ...input.room, specs: [...input.room.specs, spec.value] } } };
}

export function updateSpec(input: { actor: Actor; room: Room; specId: string; draft: SpecDraft }): RuleResult<{ room: Room }> {
  const permission = can(input.actor, "edit_room");
  if (!permission.allowed) return fail(permission.reason);
  const current = input.room.specs.find((item) => item.id === input.specId);
  if (!current) return fail("Spec not found");
  const spec = specFromDraft(input.draft, current.id, current.status);
  if (!spec.ok) return spec;
  return {
    ok: true,
    value: { room: { ...input.room, specs: input.room.specs.map((item) => (item.id === current.id ? spec.value : item)) } },
  };
}

export function deleteSpec(input: { actor: Actor; room: Room; specId: string }): RuleResult<{ room: Room }> {
  const permission = can(input.actor, "edit_room");
  if (!permission.allowed) return fail(permission.reason);
  if (!input.room.specs.some((item) => item.id === input.specId)) return fail("Spec not found");
  return { ok: true, value: { room: { ...input.room, specs: input.room.specs.filter((item) => item.id !== input.specId) } } };
}

export function setSpecStatus(input: {
  actor: Actor;
  room: Room;
  specId: string;
  status: MaterialSpec["status"];
}): RuleResult<{ room: Room }> {
  const current = input.room.specs.find((item) => item.id === input.specId);
  if (!current) return fail("Spec not found");
  if (!(SPEC_STATUSES as readonly string[]).includes(input.status)) return fail("Choose a status");
  if (current.status === input.status) {
    return { ok: true, value: { room: input.room } };
  }
  const designer = can(input.actor, "edit_room");
  const approver = can(input.actor, "decide_update");
  const homeownerApproval = approver.allowed && current.status === "proposed" && input.status === "approved";
  if (!designer.allowed && !homeownerApproval) {
    if (!approver.allowed) return fail(approver.reason);
    return fail("You can approve a proposed spec");
  }
  return {
    ok: true,
    value: {
      room: {
        ...input.room,
        specs: input.room.specs.map((item) => (item.id === current.id ? { ...item, status: input.status } : item)),
      },
    },
  };
}

export function addBeforePhoto(input: { actor: Actor; room: Room; url: string }): RuleResult<{ room: Room }> {
  const permission = can(input.actor, "edit_room");
  if (!permission.allowed) return fail(permission.reason);
  if (!input.url) return fail("Add a photo");
  return { ok: true, value: { room: { ...input.room, beforePhotos: [...input.room.beforePhotos, input.url] } } };
}

export function addInspiration(input: {
  actor: Actor;
  room: Room;
  imageUrl: string;
  note: string;
  tag: string;
  itemId?: string;
}): RuleResult<{ room: Room }> {
  const permission = can(input.actor, "edit_room");
  if (!permission.allowed) return fail(permission.reason);
  const tag = input.tag.trim();
  if (!input.imageUrl) return fail("Add an image");
  if (!tag) return fail("Add a tag");
  const item: InspirationItem = {
    id: input.itemId ?? createId("ins"),
    imageUrl: input.imageUrl,
    note: input.note.trim(),
    tag,
    comments: [],
  };
  return { ok: true, value: { room: { ...input.room, inspiration: [...input.room.inspiration, item] } } };
}

export function removeInspiration(input: { actor: Actor; room: Room; itemId: string }): RuleResult<{ room: Room }> {
  const permission = can(input.actor, "edit_room");
  if (!permission.allowed) return fail(permission.reason);
  if (!input.room.inspiration.some((item) => item.id === input.itemId)) return fail("Inspiration item not found");
  return {
    ok: true,
    value: { room: { ...input.room, inspiration: input.room.inspiration.filter((item) => item.id !== input.itemId) } },
  };
}

export function commentOnInspiration(input: {
  room: Room;
  actor: Actor;
  itemId: string;
  text: string;
  now?: string;
  commentId?: string;
}): RuleResult<{ room: Room }> {
  const text = input.text.trim();
  if (!text) return fail("Write a comment");
  const item = input.room.inspiration.find((entry) => entry.id === input.itemId);
  if (!item) return fail("Inspiration item not found");
  const comment: Comment = {
    id: input.commentId ?? createId("cmt"),
    authorId: input.actor.id,
    text,
    createdAt: input.now ?? DEMO_NOW.toISOString(),
  };
  return {
    ok: true,
    value: {
      room: {
        ...input.room,
        inspiration: input.room.inspiration.map((entry) =>
          entry.id === item.id ? { ...entry, comments: [...entry.comments, comment] } : entry,
        ),
      },
    },
  };
}

export function normalizeContact(value: string): string {
  const trimmed = value.trim();
  if (trimmed.includes("@")) return trimmed.toLowerCase();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length >= 10) return normalizePhone(trimmed);
  return trimmed.toLowerCase();
}

function contactAccepted(value: string): boolean {
  const normalized = normalizeContact(value);
  if (normalized.includes("@")) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
  return phoneSchema.safeParse(normalized).success;
}

export interface InviteDraft {
  name: string;
  contact: string;
  role: "family" | "site_supervisor";
  access: "view" | "approve";
}

export function familyLogin(member: TeamMember, users: User[]): User | undefined {
  if (member.role !== "family") return undefined;
  const contact = normalizeContact(member.contact);
  return users.find((user) => user.accountKind === "family" && normalizeContact(user.phone) === contact);
}

export function inviteMember(input: {
  actor: Actor;
  project: Project;
  members: TeamMember[];
  draft: InviteDraft;
  now?: string;
  memberId?: string;
  notificationId?: string;
}): RuleResult<{ member: TeamMember; notification: Notification }> {
  const permission = can(input.actor, "invite_member");
  if (!permission.allowed) return fail(permission.reason);
  const name = input.draft.name.trim();
  if (name.length < 2) return fail("Enter a name");
  if (!contactAccepted(input.draft.contact)) return fail("Enter a phone number or email");
  if (input.draft.role !== "family" && input.draft.role !== "site_supervisor") return fail("Choose a role");
  if (input.draft.access !== "view" && input.draft.access !== "approve") return fail("Choose an access level");
  const contact = normalizeContact(input.draft.contact);
  const duplicate = input.members.some(
    (member) => member.projectId === input.project.id && normalizeContact(member.contact) === contact,
  );
  if (duplicate) return fail("That contact is already on the project");
  const at = input.now ?? DEMO_NOW.toISOString();
  const counterpartyId = input.actor.role === "designer" ? input.project.homeownerId : input.project.designerId;
  const member: TeamMember = {
    id: input.memberId ?? createId("tm"),
    projectId: input.project.id,
    name,
    contact,
    role: input.draft.role,
    access: input.draft.access,
    status: "invited",
  };
  return {
    ok: true,
    value: {
      member,
      notification: {
        id: input.notificationId ?? createId("nt"),
        userId: counterpartyId,
        projectId: input.project.id,
        type: "invite",
        title: `${name} was invited`,
        body: input.draft.access === "approve" ? "Can approve" : "View only",
        createdAt: at,
        read: false,
        href: `/projects/${input.project.id}/team`,
      },
    },
  };
}

export function changeMemberAccess(input: {
  actor: Actor;
  member: TeamMember;
  users: User[];
  access: "view" | "approve";
}): RuleResult<{ member: TeamMember; user?: User }> {
  const permission = can(input.actor, "invite_member");
  if (!permission.allowed) return fail(permission.reason);
  if (input.member.role === "owner") return fail("Owner access can't be changed");
  if (input.member.role === "designer") return fail("Designer access can't be changed");
  if (input.access !== "view" && input.access !== "approve") return fail("Choose view or approve access");
  const login = familyLogin(input.member, input.users);
  return {
    ok: true,
    value: {
      member: { ...input.member, access: input.access },
      user: login ? { ...login, access: input.access } : undefined,
    },
  };
}

export function removeMember(input: { actor: Actor; member: TeamMember }): RuleResult<{ memberId: string }> {
  const permission = can(input.actor, "invite_member");
  if (!permission.allowed) return fail(permission.reason);
  if (input.member.role === "owner") return fail("The owner can't be removed");
  if (input.member.role === "designer") return fail("The designer can't be removed");
  return { ok: true, value: { memberId: input.member.id } };
}

export function resendInvite(input: { actor: Actor; member: TeamMember }): RuleResult<{ member: TeamMember }> {
  const permission = can(input.actor, "invite_member");
  if (!permission.allowed) return fail(permission.reason);
  if (input.member.status !== "invited") return fail("They're already on the project");
  return { ok: true, value: { member: input.member } };
}

export function acceptInvite(input: { member: TeamMember; now?: string }): RuleResult<{ member: TeamMember }> {
  if (input.member.status !== "invited") return fail("This invite is already active");
  return {
    ok: true,
    value: { member: { ...input.member, status: "active", lastActiveAt: input.now ?? DEMO_NOW.toISOString() } },
  };
}

export interface ProjectSettingsPatch {
  name: string;
  area: string;
  city: string;
  coverImage: string;
  originalEndDate: string;
  baseBudget: number;
  status: Project["status"];
}

export function updateProjectSettings(input: {
  actor: Actor;
  project: Project;
  patch: ProjectSettingsPatch;
}): RuleResult<{ project: Project }> {
  const permission = can(input.actor, "edit_project");
  if (!permission.allowed) return fail(permission.reason);
  const name = input.patch.name.trim();
  const area = input.patch.area.trim();
  const city = input.patch.city.trim();
  if (name.length < 2) return fail("Enter a project name");
  if (!area || !city) return fail("Enter the location");
  if (!input.patch.coverImage) return fail("Choose a cover image");
  if (!Number.isFinite(input.patch.baseBudget) || input.patch.baseBudget <= 0) return fail("Enter the base budget");
  if (input.patch.status !== "active" && input.patch.status !== "on_hold" && input.patch.status !== "completed") {
    return fail("Choose a project status");
  }
  const end = parseISO(input.patch.originalEndDate);
  const start = parseISO(input.project.startDate);
  if (!isValid(end) || !isAfter(end, start)) return fail("The end date has to be after the start");
  return {
    ok: true,
    value: {
      project: {
        ...input.project,
        name,
        location: { area, city },
        coverImage: input.patch.coverImage,
        originalEndDate: input.patch.originalEndDate,
        baseBudget: input.patch.baseBudget,
        status: input.patch.status,
      },
    },
  };
}

export function updateProfile(input: {
  user: User;
  members: TeamMember[];
  name: string;
  email: string;
  avatarUrl?: string;
}): RuleResult<{ user: User; members: TeamMember[] }> {
  const name = input.name.trim();
  const email = input.email.trim();
  if (name.length < 2) return fail("Enter your name");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Enter a valid email");
  const phone = normalizeContact(input.user.phone);
  return {
    ok: true,
    value: {
      user: { ...input.user, name, email: email || undefined, avatarUrl: input.avatarUrl || undefined },
      members: input.members.map((member) =>
        normalizeContact(member.contact) === phone ? { ...member, name } : member,
      ),
    },
  };
}

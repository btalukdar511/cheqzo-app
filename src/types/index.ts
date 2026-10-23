export type Role = "homeowner" | "designer";
export type Health = "on_track" | "needs_attention" | "at_risk";
export type MemberAccess = "view" | "approve" | "full";
export type AccountKind = "owner" | "designer" | "family";

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: Role;
  avatarUrl?: string;
  studioName?: string;
  /** Owners and the designer are `full`. Family uses `view` or `approve`. */
  access: MemberAccess;
  /** Distinguishes a family login from the homeowner. `role` stays the Section 5 union. */
  accountKind: AccountKind;
}

export interface Project {
  id: string;
  name: string;
  propertyType: "Apartment" | "Villa" | "Independent House" | "Penthouse";
  bhk: string;
  areaSqft: number;
  location: { area: string; city: string };
  homeownerId: string;
  designerId: string;
  studioName: string;
  startDate: string;
  originalEndDate: string;
  baseBudget: number;
  coverImage: string;
  status: "active" | "completed" | "on_hold";
  /** Days of drift already baked into the story, separate from change requests. */
  seedDelayDays: number;
}

export interface Room {
  id: string;
  projectId: string;
  name: string;
  type: "living" | "kitchen" | "bedroom" | "bathroom" | "balcony" | "dining" | "study";
  areaSqft: number;
  progress: number;
  status: "not_started" | "in_progress" | "awaiting_approval" | "completed";
  activeTask: string;
  budgetAllocation: number;
  beforePhotos: string[];
  inspiration: InspirationItem[];
  specs: MaterialSpec[];
}

export interface InspirationItem {
  id: string;
  imageUrl: string;
  note: string;
  tag: string;
  comments: Comment[];
}

export interface MaterialSpec {
  id: string;
  category: "Flooring" | "Walls" | "Ceiling" | "Furniture" | "Lighting" | "Fixtures" | "Hardware";
  item: string;
  brand?: string;
  finish?: string;
  quantity: number;
  unit: string;
  estCost: number;
  status: "proposed" | "approved" | "ordered" | "installed";
}

export interface Comment {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
}

export interface SiteUpdate {
  id: string;
  projectId: string;
  roomId: string;
  authorId: string;
  title: string;
  description: string;
  photos: { url: string; caption: string; kind: "before" | "progress" | "after" }[];
  previousProgress: number;
  proposedProgress: number;
  status: "pending" | "approved" | "changes_requested" | "rejected";
  createdAt: string;
  decision?: { byId: string; at: string; comment?: string };
  thread: Comment[];
}

export type PaymentAuditAction = "recorded" | "acknowledged" | "disputed" | "resubmitted";

export interface PaymentAuditEntry {
  id: string;
  at: string;
  actorId: string;
  action: PaymentAuditAction;
  note?: string;
}

export interface Payment {
  id: string;
  projectId: string;
  amount: number;
  date: string;
  method: "UPI" | "Bank Transfer" | "Cash" | "Cheque";
  reference?: string;
  stage: "Advance" | "Design" | "Material" | "Carpentry" | "Electrical & Plumbing" | "Finishing" | "Handover";
  note?: string;
  /** Session-only when it is a blob URL. The store drops those on persist. */
  receiptUrl?: string;
  recordedById: string;
  status: "awaiting_ack" | "acknowledged" | "disputed";
  ackAt?: string;
  disputeReason?: string;
  audit: PaymentAuditEntry[];
}

export interface ChangeRequest {
  id: string;
  projectId: string;
  roomId?: string;
  title: string;
  description: string;
  raisedById: string;
  raisedByRole: Role;
  costImpact: number;
  daysImpact: number;
  status: "pending" | "approved" | "rejected" | "withdrawn";
  createdAt: string;
  decidedAt?: string;
  decisionComment?: string;
  /**
   * Seeded approvals are already inside `baseBudget` and the original timeline.
   * Only approvals made after seed add cost and days.
   */
  appliedToBaseline?: boolean;
}

export interface TeamMember {
  id: string;
  projectId: string;
  name: string;
  contact: string;
  role: "owner" | "family" | "designer" | "site_supervisor";
  access: MemberAccess;
  status: "active" | "invited";
  /** Omitted while the member is still invited. */
  lastActiveAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  projectId: string;
  type: "update_pending" | "payment_ack" | "change_request" | "update_decided" | "invite";
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href: string;
}

export interface Database {
  users: User[];
  projects: Project[];
  rooms: Room[];
  updates: SiteUpdate[];
  payments: Payment[];
  changeRequests: ChangeRequest[];
  teamMembers: TeamMember[];
  notifications: Notification[];
}

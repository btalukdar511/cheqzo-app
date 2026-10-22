import type {
  ChangeRequest,
  Comment,
  Database,
  InspirationItem,
  MaterialSpec,
  Notification,
  Payment,
  PaymentAuditEntry,
  Room,
  SiteUpdate,
  TeamMember,
  User,
} from "@/types";

export const IDS = {
  ananya: "usr_ananya",
  rohan: "usr_rohan",
  karthik: "usr_karthik",
  meera: "usr_meera",
  suresh: "usr_suresh",
  koramangala: "prj_koramangala",
  whitefield: "prj_whitefield",
  indiranagar: "prj_indiranagar",
  living: "rm_kora_living",
  kitchen: "rm_kora_kitchen",
  master: "rm_kora_master",
  kids: "rm_kora_kids",
  bathroom: "rm_kora_bathroom",
  balcony: "rm_kora_balcony",
  cove: "cr_kora_cove",
  wardrobe: "cr_kora_wardrobe",
  veneer: "cr_kora_veneer",
  deck: "cr_kora_deck",
  payAwaiting: "pay_kora_carpentry_oct",
} as const;

function picsum(key: string): string {
  return `https://picsum.photos/seed/${key}/1200/800`;
}

function spec(
  id: string,
  category: MaterialSpec["category"],
  item: string,
  quantity: number,
  unit: string,
  estCost: number,
  extra: Partial<MaterialSpec> = {},
): MaterialSpec {
  return { id, category, item, quantity, unit, estCost, status: "proposed", ...extra };
}

function inspiration(id: string, tag: string, note: string): InspirationItem {
  return { id, imageUrl: picsum(id), note, tag };
}

function shot(id: string, caption: string, kind: SiteUpdate["photos"][number]["kind"]) {
  return { url: picsum(id), caption, kind };
}

function recorded(id: string, at: string, actorId: string, note?: string): PaymentAuditEntry {
  return { id, at, actorId, action: "recorded", note };
}

function acknowledged(id: string, at: string, actorId: string): PaymentAuditEntry {
  return { id, at, actorId, action: "acknowledged" };
}

const users: User[] = [
  {
    id: IDS.ananya,
    name: "Ananya Rao",
    phone: "9845011101",
    email: "ananya@example.com",
    role: "homeowner",
    access: "full",
    accountKind: "owner",
    avatarUrl: picsum("avatar-ananya"),
  },
  {
    id: IDS.rohan,
    name: "Rohan Mehta",
    phone: "9845022202",
    email: "rohan@studiolumen.example",
    role: "designer",
    access: "full",
    accountKind: "designer",
    studioName: "Studio Lumen",
    avatarUrl: picsum("avatar-rohan"),
  },
  {
    id: IDS.karthik,
    name: "Karthik Iyer",
    phone: "9845033303",
    email: "karthik@example.com",
    role: "homeowner",
    access: "full",
    accountKind: "owner",
    avatarUrl: picsum("avatar-karthik"),
  },
  {
    id: IDS.meera,
    name: "Meera Rao",
    phone: "9845044404",
    email: "meera@example.com",
    role: "homeowner",
    access: "view",
    accountKind: "family",
    avatarUrl: picsum("avatar-meera"),
  },
];

const koramangalaRooms: Room[] = [
  {
    id: IDS.living,
    projectId: IDS.koramangala,
    name: "Living Room",
    type: "living",
    areaSqft: 380,
    progress: 30,
    status: "awaiting_approval",
    activeTask: "False ceiling framing",
    budgetAllocation: 420000,
    beforePhotos: [picsum("kora-living-before-1"), picsum("kora-living-before-2"), picsum("kora-living-before-3")],
    inspiration: [
      inspiration("kora-living-ins-1", "Ceiling", "Cove lighting along the window wall"),
      inspiration("kora-living-ins-2", "Seating", "Low linen sofa, warm oak floor"),
      inspiration("kora-living-ins-3", "Palette", "Limewash walls with brass accents"),
    ],
    specs: [
      spec("kora-living-floor", "Flooring", "Engineered oak planks", 42, "sqm", 185000, { brand: "Havwoods", finish: "Natural", status: "ordered" }),
      spec("kora-living-walls", "Walls", "Limewash", 1, "lot", 28000, { brand: "Asian Paints", finish: "Warm white", status: "approved" }),
      spec("kora-living-ceiling", "Ceiling", "Gypsum false ceiling", 42, "sqm", 96000, { status: "proposed" }),
      spec("kora-living-light", "Lighting", "Profile LED", 18, "m", 22000, { status: "proposed" }),
      spec("kora-living-sofa", "Furniture", "Three-seat sofa", 1, "nos", 85000, { finish: "Linen", status: "proposed" }),
    ],
  },
  {
    id: IDS.kitchen,
    projectId: IDS.koramangala,
    name: "Kitchen",
    type: "kitchen",
    areaSqft: 140,
    progress: 50,
    status: "awaiting_approval",
    activeTask: "Modular cabinet installation",
    budgetAllocation: 480000,
    beforePhotos: [picsum("kora-kitchen-before-1"), picsum("kora-kitchen-before-2")],
    inspiration: [
      inspiration("kora-kitchen-ins-1", "Counters", "Quartz in Calacatta with a waterfall edge"),
      inspiration("kora-kitchen-ins-2", "Hardware", "Handleless shutters with soft-close"),
      inspiration("kora-kitchen-ins-3", "Backsplash", "Full-height tile behind the hob"),
    ],
    specs: [
      spec("kora-kitchen-hardware", "Hardware", "Soft-close hinges and runners", 24, "sets", 48000, { brand: "Hettich", status: "ordered" }),
      spec("kora-kitchen-tile", "Flooring", "600×600 vitrified tiles", 12, "sqm", 36000, { brand: "Kajaria", finish: "Matte ivory", status: "installed" }),
      spec("kora-kitchen-quartz", "Fixtures", "Quartz countertop", 6, "m", 92000, { finish: "Calacatta", status: "ordered" }),
      spec("kora-kitchen-cabinets", "Furniture", "Modular base and wall cabinets", 1, "lot", 210000, { status: "ordered" }),
      spec("kora-kitchen-light", "Lighting", "Under-cabinet LED", 8, "m", 14000, { status: "proposed" }),
      spec("kora-kitchen-splash", "Walls", "Tile backsplash", 6, "sqm", 18000, { status: "approved" }),
    ],
  },
  {
    id: IDS.master,
    projectId: IDS.koramangala,
    name: "Master Bedroom",
    type: "bedroom",
    areaSqft: 200,
    progress: 80,
    status: "in_progress",
    activeTask: "Wardrobe paneling and finishing",
    budgetAllocation: 360000,
    beforePhotos: [picsum("kora-master-before-1"), picsum("kora-master-before-2"), picsum("kora-master-before-3")],
    inspiration: [
      inspiration("kora-master-ins-1", "Wardrobe", "Full-height fluted shutters"),
      inspiration("kora-master-ins-2", "Headboard", "Upholstered panel in oatmeal"),
      inspiration("kora-master-ins-3", "Lighting", "Pair of linen pendants"),
    ],
    specs: [
      spec("kora-master-wardrobe", "Furniture", "Wardrobe shutters", 1, "lot", 140000, { finish: "Fluted laminate", status: "installed" }),
      spec("kora-master-floor", "Flooring", "Engineered wood", 18, "sqm", 64000, { finish: "Smoked oak", status: "installed" }),
      spec("kora-master-wall", "Walls", "Wallpaper panel", 1, "lot", 32000, { status: "approved" }),
      spec("kora-master-light", "Lighting", "Pendant", 2, "nos", 16000, { status: "proposed" }),
      spec("kora-master-cove", "Ceiling", "Bedside cove", 16, "m", 24000, { status: "approved" }),
    ],
  },
  {
    id: IDS.kids,
    projectId: IDS.koramangala,
    name: "Kids Bedroom",
    type: "bedroom",
    areaSqft: 140,
    progress: 20,
    status: "in_progress",
    activeTask: "Electrical conduiting",
    budgetAllocation: 220000,
    beforePhotos: [picsum("kora-kids-before-1"), picsum("kora-kids-before-2")],
    inspiration: [
      inspiration("kora-kids-ins-1", "Study", "Desk under the window with a task lamp"),
      inspiration("kora-kids-ins-2", "Storage", "Low open shelves"),
      inspiration("kora-kids-ins-3", "Floor", "Warm laminate, easy to clean"),
    ],
    specs: [
      spec("kora-kids-floor", "Flooring", "Laminate", 14, "sqm", 38000, { finish: "Oak", status: "proposed" }),
      spec("kora-kids-paint", "Walls", "Washable emulsion", 1, "lot", 12000, { brand: "Asian Paints", status: "approved" }),
      spec("kora-kids-desk", "Furniture", "Study desk", 1, "nos", 28000, { status: "proposed" }),
      spec("kora-kids-hardware", "Hardware", "Drawer handles", 8, "sets", 4000, { status: "proposed" }),
      spec("kora-kids-light", "Lighting", "Task lamp point", 1, "nos", 3500, { status: "proposed" }),
    ],
  },
  {
    id: IDS.bathroom,
    projectId: IDS.koramangala,
    name: "Bathroom",
    type: "bathroom",
    areaSqft: 55,
    progress: 60,
    status: "in_progress",
    activeTask: "Wall tiling",
    budgetAllocation: 210000,
    beforePhotos: [picsum("kora-bath-before-1"), picsum("kora-bath-before-2"), picsum("kora-bath-before-3")],
    inspiration: [
      inspiration("kora-bath-ins-1", "Tile", "Large-format matte tile, floor to ceiling"),
      inspiration("kora-bath-ins-2", "Vanity", "Wall-hung vanity in oak"),
      inspiration("kora-bath-ins-3", "Brass", "Brushed brass tapware"),
    ],
    specs: [
      spec("kora-bath-tile", "Walls", "Wall tile", 18, "sqm", 42000, { brand: "Kajaria", status: "installed" }),
      spec("kora-bath-wc", "Fixtures", "Wall-hung WC", 1, "nos", 22000, { brand: "Kohler", status: "ordered" }),
      spec("kora-bath-vanity", "Furniture", "Vanity", 1, "nos", 35000, { finish: "Oak", status: "proposed" }),
      spec("kora-bath-cp", "Fixtures", "CP fittings", 1, "lot", 28000, { brand: "Jaquar", finish: "Brushed brass", status: "ordered" }),
      spec("kora-bath-proof", "Walls", "Waterproofing", 1, "lot", 18000, { status: "installed" }),
    ],
  },
  {
    id: IDS.balcony,
    projectId: IDS.koramangala,
    name: "Balcony",
    type: "balcony",
    areaSqft: 90,
    progress: 0,
    status: "not_started",
    activeTask: "Awaiting material delivery",
    budgetAllocation: 100000,
    beforePhotos: [picsum("kora-balcony-before-1"), picsum("kora-balcony-before-2")],
    inspiration: [
      inspiration("kora-balcony-ins-1", "Floor", "Large tiles instead of a timber deck"),
      inspiration("kora-balcony-ins-2", "Green", "Built-in planter along the parapet"),
      inspiration("kora-balcony-ins-3", "Light", "Two wall lights"),
    ],
    specs: [
      spec("kora-balcony-tile", "Flooring", "Outdoor vitrified tile", 8, "sqm", 16000, { status: "proposed" }),
      spec("kora-balcony-light", "Lighting", "Wall light", 2, "nos", 6000, { status: "proposed" }),
      spec("kora-balcony-planter", "Fixtures", "Planter", 4, "nos", 8000, { status: "proposed" }),
      spec("kora-balcony-paint", "Walls", "Exterior paint", 1, "lot", 9000, { status: "proposed" }),
    ],
  },
];

const kidsComment: Comment = {
  id: "cmt_kora_kids",
  authorId: IDS.ananya,
  text: "Please add a socket near the study desk",
  createdAt: "2026-09-19T10:00:00",
};

const koramangalaUpdates: SiteUpdate[] = [
  {
    id: "upd_kora_kitchen_cabinets",
    projectId: IDS.koramangala,
    roomId: IDS.kitchen,
    authorId: IDS.rohan,
    title: "Base and wall cabinets installed",
    description: "Base and wall cabinets are in. Shutters are aligned and the soft-close hardware is fitted.",
    previousProgress: 50,
    proposedProgress: 65,
    status: "pending",
    createdAt: "2026-10-21T11:00:00",
    thread: [],
    photos: [
      shot("upd-kora-cab-1", "Base cabinets along the hob wall", "progress"),
      shot("upd-kora-cab-2", "Wall cabinets up to the ceiling", "progress"),
      shot("upd-kora-cab-3", "Soft-close runner detail", "after"),
    ],
  },
  {
    id: "upd_kora_living_frame",
    projectId: IDS.koramangala,
    roomId: IDS.living,
    authorId: IDS.rohan,
    title: "False ceiling frame complete",
    description: "The gypsum frame is up. Cove channel is marked and waiting on the change request.",
    previousProgress: 30,
    proposedProgress: 40,
    status: "pending",
    createdAt: "2026-10-20T16:00:00",
    thread: [],
    photos: [
      shot("upd-kora-frame-1", "Frame across the living room", "progress"),
      shot("upd-kora-frame-2", "Level check at the window", "progress"),
    ],
  },
  {
    id: "upd_kora_master_shutters",
    projectId: IDS.koramangala,
    roomId: IDS.master,
    authorId: IDS.rohan,
    title: "Wardrobe shutters fitted",
    description: "Fluted shutters are hung and the edges are finished.",
    previousProgress: 70,
    proposedProgress: 80,
    status: "approved",
    createdAt: "2026-10-12T15:00:00",
    decision: { byId: IDS.ananya, at: "2026-10-13T09:30:00" },
    thread: [],
    photos: [
      shot("upd-kora-ward-1", "Shutters closed", "after"),
      shot("upd-kora-ward-2", "Internal shelf layout", "progress"),
      shot("upd-kora-ward-3", "Edge detail", "after"),
    ],
  },
  {
    id: "upd_kora_bath_tile",
    projectId: IDS.koramangala,
    roomId: IDS.bathroom,
    authorId: IDS.rohan,
    title: "Wall tiling 60% complete",
    description: "Wet-wall tiling is past the dado. The niche is cut and waterproofed.",
    previousProgress: 40,
    proposedProgress: 60,
    status: "approved",
    createdAt: "2026-09-28T14:00:00",
    decision: { byId: IDS.ananya, at: "2026-09-29T11:00:00" },
    thread: [],
    photos: [
      shot("upd-kora-tile-1", "Tiled wet wall", "progress"),
      shot("upd-kora-tile-2", "Niche before the shelf", "progress"),
      shot("upd-kora-tile-3", "Floor still protected", "before"),
    ],
  },
  {
    id: "upd_kora_kids_conduit",
    projectId: IDS.koramangala,
    roomId: IDS.kids,
    authorId: IDS.rohan,
    title: "Electrical conduits laid",
    description: "Conduits are chased for lights and the study wall. Waiting on the extra socket.",
    previousProgress: 10,
    proposedProgress: 20,
    status: "changes_requested",
    createdAt: "2026-09-18T13:00:00",
    decision: { byId: IDS.ananya, at: "2026-09-19T10:00:00", comment: kidsComment.text },
    thread: [kidsComment],
    photos: [
      shot("upd-kora-conduit-1", "Chase along the study wall", "progress"),
      shot("upd-kora-conduit-2", "Ceiling points marked", "progress"),
    ],
  },
  {
    id: "upd_kora_kitchen_plumb",
    projectId: IDS.koramangala,
    roomId: IDS.kitchen,
    authorId: IDS.rohan,
    title: "Plumbing rough-in done",
    description: "Sink and dishwasher points are in and pressure-tested.",
    previousProgress: 30,
    proposedProgress: 50,
    status: "approved",
    createdAt: "2026-09-05T12:00:00",
    decision: { byId: IDS.ananya, at: "2026-09-06T09:00:00" },
    thread: [],
    photos: [
      shot("upd-kora-plumb-1", "Sink point", "progress"),
      shot("upd-kora-plumb-2", "Dishwasher feed", "progress"),
      shot("upd-kora-plumb-3", "Pressure test", "after"),
      shot("upd-kora-plumb-4", "Floor before cabinets", "before"),
    ],
  },
];

const koramangalaPayments: Payment[] = [
  {
    id: "pay_kora_advance",
    projectId: IDS.koramangala,
    amount: 450000,
    date: "2026-07-02T12:00:00",
    method: "UPI",
    reference: "UTR260702AN01",
    stage: "Advance",
    recordedById: IDS.rohan,
    status: "acknowledged",
    ackAt: "2026-07-02T18:00:00",
    audit: [
      recorded("aud_kora_adv_rec", "2026-07-02T12:10:00", IDS.rohan),
      acknowledged("aud_kora_adv_ack", "2026-07-02T18:00:00", IDS.ananya),
    ],
  },
  {
    id: "pay_kora_material",
    projectId: IDS.koramangala,
    amount: 300000,
    date: "2026-08-10T12:00:00",
    method: "Bank Transfer",
    reference: "NEFT260810LM",
    stage: "Material",
    recordedById: IDS.rohan,
    status: "acknowledged",
    ackAt: "2026-08-11T09:00:00",
    audit: [
      recorded("aud_kora_mat_rec", "2026-08-10T12:20:00", IDS.rohan),
      acknowledged("aud_kora_mat_ack", "2026-08-11T09:00:00", IDS.ananya),
    ],
  },
  {
    id: "pay_kora_carpentry_sep",
    projectId: IDS.koramangala,
    amount: 150000,
    date: "2026-09-05T12:00:00",
    method: "Cheque",
    reference: "CHQ441298",
    stage: "Carpentry",
    recordedById: IDS.rohan,
    status: "acknowledged",
    ackAt: "2026-09-08T11:00:00",
    audit: [
      recorded("aud_kora_car_rec", "2026-09-05T12:30:00", IDS.rohan),
      acknowledged("aud_kora_car_ack", "2026-09-08T11:00:00", IDS.ananya),
    ],
  },
  {
    id: IDS.payAwaiting,
    projectId: IDS.koramangala,
    amount: 250000,
    date: "2026-10-20T12:00:00",
    method: "UPI",
    reference: "UTR261020AN07",
    stage: "Carpentry",
    note: "Second carpentry milestone",
    recordedById: IDS.rohan,
    status: "awaiting_ack",
    audit: [recorded("aud_kora_oct_rec", "2026-10-20T12:40:00", IDS.rohan, "Second carpentry milestone")],
  },
];

const koramangalaChanges: ChangeRequest[] = [
  {
    id: IDS.cove,
    projectId: IDS.koramangala,
    roomId: IDS.living,
    title: "Cove-lit false ceiling in Living Room",
    description: "Add a cove with concealed LED along the window wall of the living room.",
    raisedById: IDS.rohan,
    raisedByRole: "designer",
    costImpact: 140000,
    daysImpact: 5,
    status: "pending",
    createdAt: "2026-10-18T15:00:00",
  },
  {
    id: IDS.wardrobe,
    projectId: IDS.koramangala,
    roomId: IDS.master,
    title: "Upgrade Master Bedroom wardrobe to full-height",
    description: "Take the wardrobe to the ceiling and add an extra shelf row.",
    raisedById: IDS.ananya,
    raisedByRole: "homeowner",
    costImpact: 65000,
    daysImpact: 3,
    status: "approved",
    createdAt: "2026-08-20T11:00:00",
    decidedAt: "2026-08-22T10:00:00",
    appliedToBaseline: true,
  },
  {
    id: IDS.veneer,
    projectId: IDS.koramangala,
    roomId: IDS.kids,
    title: "Replace Kids Bedroom laminate with veneer",
    description: "Swap the study-wall laminate for natural veneer.",
    raisedById: IDS.ananya,
    raisedByRole: "homeowner",
    costImpact: 40000,
    daysImpact: 2,
    status: "rejected",
    createdAt: "2026-09-02T11:00:00",
    decidedAt: "2026-09-04T16:00:00",
    decisionComment: "Keep laminate so the room stays easy to maintain.",
  },
  {
    id: IDS.deck,
    projectId: IDS.koramangala,
    roomId: IDS.balcony,
    title: "Drop balcony wooden decking, use tiles",
    description: "Replace the timber deck with outdoor tiles.",
    raisedById: IDS.rohan,
    raisedByRole: "designer",
    costImpact: -55000,
    daysImpact: -2,
    status: "approved",
    createdAt: "2026-07-28T11:00:00",
    decidedAt: "2026-07-30T09:00:00",
    appliedToBaseline: true,
  },
];

interface RoomDraft {
  id: string;
  name: string;
  type: Room["type"];
  areaSqft: number;
  progress: number;
  status: Room["status"];
  activeTask: string;
  budgetAllocation: number;
}

function buildRoom(projectId: string, draft: RoomDraft): Room {
  return {
    ...draft,
    projectId,
    beforePhotos: [1, 2, 3].map((index) => picsum(`${draft.id}-before-${index}`)),
    inspiration: [
      inspiration(`${draft.id}-ins-1`, "Materials", `${draft.name} material reference`),
      inspiration(`${draft.id}-ins-2`, "Layout", `${draft.name} layout reference`),
      inspiration(`${draft.id}-ins-3`, "Lighting", `${draft.name} lighting reference`),
    ],
    specs: [
      spec(`${draft.id}-floor`, "Flooring", `${draft.name} flooring`, 20, "sqm", 48000, { status: "approved" }),
      spec(`${draft.id}-walls`, "Walls", `${draft.name} paint`, 1, "lot", 18000, { status: "proposed" }),
      spec(`${draft.id}-light`, "Lighting", `${draft.name} lights`, 4, "nos", 16000, { status: "proposed" }),
      spec(`${draft.id}-furn`, "Furniture", `${draft.name} joinery`, 1, "lot", 72000, { status: "ordered" }),
    ],
  };
}

const whitefieldDrafts: RoomDraft[] = [
  { id: "rm_wf_living", name: "Living Room", type: "living", areaSqft: 520, progress: 70, status: "in_progress", activeTask: "Floor polishing", budgetAllocation: 800000 },
  { id: "rm_wf_kitchen", name: "Kitchen", type: "kitchen", areaSqft: 240, progress: 55, status: "in_progress", activeTask: "Counter templating", budgetAllocation: 800000 },
  { id: "rm_wf_master", name: "Master Suite", type: "bedroom", areaSqft: 380, progress: 40, status: "in_progress", activeTask: "Wardrobe carcass", budgetAllocation: 800000 },
  { id: "rm_wf_guest", name: "Guest Bedroom", type: "bedroom", areaSqft: 220, progress: 25, status: "in_progress", activeTask: "Ceiling paint", budgetAllocation: 800000 },
  { id: "rm_wf_bath", name: "Bathroom", type: "bathroom", areaSqft: 90, progress: 35, status: "in_progress", activeTask: "Waterproofing", budgetAllocation: 800000 },
  { id: "rm_wf_deck", name: "Garden Deck", type: "balcony", areaSqft: 260, progress: 10, status: "in_progress", activeTask: "Stone sample approval", budgetAllocation: 800000 },
];

const indiranagarDrafts: RoomDraft[] = [
  { id: "rm_ind_living", name: "Living Room", type: "living", areaSqft: 420, progress: 40, status: "in_progress", activeTask: "Floor protection", budgetAllocation: 450000 },
  { id: "rm_ind_kitchen", name: "Kitchen", type: "kitchen", areaSqft: 180, progress: 35, status: "in_progress", activeTask: "Plumbing layout", budgetAllocation: 450000 },
  { id: "rm_ind_master", name: "Master Bedroom", type: "bedroom", areaSqft: 240, progress: 30, status: "in_progress", activeTask: "Wardrobe drawing", budgetAllocation: 450000 },
  { id: "rm_ind_bedroom", name: "Bedroom", type: "bedroom", areaSqft: 180, progress: 20, status: "in_progress", activeTask: "Electrical layout", budgetAllocation: 450000 },
  { id: "rm_ind_bath", name: "Bathroom", type: "bathroom", areaSqft: 70, progress: 15, status: "in_progress", activeTask: "Demolition clearance", budgetAllocation: 450000 },
  { id: "rm_ind_terrace", name: "Terrace", type: "balcony", areaSqft: 200, progress: 10, status: "not_started", activeTask: "Waterproofing quote", budgetAllocation: 450000 },
];

function simpleUpdate(
  id: string,
  projectId: string,
  roomId: string,
  title: string,
  previousProgress: number,
  proposedProgress: number,
  createdAt: string,
): SiteUpdate {
  return {
    id,
    projectId,
    roomId,
    authorId: IDS.rohan,
    title,
    description: `${title}. Recorded for the site diary.`,
    previousProgress,
    proposedProgress,
    status: "approved",
    createdAt,
    decision: { byId: projectId === IDS.indiranagar ? IDS.karthik : IDS.ananya, at: createdAt },
    thread: [],
    photos: [
      shot(`${id}-1`, title, "progress"),
      shot(`${id}-2`, "Detail", "progress"),
      shot(`${id}-3`, "Room after the day's work", "after"),
    ],
  };
}

function paid(
  id: string,
  projectId: string,
  amount: number,
  date: string,
  method: Payment["method"],
  stage: Payment["stage"],
  reference: string,
  homeownerId: string,
): Payment {
  return {
    id,
    projectId,
    amount,
    date,
    method,
    reference,
    stage,
    recordedById: IDS.rohan,
    status: "acknowledged",
    ackAt: date,
    audit: [recorded(`${id}_rec`, date, IDS.rohan), acknowledged(`${id}_ack`, date, homeownerId)],
  };
}

const whitefieldPayments: Payment[] = [
  paid("pay_wf_advance", IDS.whitefield, 500000, "2026-05-02T12:00:00", "UPI", "Advance", "UTR260502WF", IDS.ananya),
  paid("pay_wf_material", IDS.whitefield, 750000, "2026-07-18T12:00:00", "Bank Transfer", "Material", "NEFT260718WF", IDS.ananya),
  paid("pay_wf_carpentry", IDS.whitefield, 220000, "2026-09-01T12:00:00", "Cheque", "Carpentry", "CHQ778120", IDS.ananya),
  {
    id: "pay_wf_disputed",
    projectId: IDS.whitefield,
    amount: 180000,
    date: "2026-10-01T12:00:00",
    method: "Cash",
    stage: "Finishing",
    note: "Finishing advance",
    recordedById: IDS.rohan,
    status: "disputed",
    disputeReason: "Not received by us",
    audit: [
      recorded("aud_wf_cash_rec", "2026-10-01T12:15:00", IDS.rohan),
      { id: "aud_wf_cash_dis", at: "2026-10-02T09:00:00", actorId: IDS.ananya, action: "disputed", note: "Not received by us" },
    ],
  },
];

const indiranagarPayments: Payment[] = [
  paid("pay_ind_advance", IDS.indiranagar, 400000, "2026-09-05T12:00:00", "UPI", "Advance", "UTR260905IN", IDS.karthik),
  paid("pay_ind_design", IDS.indiranagar, 150000, "2026-09-20T12:00:00", "Bank Transfer", "Design", "NEFT260920IN", IDS.karthik),
  paid("pay_ind_material", IDS.indiranagar, 300000, "2026-10-18T12:00:00", "UPI", "Material", "UTR261018IN", IDS.karthik),
];

const whitefieldChanges: ChangeRequest[] = [
  {
    id: "cr_wf_powder",
    projectId: IDS.whitefield,
    roomId: "rm_wf_bath",
    title: "Add a powder room",
    description: "A small cloakroom off the living room.",
    raisedById: IDS.ananya,
    raisedByRole: "homeowner",
    costImpact: 80000,
    daysImpact: 4,
    status: "approved",
    createdAt: "2026-06-12T12:00:00",
    decidedAt: "2026-06-14T12:00:00",
    appliedToBaseline: true,
  },
  {
    id: "cr_wf_stair",
    projectId: IDS.whitefield,
    title: "Marble staircase",
    description: "Replace the timber stair with marble.",
    raisedById: IDS.rohan,
    raisedByRole: "designer",
    costImpact: 200000,
    daysImpact: 10,
    status: "rejected",
    createdAt: "2026-08-02T12:00:00",
    decidedAt: "2026-08-04T12:00:00",
    decisionComment: "Stay with timber.",
  },
];

const indiranagarChanges: ChangeRequest[] = [
  {
    id: "cr_ind_light",
    projectId: IDS.indiranagar,
    roomId: "rm_ind_living",
    title: "Extra living-room floor outlets",
    description: "Two more floor boxes for the seating layout.",
    raisedById: IDS.karthik,
    raisedByRole: "homeowner",
    costImpact: 18000,
    daysImpact: 1,
    status: "approved",
    createdAt: "2026-09-12T12:00:00",
    decidedAt: "2026-09-13T12:00:00",
    appliedToBaseline: true,
  },
  {
    id: "cr_ind_marble",
    projectId: IDS.indiranagar,
    roomId: "rm_ind_bath",
    title: "Book-matched marble in the bathroom",
    description: "Upgrade the wet wall to book-matched marble.",
    raisedById: IDS.rohan,
    raisedByRole: "designer",
    costImpact: 90000,
    daysImpact: 6,
    status: "rejected",
    createdAt: "2026-09-25T12:00:00",
    decidedAt: "2026-09-26T12:00:00",
    decisionComment: "Keep the specified tile.",
  },
];

function member(
  id: string,
  projectId: string,
  name: string,
  contact: string,
  role: TeamMember["role"],
  access: TeamMember["access"],
): TeamMember {
  return { id, projectId, name, contact, role, access, status: "active" };
}

function note(
  id: string,
  userId: string,
  projectId: string,
  type: Notification["type"],
  title: string,
  body: string,
  createdAt: string,
  href: string,
  read = false,
): Notification {
  return { id, userId, projectId, type, title, body, createdAt, read, href };
}

export function createSeedData(): Database {
  return {
    users: users.map((user) => ({ ...user })),
    projects: [
      {
        id: IDS.koramangala,
        name: "Koramangala Apartment",
        propertyType: "Apartment",
        bhk: "3 BHK",
        areaSqft: 1650,
        location: { area: "Koramangala", city: "Bengaluru" },
        homeownerId: IDS.ananya,
        designerId: IDS.rohan,
        studioName: "Studio Lumen",
        startDate: "2026-06-15",
        originalEndDate: "2026-12-15",
        baseBudget: 1790000,
        coverImage: picsum("kora-cover"),
        status: "active",
        seedDelayDays: 0,
      },
      {
        id: IDS.whitefield,
        name: "Whitefield Villa",
        propertyType: "Villa",
        bhk: "4 BHK",
        areaSqft: 3200,
        location: { area: "Whitefield", city: "Bengaluru" },
        homeownerId: IDS.ananya,
        designerId: IDS.rohan,
        studioName: "Studio Lumen",
        startDate: "2026-04-01",
        originalEndDate: "2026-11-30",
        baseBudget: 4800000,
        coverImage: picsum("wf-cover"),
        status: "active",
        seedDelayDays: 18,
      },
      {
        id: IDS.indiranagar,
        name: "Indiranagar Penthouse",
        propertyType: "Penthouse",
        bhk: "3 BHK",
        areaSqft: 2100,
        location: { area: "Indiranagar", city: "Bengaluru" },
        homeownerId: IDS.karthik,
        designerId: IDS.rohan,
        studioName: "Studio Lumen",
        startDate: "2026-09-01",
        originalEndDate: "2027-01-31",
        baseBudget: 2700000,
        coverImage: picsum("ind-cover"),
        status: "active",
        seedDelayDays: 0,
      },
    ],
    rooms: [
      ...koramangalaRooms.map((room) => ({
        ...room,
        beforePhotos: [...room.beforePhotos],
        inspiration: room.inspiration.map((item) => ({ ...item })),
        specs: room.specs.map((item) => ({ ...item })),
      })),
      ...whitefieldDrafts.map((draft) => buildRoom(IDS.whitefield, draft)),
      ...indiranagarDrafts.map((draft) => buildRoom(IDS.indiranagar, draft)),
    ],
    updates: [
      ...koramangalaUpdates.map((update) => ({
        ...update,
        photos: update.photos.map((photo) => ({ ...photo })),
        thread: update.thread.map((comment) => ({ ...comment })),
        decision: update.decision ? { ...update.decision } : undefined,
      })),
      simpleUpdate("upd_wf_1", IDS.whitefield, "rm_wf_living", "Floor polishing started", 60, 70, "2026-10-11T12:00:00"),
      simpleUpdate("upd_wf_2", IDS.whitefield, "rm_wf_kitchen", "Counter template signed off", 45, 55, "2026-09-20T12:00:00"),
      simpleUpdate("upd_wf_3", IDS.whitefield, "rm_wf_master", "Wardrobe carcass delivered", 30, 40, "2026-08-28T12:00:00"),
      simpleUpdate("upd_wf_4", IDS.whitefield, "rm_wf_bath", "Waterproofing coat one", 20, 35, "2026-07-15T12:00:00"),
      simpleUpdate("upd_ind_1", IDS.indiranagar, "rm_ind_living", "Floor protection down", 30, 40, "2026-10-20T12:00:00"),
      simpleUpdate("upd_ind_2", IDS.indiranagar, "rm_ind_kitchen", "Plumbing layout marked", 25, 35, "2026-10-08T12:00:00"),
      simpleUpdate("upd_ind_3", IDS.indiranagar, "rm_ind_master", "Wardrobe drawing issued", 20, 30, "2026-09-22T12:00:00"),
      simpleUpdate("upd_ind_4", IDS.indiranagar, "rm_ind_bath", "Demolition cleared", 5, 15, "2026-09-10T12:00:00"),
    ],
    payments: [...koramangalaPayments, ...whitefieldPayments, ...indiranagarPayments].map((payment) => ({
      ...payment,
      audit: payment.audit.map((entry) => ({ ...entry })),
    })),
    changeRequests: [...koramangalaChanges, ...whitefieldChanges, ...indiranagarChanges].map((request) => ({
      ...request,
    })),
    teamMembers: [
      member("tm_kora_ananya", IDS.koramangala, "Ananya Rao", "9845011101", "owner", "full"),
      member("tm_kora_rohan", IDS.koramangala, "Rohan Mehta", "9845022202", "designer", "full"),
      member("tm_kora_meera", IDS.koramangala, "Meera Rao", "9845044404", "family", "view"),
      member("tm_kora_suresh", IDS.koramangala, "Suresh Kumar", "9845055505", "site_supervisor", "view"),
      member("tm_wf_ananya", IDS.whitefield, "Ananya Rao", "9845011101", "owner", "full"),
      member("tm_wf_rohan", IDS.whitefield, "Rohan Mehta", "9845022202", "designer", "full"),
      member("tm_wf_suresh", IDS.whitefield, "Suresh Kumar", "9845055505", "site_supervisor", "view"),
      member("tm_ind_karthik", IDS.indiranagar, "Karthik Iyer", "9845033303", "owner", "full"),
      member("tm_ind_rohan", IDS.indiranagar, "Rohan Mehta", "9845022202", "designer", "full"),
    ],
    notifications: [
      note("nt_ananya_kitchen", IDS.ananya, IDS.koramangala, "update_pending", "Kitchen update awaiting your approval", "Base and wall cabinets installed", "2026-10-21T11:05:00", `/projects/${IDS.koramangala}/updates`),
      note("nt_ananya_living", IDS.ananya, IDS.koramangala, "update_pending", "Living Room update awaiting your approval", "False ceiling frame complete", "2026-10-20T16:05:00", `/projects/${IDS.koramangala}/updates`),
      note("nt_ananya_pay", IDS.ananya, IDS.koramangala, "payment_ack", "₹2.5L payment awaiting acknowledgement", "Carpentry · UPI · 20 Oct 2026", "2026-10-20T12:45:00", `/projects/${IDS.koramangala}/financials?payment=${IDS.payAwaiting}`),
      note("nt_ananya_cr", IDS.ananya, IDS.koramangala, "change_request", "Change request: Cove-lit false ceiling", "+₹1,40,000 and +5 days", "2026-10-18T15:05:00", `/projects/${IDS.koramangala}/changes`),
      note("nt_ananya_dispute", IDS.ananya, IDS.whitefield, "payment_ack", "You disputed a cash payment", "Not received by us", "2026-10-02T09:05:00", `/projects/${IDS.whitefield}/financials?payment=pay_wf_disputed`, true),
      note("nt_rohan_kids", IDS.rohan, IDS.koramangala, "update_decided", "Changes requested on Kids Bedroom", "Please add a socket near the study desk", "2026-09-19T10:05:00", `/projects/${IDS.koramangala}/updates`),
      note("nt_rohan_dispute", IDS.rohan, IDS.whitefield, "payment_ack", "Whitefield payment disputed", "Not received by us", "2026-10-02T09:05:00", `/projects/${IDS.whitefield}/financials?payment=pay_wf_disputed`),
      note("nt_rohan_karthik", IDS.rohan, IDS.indiranagar, "payment_ack", "Karthik acknowledged ₹3L payment", "Material stage on Indiranagar Penthouse", "2026-10-18T12:10:00", `/projects/${IDS.indiranagar}/financials?payment=pay_ind_material`),
      note("nt_rohan_cove", IDS.rohan, IDS.koramangala, "change_request", "Cove-lit ceiling is with Ananya", "Waiting on a decision", "2026-10-18T15:06:00", `/projects/${IDS.koramangala}/changes`, true),
      note("nt_rohan_meera", IDS.rohan, IDS.koramangala, "invite", "Meera joined Koramangala", "View-only access", "2026-07-05T10:00:00", `/projects/${IDS.koramangala}/team`, true),
    ],
  };
}

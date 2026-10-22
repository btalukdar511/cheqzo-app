import { delay, uniqueId } from "@/lib/demo";
import {
  acknowledgePayment,
  actorFromUser,
  addUpdateComment,
  approveChangeRequest,
  approveUpdate,
  buildProject,
  canSeeProject,
  disputePayment,
  postUpdate,
  recordPayment,
  projectHealth,
  rejectChangeRequest,
  rejectUpdate,
  requestUpdateChanges,
  resubmitPayment,
  summarizeProject,
  withdrawChangeRequest,
  type Actor,
  type HealthResult,
  type PaymentWrite,
  type ProjectCreateInput,
  type ProjectSummary,
} from "@/lib/rules";
import { useDb } from "@/store/db";
import type {
  ChangeRequest,
  Database,
  Notification,
  Payment,
  Project,
  Room,
  SiteUpdate,
  TeamMember,
  User,
} from "@/types";

async function wait(): Promise<void> {
  if (useDb.getState().latencyEnabled) await delay();
}

function database(): Database {
  const state = useDb.getState();
  return {
    users: state.users,
    projects: state.projects,
    rooms: state.rooms,
    updates: state.updates,
    payments: state.payments,
    changeRequests: state.changeRequests,
    teamMembers: state.teamMembers,
    notifications: state.notifications,
  };
}

function requireUser(userId: string): User {
  const user = useDb.getState().users.find((item) => item.id === userId);
  if (!user) throw new Error("Unknown user");
  return user;
}

function actor(userId: string): Actor {
  return actorFromUser(requireUser(userId));
}

function requireVisiblePayment(userId: string, paymentId: string): { payment: Payment; project: Project } {
  const state = useDb.getState();
  const user = requireUser(userId);
  const payment = state.payments.find((item) => item.id === paymentId);
  const project = payment ? state.projects.find((item) => item.id === payment.projectId) : undefined;
  if (!payment || !project) throw new Error("Payment not found");
  if (!canSeeProject(user, project.id, state.projects, state.teamMembers)) {
    throw new Error("You don't have access to this project");
  }
  return { payment, project };
}

export const api = {
  async listUsers(): Promise<User[]> {
    await wait();
    return useDb.getState().users;
  },

  async getUser(userId: string): Promise<User | null> {
    await wait();
    return useDb.getState().users.find((user) => user.id === userId) ?? null;
  },

  async listProjects(): Promise<Project[]> {
    await wait();
    return useDb.getState().projects;
  },

  async getProject(projectId: string): Promise<Project | null> {
    await wait();
    return useDb.getState().projects.find((project) => project.id === projectId) ?? null;
  },

  async listRooms(projectId: string): Promise<Room[]> {
    await wait();
    return useDb.getState().rooms.filter((room) => room.projectId === projectId);
  },

  async listUpdates(projectId: string): Promise<SiteUpdate[]> {
    await wait();
    return useDb.getState().updates.filter((update) => update.projectId === projectId);
  },

  async listPayments(projectId: string): Promise<Payment[]> {
    await wait();
    return useDb.getState().payments.filter((payment) => payment.projectId === projectId);
  },

  async listChangeRequests(projectId: string): Promise<ChangeRequest[]> {
    await wait();
    return useDb.getState().changeRequests.filter((request) => request.projectId === projectId);
  },

  async listTeam(projectId: string): Promise<TeamMember[]> {
    await wait();
    return useDb.getState().teamMembers.filter((member) => member.projectId === projectId);
  },

  async listNotifications(userId: string): Promise<Notification[]> {
    await wait();
    return useDb.getState().notifications.filter((item) => item.userId === userId);
  },

  async projectHealth(projectId: string): Promise<HealthResult | null> {
    await wait();
    const data = database();
    const project = data.projects.find((item) => item.id === projectId);
    if (!project) return null;
    return projectHealth({
      project,
      updates: data.updates,
      payments: data.payments,
      changeRequests: data.changeRequests,
    });
  },

  async projectSummary(projectId: string): Promise<ProjectSummary | null> {
    await wait();
    const data = database();
    const project = data.projects.find((item) => item.id === projectId);
    if (!project) return null;
    return summarizeProject({
      project,
      rooms: data.rooms,
      updates: data.updates,
      payments: data.payments,
      changeRequests: data.changeRequests,
    });
  },

  async reset(): Promise<void> {
    await wait();
    useDb.getState().reset();
  },

  async setLatency(enabled: boolean): Promise<void> {
    useDb.getState().setLatencyEnabled(enabled);
  },

  async postUpdate(
    userId: string,
    input: {
      projectId: string;
      roomId: string;
      title: string;
      description: string;
      photos: SiteUpdate["photos"];
      proposedProgress: number;
      notifyClient: boolean;
    },
  ): Promise<SiteUpdate> {
    if (useDb.getState().latencyEnabled) await delay(700);
    const state = useDb.getState();
    const user = requireUser(userId);
    const room = state.rooms.find((item) => item.id === input.roomId && item.projectId === input.projectId);
    const project = state.projects.find((item) => item.id === input.projectId);
    if (!room || !project) throw new Error("Room not found");
    if (!canSeeProject(user, project.id, state.projects, state.teamMembers)) {
      throw new Error("You don't have access to this project");
    }
    const result = postUpdate({
      actor: actorFromUser(user),
      room,
      homeownerId: project.homeownerId,
      title: input.title,
      description: input.description,
      photos: input.photos,
      proposedProgress: input.proposedProgress,
      notifyClient: input.notifyClient,
      updateId: uniqueId("upd"),
      notificationId: uniqueId("nt"),
    });
    if (!result.ok) throw new Error(result.reason);
    useDb.setState({
      updates: [result.value.update, ...state.updates],
      rooms: state.rooms.map((item) => (item.id === room.id ? result.value.room : item)),
      notifications: result.value.notification
        ? [result.value.notification, ...state.notifications]
        : state.notifications,
    });
    return result.value.update;
  },

  async addUpdateComment(userId: string, updateId: string, text: string): Promise<SiteUpdate> {
    await wait();
    const state = useDb.getState();
    const user = requireUser(userId);
    const update = state.updates.find((item) => item.id === updateId);
    if (!update) throw new Error("Update not found");
    if (!canSeeProject(user, update.projectId, state.projects, state.teamMembers)) {
      throw new Error("You don't have access to this project");
    }
    const result = addUpdateComment({
      update,
      actor: actorFromUser(user),
      text,
      commentId: uniqueId("cmt"),
    });
    if (!result.ok) throw new Error(result.reason);
    useDb.setState({
      updates: state.updates.map((item) => (item.id === updateId ? result.value.update : item)),
    });
    return result.value.update;
  },

  async approveUpdate(userId: string, updateId: string): Promise<SiteUpdate> {
    await wait();
    const state = useDb.getState();
    const update = state.updates.find((item) => item.id === updateId);
    const room = update ? state.rooms.find((item) => item.id === update.roomId) : undefined;
    if (!update || !room) throw new Error("Update not found");
    const result = approveUpdate({ update, room, actor: actor(userId) });
    if (!result.ok) throw new Error(result.reason);
    useDb.setState({
      updates: state.updates.map((item) => (item.id === updateId ? result.value.update : item)),
      rooms: state.rooms.map((item) => (item.id === room.id ? result.value.room : item)),
      notifications: [result.value.notification, ...state.notifications],
    });
    return result.value.update;
  },

  async requestUpdateChanges(userId: string, updateId: string, comment: string): Promise<SiteUpdate> {
    await wait();
    const state = useDb.getState();
    const update = state.updates.find((item) => item.id === updateId);
    if (!update) throw new Error("Update not found");
    const result = requestUpdateChanges({ update, actor: actor(userId), comment });
    if (!result.ok) throw new Error(result.reason);
    useDb.setState({
      updates: state.updates.map((item) => (item.id === updateId ? result.value.update : item)),
      notifications: [result.value.notification, ...state.notifications],
    });
    return result.value.update;
  },

  async rejectUpdate(userId: string, updateId: string, reason: string): Promise<SiteUpdate> {
    await wait();
    const state = useDb.getState();
    const update = state.updates.find((item) => item.id === updateId);
    if (!update) throw new Error("Update not found");
    const result = rejectUpdate({ update, actor: actor(userId), reason });
    if (!result.ok) throw new Error(result.reason);
    useDb.setState({
      updates: state.updates.map((item) => (item.id === updateId ? result.value.update : item)),
      notifications: [result.value.notification, ...state.notifications],
    });
    return result.value.update;
  },

  async recordPayment(userId: string, projectId: string, draft: PaymentWrite): Promise<Payment> {
    await wait();
    const state = useDb.getState();
    const user = requireUser(userId);
    const project = state.projects.find((item) => item.id === projectId);
    if (!project) throw new Error("Project not found");
    if (!canSeeProject(user, project.id, state.projects, state.teamMembers)) {
      throw new Error("You don't have access to this project");
    }
    const result = recordPayment({
      actor: actorFromUser(user),
      projectId: project.id,
      homeownerId: project.homeownerId,
      ...draft,
      paymentId: uniqueId("pay"),
      notificationId: uniqueId("nt"),
      auditId: uniqueId("aud"),
    });
    if (!result.ok) throw new Error(result.reason);
    useDb.setState({
      payments: [result.value.payment, ...state.payments],
      notifications: [result.value.notification, ...state.notifications],
    });
    return result.value.payment;
  },

  async acknowledgePayment(userId: string, paymentId: string): Promise<Payment> {
    await wait();
    const state = useDb.getState();
    const { payment, project } = requireVisiblePayment(userId, paymentId);
    const result = acknowledgePayment({ payment, actor: actor(userId), designerId: project.designerId });
    if (!result.ok) throw new Error(result.reason);
    useDb.setState({
      payments: state.payments.map((item) => (item.id === paymentId ? result.value.payment : item)),
      notifications: [result.value.notification, ...state.notifications],
    });
    return result.value.payment;
  },

  async disputePayment(userId: string, paymentId: string, reason: string): Promise<Payment> {
    await wait();
    const state = useDb.getState();
    const { payment, project } = requireVisiblePayment(userId, paymentId);
    const result = disputePayment({ payment, actor: actor(userId), reason, designerId: project.designerId });
    if (!result.ok) throw new Error(result.reason);
    useDb.setState({
      payments: state.payments.map((item) => (item.id === paymentId ? result.value.payment : item)),
      notifications: [result.value.notification, ...state.notifications],
    });
    return result.value.payment;
  },

  async resubmitPayment(userId: string, paymentId: string, patch: PaymentWrite): Promise<Payment> {
    await wait();
    const state = useDb.getState();
    const { payment, project } = requireVisiblePayment(userId, paymentId);
    const result = resubmitPayment({
      payment,
      actor: actor(userId),
      homeownerId: project.homeownerId,
      patch,
      auditId: uniqueId("aud"),
      notificationId: uniqueId("nt"),
    });
    if (!result.ok) throw new Error(result.reason);
    useDb.setState({
      payments: state.payments.map((item) => (item.id === paymentId ? result.value.payment : item)),
      notifications: [result.value.notification, ...state.notifications],
    });
    return result.value.payment;
  },

  async approveChangeRequest(userId: string, requestId: string): Promise<ChangeRequest> {
    await wait();
    const state = useDb.getState();
    const request = state.changeRequests.find((item) => item.id === requestId);
    if (!request) throw new Error("Change request not found");
    const result = approveChangeRequest({ request, actor: actor(userId) });
    if (!result.ok) throw new Error(result.reason);
    useDb.setState({
      changeRequests: state.changeRequests.map((item) => (item.id === requestId ? result.value.request : item)),
      notifications: [result.value.notification, ...state.notifications],
    });
    return result.value.request;
  },

  async rejectChangeRequest(userId: string, requestId: string, comment?: string): Promise<ChangeRequest> {
    await wait();
    const state = useDb.getState();
    const request = state.changeRequests.find((item) => item.id === requestId);
    if (!request) throw new Error("Change request not found");
    const result = rejectChangeRequest({ request, actor: actor(userId), comment });
    if (!result.ok) throw new Error(result.reason);
    useDb.setState({
      changeRequests: state.changeRequests.map((item) => (item.id === requestId ? result.value.request : item)),
      notifications: [result.value.notification, ...state.notifications],
    });
    return result.value.request;
  },

  async withdrawChangeRequest(userId: string, requestId: string): Promise<ChangeRequest> {
    await wait();
    const state = useDb.getState();
    const request = state.changeRequests.find((item) => item.id === requestId);
    if (!request) throw new Error("Change request not found");
    const result = withdrawChangeRequest({ request, actor: actor(userId) });
    if (!result.ok) throw new Error(result.reason);
    useDb.setState({
      changeRequests: state.changeRequests.map((item) => (item.id === requestId ? result.value.request : item)),
    });
    return result.value.request;
  },

  async markNotificationRead(notificationId: string): Promise<void> {
    await wait();
    const state = useDb.getState();
    useDb.setState({
      notifications: state.notifications.map((item) =>
        item.id === notificationId ? { ...item, read: true } : item,
      ),
    });
  },

  async createProject(userId: string, draft: ProjectCreateInput): Promise<Project> {
    if (useDb.getState().latencyEnabled) await delay(800);
    const state = useDb.getState();
    const designer = requireUser(userId);
    const result = buildProject({
      actor: actor(userId),
      designer,
      existingUsers: state.users,
      draft,
    });
    if (!result.ok) throw new Error(result.reason);
    useDb.setState({
      users: result.value.user ? [...state.users, result.value.user] : state.users,
      projects: [...state.projects, result.value.project],
      rooms: [...state.rooms, ...result.value.rooms],
      teamMembers: [...state.teamMembers, ...result.value.teamMembers],
      notifications: result.value.notification
        ? [result.value.notification, ...state.notifications]
        : state.notifications,
    });
    return result.value.project;
  },

  async markAllNotificationsRead(userId: string): Promise<void> {
    await wait();
    const state = useDb.getState();
    useDb.setState({
      notifications: state.notifications.map((item) =>
        item.userId === userId ? { ...item, read: true } : item,
      ),
    });
  },
};

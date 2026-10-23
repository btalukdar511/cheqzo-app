import { delay, uniqueId } from "@/lib/demo";
import {
  acceptInvite,
  acknowledgePayment,
  actorFromUser,
  addBeforePhoto,
  addInspiration,
  addRoom,
  addSpec,
  addUpdateComment,
  approveChangeRequest,
  approveUpdate,
  buildProject,
  canSeeProject,
  changeMemberAccess,
  commentOnInspiration,
  deleteSpec,
  disputePayment,
  inviteMember,
  postUpdate,
  raiseChangeRequest,
  recordPayment,
  projectHealth,
  rejectChangeRequest,
  rejectUpdate,
  removeInspiration,
  removeMember,
  requestUpdateChanges,
  resendInvite,
  resubmitPayment,
  setSpecStatus,
  summarizeProject,
  updateActiveTask,
  updateProfile,
  updateProjectSettings,
  updateSpec,
  withdrawChangeRequest,
  type Actor,
  type ChangeRequestDraft,
  type HealthResult,
  type InviteDraft,
  type PaymentWrite,
  type ProjectCreateInput,
  type ProjectRoomDraft,
  type ProjectSettingsPatch,
  type ProjectSummary,
  type SpecDraft,
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

function requireVisibleProject(userId: string, projectId: string): { user: User; project: Project } {
  const state = useDb.getState();
  const user = requireUser(userId);
  const project = state.projects.find((item) => item.id === projectId);
  if (!project) throw new Error("Project not found");
  if (!canSeeProject(user, project.id, state.projects, state.teamMembers)) {
    throw new Error("You don't have access to this project");
  }
  return { user, project };
}

function requireVisibleRoom(userId: string, roomId: string): { user: User; project: Project; room: Room } {
  const state = useDb.getState();
  const room = state.rooms.find((item) => item.id === roomId);
  if (!room) throw new Error("Room not found");
  const visible = requireVisibleProject(userId, room.projectId);
  return { ...visible, room };
}

function requireVisibleRequest(userId: string, requestId: string): { request: ChangeRequest; project: Project } {
  const state = useDb.getState();
  const request = state.changeRequests.find((item) => item.id === requestId);
  if (!request) throw new Error("Change request not found");
  const visible = requireVisibleProject(userId, request.projectId);
  return { request, project: visible.project };
}

function requireVisibleMember(userId: string, memberId: string): { member: TeamMember; project: Project } {
  const state = useDb.getState();
  const member = state.teamMembers.find((item) => item.id === memberId);
  if (!member) throw new Error("Team member not found");
  const visible = requireVisibleProject(userId, member.projectId);
  return { member, project: visible.project };
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

  async raiseChangeRequest(userId: string, projectId: string, draft: ChangeRequestDraft): Promise<ChangeRequest> {
    await wait();
    const state = useDb.getState();
    const { project } = requireVisibleProject(userId, projectId);
    if (draft.roomId && !state.rooms.some((room) => room.id === draft.roomId && room.projectId === projectId)) {
      throw new Error("Room not found");
    }
    const result = raiseChangeRequest({
      actor: actor(userId),
      project,
      draft,
      requestId: uniqueId("cr"),
      notificationId: uniqueId("nt"),
    });
    if (!result.ok) throw new Error(result.reason);
    useDb.setState({
      changeRequests: [result.value.request, ...state.changeRequests],
      notifications: [result.value.notification, ...state.notifications],
    });
    return result.value.request;
  },

  async approveChangeRequest(userId: string, requestId: string): Promise<ChangeRequest> {
    await wait();
    const state = useDb.getState();
    const { request } = requireVisibleRequest(userId, requestId);
    const result = approveChangeRequest({ request, actor: actor(userId), notificationId: uniqueId("nt") });
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
    const { request } = requireVisibleRequest(userId, requestId);
    const result = rejectChangeRequest({
      request,
      actor: actor(userId),
      comment,
      notificationId: uniqueId("nt"),
    });
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
    const { request } = requireVisibleRequest(userId, requestId);
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

  async addRoom(userId: string, projectId: string, draft: ProjectRoomDraft): Promise<Room> {
    await wait();
    const state = useDb.getState();
    requireVisibleProject(userId, projectId);
    const result = addRoom({ actor: actor(userId), projectId, draft, roomId: uniqueId("rm") });
    if (!result.ok) throw new Error(result.reason);
    useDb.setState({ rooms: [...state.rooms, result.value.room] });
    return result.value.room;
  },

  async updateActiveTask(userId: string, roomId: string, activeTask: string): Promise<Room> {
    await wait();
    const { room } = requireVisibleRoom(userId, roomId);
    const result = updateActiveTask({ actor: actor(userId), room, activeTask });
    if (!result.ok) throw new Error(result.reason);
    const state = useDb.getState();
    useDb.setState({ rooms: state.rooms.map((item) => (item.id === room.id ? result.value.room : item)) });
    return result.value.room;
  },

  async addSpec(userId: string, roomId: string, draft: SpecDraft): Promise<Room> {
    await wait();
    const { room } = requireVisibleRoom(userId, roomId);
    const result = addSpec({ actor: actor(userId), room, draft, specId: uniqueId("spec") });
    if (!result.ok) throw new Error(result.reason);
    const state = useDb.getState();
    useDb.setState({ rooms: state.rooms.map((item) => (item.id === room.id ? result.value.room : item)) });
    return result.value.room;
  },

  async updateSpec(userId: string, roomId: string, specId: string, draft: SpecDraft): Promise<Room> {
    await wait();
    const { room } = requireVisibleRoom(userId, roomId);
    const result = updateSpec({ actor: actor(userId), room, specId, draft });
    if (!result.ok) throw new Error(result.reason);
    const state = useDb.getState();
    useDb.setState({ rooms: state.rooms.map((item) => (item.id === room.id ? result.value.room : item)) });
    return result.value.room;
  },

  async deleteSpec(userId: string, roomId: string, specId: string): Promise<Room> {
    await wait();
    const { room } = requireVisibleRoom(userId, roomId);
    const result = deleteSpec({ actor: actor(userId), room, specId });
    if (!result.ok) throw new Error(result.reason);
    const state = useDb.getState();
    useDb.setState({ rooms: state.rooms.map((item) => (item.id === room.id ? result.value.room : item)) });
    return result.value.room;
  },

  async setSpecStatus(
    userId: string,
    roomId: string,
    specId: string,
    status: Room["specs"][number]["status"],
  ): Promise<Room> {
    await wait();
    const { room } = requireVisibleRoom(userId, roomId);
    const result = setSpecStatus({ actor: actor(userId), room, specId, status });
    if (!result.ok) throw new Error(result.reason);
    const state = useDb.getState();
    useDb.setState({ rooms: state.rooms.map((item) => (item.id === room.id ? result.value.room : item)) });
    return result.value.room;
  },

  async addBeforePhoto(userId: string, roomId: string, url: string): Promise<Room> {
    await wait();
    const { room } = requireVisibleRoom(userId, roomId);
    const result = addBeforePhoto({ actor: actor(userId), room, url });
    if (!result.ok) throw new Error(result.reason);
    const state = useDb.getState();
    useDb.setState({ rooms: state.rooms.map((item) => (item.id === room.id ? result.value.room : item)) });
    return result.value.room;
  },

  async addInspiration(userId: string, roomId: string, input: { imageUrl: string; note: string; tag: string }): Promise<Room> {
    await wait();
    const { room } = requireVisibleRoom(userId, roomId);
    const result = addInspiration({ actor: actor(userId), room, ...input, itemId: uniqueId("ins") });
    if (!result.ok) throw new Error(result.reason);
    const state = useDb.getState();
    useDb.setState({ rooms: state.rooms.map((item) => (item.id === room.id ? result.value.room : item)) });
    return result.value.room;
  },

  async removeInspiration(userId: string, roomId: string, itemId: string): Promise<Room> {
    await wait();
    const { room } = requireVisibleRoom(userId, roomId);
    const result = removeInspiration({ actor: actor(userId), room, itemId });
    if (!result.ok) throw new Error(result.reason);
    const state = useDb.getState();
    useDb.setState({ rooms: state.rooms.map((item) => (item.id === room.id ? result.value.room : item)) });
    return result.value.room;
  },

  async commentOnInspiration(userId: string, roomId: string, itemId: string, text: string): Promise<Room> {
    await wait();
    const { room } = requireVisibleRoom(userId, roomId);
    const result = commentOnInspiration({
      actor: actor(userId),
      room,
      itemId,
      text,
      commentId: uniqueId("cmt"),
    });
    if (!result.ok) throw new Error(result.reason);
    const state = useDb.getState();
    useDb.setState({ rooms: state.rooms.map((item) => (item.id === room.id ? result.value.room : item)) });
    return result.value.room;
  },

  async inviteMember(userId: string, projectId: string, draft: InviteDraft): Promise<TeamMember> {
    await wait();
    const state = useDb.getState();
    const { project } = requireVisibleProject(userId, projectId);
    const result = inviteMember({
      actor: actor(userId),
      project,
      members: state.teamMembers,
      draft,
      memberId: uniqueId("tm"),
      notificationId: uniqueId("nt"),
    });
    if (!result.ok) throw new Error(result.reason);
    useDb.setState({
      teamMembers: [...state.teamMembers, result.value.member],
      notifications: [result.value.notification, ...state.notifications],
    });
    return result.value.member;
  },

  async changeMemberAccess(userId: string, memberId: string, access: "view" | "approve"): Promise<TeamMember> {
    await wait();
    const state = useDb.getState();
    const { member } = requireVisibleMember(userId, memberId);
    const result = changeMemberAccess({ actor: actor(userId), member, users: state.users, access });
    if (!result.ok) throw new Error(result.reason);
    useDb.setState({
      teamMembers: state.teamMembers.map((item) => (item.id === member.id ? result.value.member : item)),
      users: result.value.user
        ? state.users.map((item) => (item.id === result.value.user?.id ? result.value.user : item))
        : state.users,
    });
    return result.value.member;
  },

  async removeMember(userId: string, memberId: string): Promise<void> {
    await wait();
    const state = useDb.getState();
    const { member } = requireVisibleMember(userId, memberId);
    const result = removeMember({ actor: actor(userId), member });
    if (!result.ok) throw new Error(result.reason);
    useDb.setState({ teamMembers: state.teamMembers.filter((item) => item.id !== result.value.memberId) });
  },

  async resendInvite(userId: string, memberId: string): Promise<TeamMember> {
    await wait();
    const { member } = requireVisibleMember(userId, memberId);
    const result = resendInvite({ actor: actor(userId), member });
    if (!result.ok) throw new Error(result.reason);
    return result.value.member;
  },

  async acceptInvite(memberId: string): Promise<TeamMember> {
    const state = useDb.getState();
    const member = state.teamMembers.find((item) => item.id === memberId);
    if (!member) throw new Error("Team member not found");
    const result = acceptInvite({ member });
    if (!result.ok) throw new Error(result.reason);
    useDb.setState({
      teamMembers: state.teamMembers.map((item) => (item.id === member.id ? result.value.member : item)),
    });
    return result.value.member;
  },

  async updateProjectSettings(userId: string, projectId: string, patch: ProjectSettingsPatch): Promise<Project> {
    await wait();
    const state = useDb.getState();
    const { project } = requireVisibleProject(userId, projectId);
    const result = updateProjectSettings({ actor: actor(userId), project, patch });
    if (!result.ok) throw new Error(result.reason);
    useDb.setState({
      projects: state.projects.map((item) => (item.id === project.id ? result.value.project : item)),
    });
    return result.value.project;
  },

  async updateProfile(userId: string, input: { name: string; email: string; avatarUrl?: string }): Promise<User> {
    await wait();
    const state = useDb.getState();
    const user = requireUser(userId);
    const result = updateProfile({ user, members: state.teamMembers, ...input });
    if (!result.ok) throw new Error(result.reason);
    useDb.setState({
      users: state.users.map((item) => (item.id === user.id ? result.value.user : item)),
      teamMembers: result.value.members,
    });
    return result.value.user;
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

"use client";

import { Bell, CircleCheck, ClipboardList, GitPullRequest, IndianRupee, UserPlus, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/data/api";
import { useCurrentUser, useLiveDb } from "@/data/live";
import { relativeTime } from "@/lib/format";
import { isInternalHref } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types";

const ICONS: Record<Notification["type"], LucideIcon> = {
  update_pending: ClipboardList,
  payment_ack: IndianRupee,
  change_request: GitPullRequest,
  update_decided: CircleCheck,
  invite: UserPlus,
};

export function NotificationsPopover() {
  const user = useCurrentUser();
  const db = useLiveDb();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("all");
  if (!user) return null;
  const userId = user.id;

  const mine = db.notifications
    .filter((item) => item.userId === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const unread = mine.filter((item) => !item.read);
  const visible = tab === "unread" ? unread : mine;

  function openItem(item: Notification) {
    setOpen(false);
    if (!item.read) {
      toast.success("Marked as read");
      void api.markNotificationRead(item.id);
    }
    if (isInternalHref(item.href)) router.push(item.href);
  }

  function markAll() {
    toast.success("All notifications marked read");
    void api.markAllNotificationsRead(userId);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unread.length > 0 ? `Notifications, ${unread.length} unread` : "Notifications"}
        >
          <Bell />
          {unread.length > 0 ? (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] leading-none text-primary-foreground">
              {unread.length}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] gap-3 p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">Notifications</p>
          {unread.length > 0 ? (
            <button type="button" onClick={markAll} className="text-xs font-medium text-primary hover:underline">
              Mark all read
            </button>
          ) : null}
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">
              All
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1">
              Unread
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="max-h-80 overflow-y-auto">
          {visible.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              {tab === "unread" ? "No unread notifications." : "You're all caught up."}
            </p>
          ) : (
            <ul className="flex flex-col">
              {visible.map((item) => {
                const Icon = ICONS[item.type];
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => openItem(item)}
                      className="flex w-full gap-3 rounded-lg px-2 py-2 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start gap-2">
                          <span className="text-sm font-medium text-foreground">{item.title}</span>
                          <span
                            className={cn("mt-1 size-1.5 shrink-0 rounded-full", item.read ? "bg-transparent" : "bg-primary")}
                          />
                        </span>
                        <span className="mt-0.5 block text-xs leading-4 text-muted-foreground">{item.body}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">{relativeTime(item.createdAt)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

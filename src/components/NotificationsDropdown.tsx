import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
} from "@/data/backend";
import { toSlug } from "@/lib/slug";
import type { AppNotification } from "@/data/backend";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function notifLabel(n: AppNotification): { icon: string; text: string; to?: string } {
  const p = n.payload;

  if (n.type === "event_request") {
    const to = p.eventId ? `/events/${p.eventId}` : undefined;
    return { icon: "🙋", text: `Someone requested to attend "${p.eventTitle}"`, to };
  }
  if (n.type === "event_approved") {
    const to = p.eventId ? `/events/${p.eventId}` : undefined;
    return { icon: "✅", text: `You're in! Your request for "${p.eventTitle}" was approved`, to };
  }
  if (n.type === "event_declined") {
    const to = p.eventId ? `/events/${p.eventId}` : undefined;
    return { icon: "❌", text: `Your request for "${p.eventTitle}" was declined`, to };
  }
  if (n.type === "event_circle_invite") {
    const to = p.eventId ? `/events/${p.eventId}` : undefined;
    return { icon: "🤝", text: `Your circle was invited to collaborate on "${p.eventTitle}"`, to };
  }
  if (n.type === "event_circle_approved") {
    const to = p.eventId ? `/events/${p.eventId}` : undefined;
    return { icon: "✅", text: `"${p.circleName}" approved the collab for "${p.eventTitle}"`, to };
  }
  if (n.type === "event_circle_declined") {
    const to = p.eventId ? `/events/${p.eventId}` : undefined;
    return { icon: "❌", text: `"${p.circleName}" declined the collab for "${p.eventTitle}"`, to };
  }

  if (n.type === "circle_join_request") {
    const to = p.circleId ? `/circles/${toSlug(p.circleName) || p.circleId}` : undefined;
    return { icon: "🙋", text: `Someone wants to join "${p.circleName}"`, to };
  }
  if (n.type === "circle_join_approved") {
    const to = p.circleId ? `/circles/${toSlug(p.circleName) || p.circleId}` : undefined;
    return { icon: "🎉", text: `You're in! Your request to join "${p.circleName}" was approved`, to };
  }
  if (n.type === "circle_join_rejected") {
    const to = p.circleId ? `/circles/${toSlug(p.circleName) || p.circleId}` : undefined;
    return { icon: "❌", text: `Your request to join "${p.circleName}" was declined`, to };
  }

  if (n.type === "post_approved") {
    const label = p.contentType === "circle" ? "circle" : "event";
    return { icon: "✅", text: `Your ${label} "${p.title}" was approved and is now live!`, to: p.contentId ? `/${label}s/${p.contentId}` : undefined };
  }
  if (n.type === "post_declined") {
    const label = p.contentType === "circle" ? "circle" : "event";
    const reason = p.reason ? ` Reason: ${p.reason}` : "";
    return { icon: "❌", text: `Your ${label} "${p.title}" was not approved.${reason}`, to: undefined };
  }

  return { icon: "🔔", text: n.type };
}

export function NotificationsDropdown({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getUnreadCount(userId).then(setUnread).catch(() => {});
  }, [userId]);

  useEffect(() => {
    if (!open || loaded) return;
    getNotifications(userId).then((ns) => {
      setNotifs(ns);
      setLoaded(true);
      setUnread(0);
      markAllNotificationsRead(userId).catch(() => {});
    });
  }, [open, loaded, userId]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-80 rounded-xl border border-border bg-popover shadow-pop z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold">Notifications</span>
            {notifs.some((n) => !n.read) && (
              <button
                onClick={() => {
                  markAllNotificationsRead(userId);
                  setNotifs((ns) => ns.map((n) => ({ ...n, read: true })));
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[22rem] overflow-y-auto">
            {!loaded && (
              <div className="p-4 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-10 bg-muted rounded animate-pulse" />
                ))}
              </div>
            )}
            {loaded && notifs.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No notifications yet</p>
            )}
            {loaded && notifs.map((n) => {
              const { icon, text, to } = notifLabel(n);
              const inner = (
                <div className={`px-4 py-3 flex gap-3 items-start transition-colors hover:bg-muted ${!n.read ? "bg-primary/5" : ""}`}>
                  <span className="text-base leading-none mt-0.5 shrink-0">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">{text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
                </div>
              );
              return to ? (
                <Link key={n.id} to={to as any} onClick={() => setOpen(false)}>{inner}</Link>
              ) : (
                <div key={n.id}>{inner}</div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

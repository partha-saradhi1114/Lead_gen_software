import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Check,
  PhoneCall,
  Users,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { Panel, PanelHeader } from "@/components/common/Panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TabPills, Toolbar } from "@/components/common/Toolbar";
import {
  getNotificationsForUser,
  getStoredReadNotificationIds,
  markNotificationsAsRead,
} from "@/lib/leadgen/data";

const TONE_CLASSES = {
  red: "border-red-300 bg-red-50/80 text-red-900 dark:bg-red-950/20",
  amber: "border-amber-300 bg-amber-50/80 text-amber-900 dark:bg-amber-950/20",
  blue: "border-blue-200 bg-blue-50/60 text-blue-900 dark:bg-blue-950/20",
  green: "border-emerald-200 bg-emerald-50/60 text-emerald-900 dark:bg-emerald-950/20",
};

export default function AdminNotificationsPage() {
  const [tab, setTab] = useState("all");
  const [readSet, setReadSet] = useState(() => getStoredReadNotificationIds());

  const notifications = useMemo(() => {
    return getNotificationsForUser("admin", "Sriram");
  }, []);

  useEffect(() => {
    const handleReadChange = () => {
      setReadSet(getStoredReadNotificationIds());
    };
    window.addEventListener(
      "leadgen_notifications_read_change",
      handleReadChange,
    );
    return () => {
      window.removeEventListener(
        "leadgen_notifications_read_change",
        handleReadChange,
      );
    };
  }, []);

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      const isUrgent =
        n.tone === "red" ||
        n.urgent ||
        (n.title && n.title.toLowerCase().includes("immediate"));
      if (tab === "urgent") return isUrgent;
      if (tab === "unread") return !readSet.has(String(n.id));
      return true;
    });
  }, [notifications, tab, readSet]);

  const markAllRead = () => {
    const updated = markNotificationsAsRead(notifications.map((n) => n.id));
    setReadSet(new Set(updated));
    toast.success("All admin notifications marked as read");
  };

  const markOneRead = (id) => {
    const updated = markNotificationsAsRead([id]);
    setReadSet(new Set(updated));
  };

  return (
    <Panel>
      <PanelHeader
        title="Admin Notifications & Activity"
        subtitle="Operational notifications, system alerts, and team reminders"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              onClick={markAllRead}
              className="gap-1.5 text-xs"
            >
              <Check className="size-3.5" /> Mark all read
            </Button>
          </div>
        }
      />

      <Toolbar>
        <TabPills
          value={tab}
          onChange={setTab}
          tabs={[
            {
              key: "all",
              label: "All Notifications",
              count: notifications.length,
            },
            {
              key: "urgent",
              label: "Urgent Alerts",
              count: notifications.filter(
                (n) =>
                  n.tone === "red" ||
                  n.urgent ||
                  (n.title && n.title.toLowerCase().includes("immediate")),
              ).length,
            },
            {
              key: "unread",
              label: "Unread",
              count: notifications.filter((n) => !readSet.has(String(n.id)))
                .length,
            },
          ]}
        />
      </Toolbar>

      <div className="p-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            <Bell className="mx-auto size-8 text-muted-foreground/50 mb-2" />
            No notifications in this category.
          </div>
        ) : (
          filtered.map((n) => {
            const isRead = readSet.has(String(n.id));
            const isUrgent =
              n.tone === "red" ||
              n.urgent ||
              (n.title && n.title.toLowerCase().includes("immediate"));

            return (
              <div
                key={n.id}
                className={`relative rounded-xl border p-4 transition-all shadow-xs ${
                  isUrgent
                    ? "border-red-300 bg-red-50/70 dark:bg-red-950/20"
                    : isRead
                      ? "border-border/60 bg-muted/20 opacity-80"
                      : "border-border bg-card"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-lg mt-0.5 ${
                        isUrgent
                          ? "bg-red-600 text-white shadow-xs"
                          : n.tone === "amber"
                            ? "bg-amber-500 text-white"
                            : "bg-primary/10 text-primary"
                      }`}
                    >
                      {isUrgent ? (
                        <ShieldAlert className="size-4" />
                      ) : n.tone === "amber" ? (
                        <AlertTriangle className="size-4" />
                      ) : (
                        <Bell className="size-4" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-foreground leading-snug">
                          {n.title}
                        </span>

                        {isUrgent && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 border border-red-300 px-2 py-0.5 text-[10px] font-bold text-red-700">
                            Action Needed
                          </span>
                        )}

                        {!isRead && (
                          <span className="size-2 rounded-full bg-destructive" />
                        )}
                      </div>

                      {n.message && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {n.message}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground/80 pt-1">
                        <Clock className="size-3" />
                        <span>{n.time || "Recent"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isRead && (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => markOneRead(n.id)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Dismiss
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Panel>
  );
}

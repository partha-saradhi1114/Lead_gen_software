import { useState } from "react";
import { BellRing, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { Panel, PanelHeader } from "@/components/common/Panel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FOLLOW_UPS, FOLLOW_UP_ITEMS, formatDate } from "@/lib/leadgen/data";
import { cn } from "@/lib/utils";

const BUCKETS = [
  {
    key: "overdue",
    label: "Overdue",
    dot: "bg-destructive",
    bar: "bg-destructive",
    text: "text-tint-red-foreground",
    tint: "bg-tint-red",
  },
  {
    key: "today",
    label: "Due Today",
    dot: "bg-warning",
    bar: "bg-warning",
    text: "text-tint-amber-foreground",
    tint: "bg-tint-amber",
  },
  {
    key: "soon",
    label: "Due in 1–3 Days",
    dot: "bg-primary",
    bar: "bg-primary",
    text: "text-tint-blue-foreground",
    tint: "bg-tint-blue",
  },
];

export function FollowUpCard() {
  const [open, setOpen] = useState(false);
  const total = FOLLOW_UPS.overdue + FOLLOW_UPS.today + FOLLOW_UPS.soon;
  return (
    <Panel className="h-full">
      <PanelHeader
        title="Follow-ups Due"
        icon={
          <div className="flex size-8 items-center justify-center rounded-lg max-2xl:xl:hidden bg-tint-red text-tint-red-foreground">
            <CalendarClock className="size-4" />
          </div>
        }
        actions={
          <Button variant="soft" size="xs" onClick={() => setOpen(true)}>
            View All
          </Button>
        }
      />
      <div className="flex flex-1 flex-col px-4 pb-4">
        <div className="flex items-baseline gap-2">
          <span className="num text-2xl font-bold">{total}</span>
          <span className="text-xs text-muted-foreground">
            Total pending follow-ups
          </span>
        </div>
        <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-muted">
          {BUCKETS.map((b) => (
            <div
              key={b.key}
              className={b.bar}
              style={{ width: `${(FOLLOW_UPS[b.key] / total) * 100}%` }}
            />
          ))}
        </div>
        <ul className="mt-3 space-y-1.5">
          {BUCKETS.map((b) => (
            <li
              key={b.key}
              className={cn(
                "flex items-center gap-2 rounded-md px-2.5 py-1.5",
                b.tint,
              )}
            >
              <span className={cn("size-2 rounded-full", b.dot)} />
              <span className="flex-1 text-[13px] font-medium">{b.label}</span>
              <span className={cn("num text-sm font-bold", b.text)}>
                {FOLLOW_UPS[b.key]}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 border-t pt-2.5">
          <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Most overdue
          </div>
          <ul className="space-y-1.5">
            {FOLLOW_UP_ITEMS.slice(0, 2).map((f) => (
              <li
                key={f.company}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {f.company}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {f.bde}
                  </span>
                </span>
                <span className="num shrink-0 font-semibold text-tint-red-foreground">
                  {formatDate(f.due).slice(0, 6)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pending follow-ups ({total})</DialogTitle>
            <DialogDescription>
              Most urgent follow-ups across all BDEs.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-[13px]">
              <thead className="bg-muted text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Company</th>
                  <th className="px-3 py-2 text-left">BDE</th>
                  <th className="px-3 py-2 text-left">Due</th>
                  <th className="px-3 py-2 text-right" />
                </tr>
              </thead>
              <tbody>
                {FOLLOW_UP_ITEMS.map((f) => {
                  const b = BUCKETS.find((x) => x.key === f.bucket);
                  return (
                    <tr key={f.company} className="border-t">
                      <td className="px-3 py-2">
                        <div className="font-medium">{f.company}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {f.contact}
                        </div>
                      </td>
                      <td className="px-3 py-2">{f.bde}</td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            b.tint,
                            b.text,
                          )}
                        >
                          {formatDate(f.due)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() =>
                            toast.success(`Reminder sent to ${f.bde}`)
                          }
                        >
                          <BellRing /> Remind
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </Panel>
  );
}

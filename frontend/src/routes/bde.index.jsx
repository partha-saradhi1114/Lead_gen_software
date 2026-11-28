import { Link } from "react-router-dom";
import {
  AlarmClock,
  CalendarCheck,
  Coins,
  Inbox,
  PhoneCall,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Panel, PanelHeader } from "@/components/common/Panel";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StageBadge } from "@/components/bde/StageBadge";
import { useBdeData } from "@/components/bde/useBdeData";
import { BDE_STAGES, normalizeStage } from "@/lib/leadgen/bde";
import { fmt, formatDate, pct } from "@/lib/leadgen/data";

export default function BdeDashboard() {
  const { kpis, rows, category, bde } = useBdeData();
  const due = rows
    .filter((r) => r.adminReminded || r.bucket === "overdue" || r.bucket === "today")
    .sort((a, b) => {
      if (a.adminReminded && !b.adminReminded) return -1;
      if (!a.adminReminded && b.adminReminded) return 1;
      const aDate = a.followUp?.on || "9999";
      const bDate = b.followUp?.on || "9999";
      return aDate < bDate ? -1 : 1;
    })
    .slice(0, 6);

  return (
    <div className="space-y-4">
      {/* Category Vertical Notice */}
      <div className="flex flex-col gap-2 rounded-lg border bg-card p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-md bg-tint-blue text-tint-blue-foreground font-semibold text-xs">
            🎓
          </span>
          <div>
            <div className="text-xs font-semibold text-foreground">
              Assigned Vertical:{" "}
              <span className="text-primary font-bold">{category}</span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              {bde} is currently assigned exclusively to {category} leads.
            </div>
          </div>
        </div>
        <span className="self-start rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 text-[11px] font-semibold sm:self-auto">
          {category}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="Assigned Leads"
          value={fmt(kpis.assigned)}
          icon={Users}
          tone="blue"
          hint={`${fmt(kpis.fresh)} new / uncontacted`}
        />
        <KpiCard
          label="Connected"
          value={fmt(kpis.connected)}
          icon={PhoneCall}
          tone="violet"
          hint={`${pct(kpis.connected, kpis.assigned).toFixed(1)}% of assigned`}
        />
        <KpiCard
          label="Interested"
          value={fmt(kpis.interested)}
          icon={Star}
          tone="amber"
          hint={`${fmt(kpis.converted)} converted`}
          hintTone="up"
        />
        <KpiCard
          label="Credits Available"
          value={fmt(kpis.available)}
          icon={Coins}
          tone="green"
          hint={`${fmt(kpis.used)} of ${fmt(kpis.allocated)} used`}
        />
        <KpiCard
          label="Overdue Follow-ups"
          value={fmt(kpis.overdue)}
          icon={AlarmClock}
          tone="red"
          hint="Past their due date"
          hintTone={kpis.overdue ? "down" : "muted"}
        />
        <KpiCard
          label="Due Today"
          value={fmt(kpis.today)}
          icon={CalendarCheck}
          tone="cyan"
          hint="Scheduled for today"
        />
        <KpiCard
          label="Upcoming"
          value={fmt(kpis.upcoming)}
          icon={Inbox}
          tone="blue"
          hint="Later follow-ups"
        />
        <KpiCard
          label="Converted"
          value={fmt(kpis.converted)}
          icon={Trophy}
          tone="green"
          hint={`${pct(kpis.converted, kpis.assigned).toFixed(1)}% conversion`}
          hintTone="up"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Panel className="min-w-0 xl:col-span-7">
          <PanelHeader
            title="Follow-ups needing attention"
            subtitle="Overdue and due today"
            actions={
              <Button asChild variant="soft" size="xs">
                <Link to="/bde/follow-ups">Open</Link>
              </Button>
            }
          />
          <ul className="divide-y px-4 pb-3">
            {due.map((r) => {
              const isReminded = Boolean(r.adminReminded);
              return (
                <li
                  key={r.leadId}
                  className={`flex items-center gap-3 py-2 px-2 rounded-lg transition-colors ${
                    isReminded
                      ? "bg-red-50/70 border border-red-200/80 my-1"
                      : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-[13px] font-semibold text-foreground">
                        {r.lead.company}
                      </span>
                      {isReminded && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 border border-red-300 px-2 py-0.5 text-[10px] font-bold text-red-700 shadow-xs">
                          ⚠️ Immediate action required!
                        </span>
                      )}
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground mt-0.5">
                      {r.lead.contact} · {r.followUp?.note || r.lead.notes || "Call requested by Admin"}
                    </div>
                  </div>
                  <StageBadge stage={r.stage} />
                  <span
                    className={
                      "whitespace-nowrap text-[11px] font-semibold " +
                      (isReminded || r.bucket === "overdue"
                        ? "text-destructive"
                        : "text-primary")
                    }
                  >
                    {isReminded
                      ? "Immediate !"
                      : r.bucket === "overdue"
                        ? `Overdue · ${formatDate(r.followUp?.on)}`
                        : "Today"}
                  </span>
                  {isReminded && (
                    <Button
                      asChild
                      size="xs"
                      variant="destructive"
                      className="h-6 text-[11px] px-2 gap-1 font-semibold"
                    >
                      <Link to="/bde/follow-ups">
                        <PhoneCall className="size-3" /> Call
                      </Link>
                    </Button>
                  )}
                </li>
              );
            })}
            {due.length === 0 && (
              <li className="py-6 text-center text-xs text-muted-foreground">
                You're all caught up.
              </li>
            )}
          </ul>
        </Panel>
        <Panel className="min-w-0 xl:col-span-5">
          <PanelHeader
            title="My pipeline"
            subtitle="Assigned leads by stage"
            actions={
              <Button asChild variant="soft" size="xs">
                <Link to="/bde/leads">View leads</Link>
              </Button>
            }
          />
          <div className="max-h-80 overflow-y-auto scrollbar-thin space-y-2.5 px-4 pb-4">
            {BDE_STAGES.filter(
              (s) =>
                rows.some(
                  (r) => normalizeStage(r.stage) === s || r.stage === s,
                ) ||
                [
                  "New",
                  "Connected – Interested",
                  "Meeting Scheduled",
                  "Converted",
                ].includes(s),
            ).map((s) => {
              const n = rows.filter(
                (r) => normalizeStage(r.stage) === s || r.stage === s,
              ).length;
              return (
                <div key={s} className="flex items-center gap-3">
                  <div className="w-44 shrink-0 truncate">
                    <StageBadge stage={s} />
                  </div>
                  <Progress value={pct(n, rows.length)} className="h-1.5" />
                  <span className="num w-8 text-right text-xs font-semibold">
                    {n}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
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
import { BDE_STAGES } from "@/lib/leadgen/bde";
import { fmt, formatDate, pct } from "@/lib/leadgen/data";
import { pageHead } from "@/lib/leadgen/head";

export const Route = createFileRoute("/bde/")({
  head: () =>
    pageHead(
      "BDE Dashboard",
      "Assigned leads, follow-ups and credit balance for business development executives.",
    ),
  component: BdeDashboard,
});

function BdeDashboard() {
  const { kpis, rows } = useBdeData();
  const due = rows
    .filter((r) => r.bucket === "overdue" || r.bucket === "today")
    .sort((a, b) => (a.followUp.on < b.followUp.on ? -1 : 1))
    .slice(0, 6);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="Assigned Leads"
          value={fmt(kpis.assigned)}
          icon={Users}
          tone="blue"
          hint={`${fmt(kpis.fresh)} not yet contacted`}
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
            {due.map((r) => (
              <li key={r.leadId} className="flex items-center gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold">{r.lead.company}</div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {r.lead.contact} · {r.followUp.note}
                  </div>
                </div>
                <StageBadge stage={r.stage} />
                <span
                  className={
                    "whitespace-nowrap text-[11px] font-semibold " +
                    (r.bucket === "overdue" ? "text-destructive" : "text-primary")
                  }
                >
                  {r.bucket === "overdue" ? `Overdue · ${formatDate(r.followUp.on)}` : "Today"}
                </span>
              </li>
            ))}
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
          <div className="space-y-2.5 px-4 pb-4">
            {BDE_STAGES.map((s) => {
              const n = rows.filter((r) => r.stage === s).length;
              return (
                <div key={s} className="flex items-center gap-3">
                  <div className="w-28 shrink-0">
                    <StageBadge stage={s} />
                  </div>
                  <Progress value={pct(n, rows.length)} className="h-1.5" />
                  <span className="num w-8 text-right text-xs font-semibold">{n}</span>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}

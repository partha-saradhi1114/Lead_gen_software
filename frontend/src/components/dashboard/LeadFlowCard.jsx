import { GitBranch } from "lucide-react";
import { Panel, PanelHeader } from "@/components/common/Panel";
import { useLeadGen } from "@/lib/leadgen/store";
import {
  FUNNEL_STATIC,
  STATUS_DISTRIBUTION,
  fmt,
  pct,
} from "@/lib/leadgen/data";
import { FunnelChart } from "./FunnelChart";
import { DonutChart } from "./DonutChart";

export function LeadFlowCard() {
  const { state, kpis } = useLeadGen();
  const leads = state?.leads || [];

  const total = kpis?.total || leads.length || 0;
  const approved =
    kpis?.approved ?? leads.filter((l) => l.status === "approved").length;

  // Real stage counts from leads
  const viewedCount = leads.filter(
    (l) => l.stage && l.stage !== "new" && l.stage !== "uploaded",
  ).length;
  const viewed =
    viewedCount > 0
      ? viewedCount
      : Math.min(approved, Math.max(1, Math.round(approved * 0.8)));

  const connectedCount = leads.filter((l) =>
    ["connected", "interested", "converted", "follow-up"].includes(
      String(l.stage).toLowerCase(),
    ),
  ).length;
  const connected =
    connectedCount > 0
      ? connectedCount
      : Math.min(viewed, Math.max(1, Math.round(viewed * 0.7)));

  const interestedCount = leads.filter((l) =>
    ["interested", "converted"].includes(String(l.stage).toLowerCase()),
  ).length;
  const interested =
    interestedCount > 0
      ? interestedCount
      : Math.min(connected, Math.max(1, Math.round(connected * 0.45)));

  const stages = [
    { label: "Uploaded", value: total },
    { label: "Approved", value: approved },
    { label: "Viewed", value: viewed },
    { label: "Connected", value: connected },
    { label: "Interested", value: interested },
  ];
  const overall = total > 0 ? pct(interested, total) : 0;

  // Dynamic status distribution from real leads
  const stagesCount = {
    connected: 0,
    outOfCoverage: 0,
    interested: 0,
    notInterested: 0,
    followUp: 0,
  };

  leads.forEach((l) => {
    const s = String(l.stage || "").toLowerCase();
    if (s === "connected") stagesCount.connected++;
    else if (
      s === "out-of-coverage" ||
      s === "out_of_coverage" ||
      s === "temporarily unavailable" ||
      s === "temporarily_unavailable" ||
      s === "temporarily-unavailable"
    )
      stagesCount.outOfCoverage++;
    else if (s === "interested" || s === "converted") stagesCount.interested++;
    else if (
      s === "not interested" ||
      s === "not_interested" ||
      s === "rejected"
    )
      stagesCount.notInterested++;
    else if (
      s === "follow-up" ||
      s === "follow_up" ||
      s === "awaiting response" ||
      s === "awaiting_response" ||
      s === "awaiting-response"
    )
      stagesCount.followUp++;
  });

  const totalStageLeads = Object.values(stagesCount).reduce((a, b) => a + b, 0);
  const statusData =
    totalStageLeads > 0
      ? [
          {
            label: "Connected",
            value: stagesCount.connected,
            share: pct(stagesCount.connected, totalStageLeads),
            tone: "blue",
          },
          {
            label: "Out of Coverage",
            value: stagesCount.outOfCoverage,
            share: pct(stagesCount.outOfCoverage, totalStageLeads),
            tone: "cyan",
          },
          {
            label: "Interested",
            value: stagesCount.interested,
            share: pct(stagesCount.interested, totalStageLeads),
            tone: "green",
          },
          {
            label: "Not Interested",
            value: stagesCount.notInterested,
            share: pct(stagesCount.notInterested, totalStageLeads),
            tone: "red",
          },
          {
            label: "Follow-up",
            value: stagesCount.followUp,
            share: pct(stagesCount.followUp, totalStageLeads),
            tone: "amber",
          },
        ]
      : STATUS_DISTRIBUTION;

  return (
    <Panel className="h-full">
      <PanelHeader
        title="Lead Flow & Status Conversion"
        subtitle="From upload to interested prospect"
        icon={
          <div className="flex size-8 items-center justify-center rounded-lg bg-tint-blue text-tint-blue-foreground">
            <GitBranch className="size-4" />
          </div>
        }
        actions={
          <span className="num hidden rounded-md bg-tint-green px-2 py-1 text-[11px] font-semibold text-tint-green-foreground sm:inline">
            {overall.toFixed(1)}% overall conversion
          </span>
        }
      />
      <div className="grid flex-1 gap-4 px-4 pb-4 pt-1 md:grid-cols-[1.25fr_1fr]">
        <div>
          <div className="mb-2 flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <span>Lead Funnel</span>
            <span>Drop-off</span>
          </div>
          <FunnelChart stages={stages} />
          <div className="mt-3 grid grid-cols-3 gap-2 border-t pt-3 text-center">
            <div>
              <div className="num text-sm font-bold">
                {pct(approved, total).toFixed(1)}%
              </div>
              <div className="text-[11px] text-muted-foreground">
                Approval rate
              </div>
            </div>
            <div>
              <div className="num text-sm font-bold">
                {pct(connected, viewed || 1).toFixed(1)}%
              </div>
              <div className="text-[11px] text-muted-foreground">
                Connect rate
              </div>
            </div>
            <div>
              <div className="num text-sm font-bold">{fmt(interested)}</div>
              <div className="text-[11px] text-muted-foreground">
                Interested
              </div>
            </div>
          </div>
        </div>
        <div className="border-t pt-3 md:border-l md:border-t-0 md:pl-4 md:pt-0">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            BDE Lead Status Distribution
          </div>
          <DonutChart data={statusData} centerLabel="Active leads" />
        </div>
      </div>
    </Panel>
  );
}

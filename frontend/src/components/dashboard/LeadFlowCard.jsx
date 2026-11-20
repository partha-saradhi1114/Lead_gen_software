import { GitBranch } from "lucide-react";
import { Panel, PanelHeader } from "@/components/common/Panel";
import { useLeadGen } from "@/lib/leadgen/store";
import { FUNNEL_STATIC, STATUS_DISTRIBUTION, fmt, pct } from "@/lib/leadgen/data";
import { FunnelChart } from "./FunnelChart";
import { DonutChart } from "./DonutChart";

export function LeadFlowCard() {
  const { kpis } = useLeadGen();
  const stages = [
    { label: "Uploaded", value: kpis.total },
    { label: "Approved", value: kpis.approved },
    { label: "Viewed", value: FUNNEL_STATIC.viewed },
    { label: "Connected", value: FUNNEL_STATIC.connected },
    { label: "Interested", value: FUNNEL_STATIC.interested },
  ];
  const overall = pct(FUNNEL_STATIC.interested, kpis.total);

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
                {pct(kpis.approved, kpis.total).toFixed(1)}%
              </div>
              <div className="text-[11px] text-muted-foreground">Approval rate</div>
            </div>
            <div>
              <div className="num text-sm font-bold">
                {pct(FUNNEL_STATIC.connected, FUNNEL_STATIC.viewed).toFixed(1)}%
              </div>
              <div className="text-[11px] text-muted-foreground">Connect rate</div>
            </div>
            <div>
              <div className="num text-sm font-bold">{fmt(FUNNEL_STATIC.interested)}</div>
              <div className="text-[11px] text-muted-foreground">Interested</div>
            </div>
          </div>
        </div>
        <div className="border-t pt-3 md:border-l md:border-t-0 md:pl-4 md:pt-0">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            BDE Lead Status Distribution
          </div>
          <DonutChart data={STATUS_DISTRIBUTION} centerLabel="Viewed leads" />
        </div>
      </div>
    </Panel>
  );
}

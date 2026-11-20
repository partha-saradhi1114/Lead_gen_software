import { CheckCircle2, Clock, Coins, Database, TrendingUp, Users, XCircle } from "lucide-react";
import { useLeadGen } from "@/lib/leadgen/store";
import { fmt, pct } from "@/lib/leadgen/data";
import { KpiCard } from "./KpiCard";

export function KpiRow() {
  const { kpis } = useLeadGen();
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
      <KpiCard
        label="Total Leads"
        value={fmt(kpis.total)}
        icon={Users}
        tone="blue"
        hint="↑ 12.4% vs prev."
        hintTone="up"
      />
      <KpiCard
        label="Pending Review"
        value={fmt(kpis.pending)}
        icon={Clock}
        tone="amber"
        hint={`${pct(kpis.pending, kpis.total).toFixed(1)}% of total`}
      />
      <KpiCard
        label="Approved Leads"
        value={fmt(kpis.approved)}
        icon={CheckCircle2}
        tone="green"
        hint={`${pct(kpis.approved, kpis.total).toFixed(1)}% approval`}
        hintTone="up"
      />
      <KpiCard
        label="Rejected Leads"
        value={fmt(kpis.rejected)}
        icon={XCircle}
        tone="red"
        hint={`${pct(kpis.rejected, kpis.total).toFixed(1)}% of total`}
        hintTone="down"
      />
      <KpiCard
        label="Credits Allocated"
        value={fmt(kpis.creditsAllocated)}
        icon={Database}
        tone="blue"
        hint={`${fmt(kpis.creditsAvailable)} available`}
      />
      <KpiCard
        label="Credits Used"
        value={fmt(kpis.creditsUsed)}
        icon={Coins}
        tone="violet"
        hint="↑ 8.1% vs prev."
        hintTone="up"
      />
      <KpiCard
        label="Lead Utilization"
        value={`${kpis.utilization}%`}
        icon={TrendingUp}
        tone="cyan"
        hint="Used / allocated"
      />
    </div>
  );
}

import { KpiRow } from "@/components/dashboard/KpiRow";
import { LeadFlowCard } from "@/components/dashboard/LeadFlowCard";
import { TeamPerformanceCard } from "@/components/dashboard/TeamPerformanceCard";
import { RaPerformanceCard } from "@/components/dashboard/RaPerformanceCard";
import { FollowUpCard } from "@/components/dashboard/FollowUpCard";
import { CreditSummaryCard } from "@/components/dashboard/CreditSummaryCard";
import { LeadReviewTable } from "@/components/dashboard/LeadReviewTable";
import { QuickActions } from "@/components/dashboard/QuickActions";

export default function Dashboard() {
  return (
    <div className="space-y-4">
      <KpiRow />
      <div className="grid gap-4 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-6 2xl:col-span-7">
          <LeadFlowCard />
        </div>
        <div className="min-w-0 xl:col-span-6 2xl:col-span-5">
          <TeamPerformanceCard />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
        <div className="min-w-0 md:col-span-2 xl:col-span-6">
          <RaPerformanceCard />
        </div>
        <div className="xl:col-span-3">
          <FollowUpCard />
        </div>
        <div className="xl:col-span-3">
          <CreditSummaryCard />
        </div>
      </div>
      <div className="grid gap-4 min-[1680px]:grid-cols-[minmax(0,1fr)_280px]">
        <LeadReviewTable className="min-w-0" />
        <QuickActions />
      </div>
    </div>
  );
}

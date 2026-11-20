import { CreditSummaryCard } from "@/components/dashboard/CreditSummaryCard";
import { TeamPerformanceCard } from "@/components/dashboard/TeamPerformanceCard";

export default function CreditsPage() {
  return (
    <div className="grid gap-4 xl:grid-cols-12">
      <div className="xl:col-span-4">
        <CreditSummaryCard />
      </div>
      <div className="xl:col-span-8">
        <TeamPerformanceCard />
      </div>
    </div>
  );
}

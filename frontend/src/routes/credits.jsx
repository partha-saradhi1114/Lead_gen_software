import { createFileRoute } from "@tanstack/react-router";
import { CreditSummaryCard } from "@/components/dashboard/CreditSummaryCard";
import { TeamPerformanceCard } from "@/components/dashboard/TeamPerformanceCard";
import { pageHead } from "@/lib/leadgen/head";

export const Route = createFileRoute("/credits")({
  head: () => pageHead("BDE Credit Management", "Allocate and track lead credits for every BDE."),
  component: () => (
    <div className="grid gap-4 xl:grid-cols-12">
      <div className="xl:col-span-4">
        <CreditSummaryCard />
      </div>
      <div className="xl:col-span-8">
        <TeamPerformanceCard />
      </div>
    </div>
  ),
});

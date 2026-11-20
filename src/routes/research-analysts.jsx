import { createFileRoute } from "@tanstack/react-router";
import { RaPerformanceCard } from "@/components/dashboard/RaPerformanceCard";
import { PlaceholderPage } from "@/components/common/PlaceholderPage";
import { pageHead } from "@/lib/leadgen/head";

export const Route = createFileRoute("/research-analysts")({
  head: () =>
    pageHead("Research Analysts", "Upload volume and approval quality for each research analyst."),
  component: () => (
    <PlaceholderPage
      title="Full Research Analyst module is coming next"
      description="Detailed researcher workspaces, targets and quality audits arrive in a later iteration."
    >
      <RaPerformanceCard />
    </PlaceholderPage>
  ),
});

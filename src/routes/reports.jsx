import { createFileRoute } from "@tanstack/react-router";
import { LeadFlowCard } from "@/components/dashboard/LeadFlowCard";
import { PlaceholderPage } from "@/components/common/PlaceholderPage";
import { pageHead } from "@/lib/leadgen/head";

export const Route = createFileRoute("/reports")({
  head: () =>
    pageHead(
      "Reports & Analytics",
      "Funnel, conversion and team performance reports for LeadGen Pro.",
    ),
  component: () => (
    <PlaceholderPage
      title="Detailed reports are coming next"
      description="Exportable reports, trends and custom dashboards arrive in a later iteration."
    >
      <LeadFlowCard />
    </PlaceholderPage>
  ),
});

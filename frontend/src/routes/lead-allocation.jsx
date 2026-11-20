import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/common/PlaceholderPage";
import { pageHead } from "@/lib/leadgen/head";

export const Route = createFileRoute("/lead-allocation")({
  head: () =>
    pageHead("Lead Allocation", "Distribute approved leads to business development executives."),
  component: () => (
    <PlaceholderPage
      title="Lead Allocation is coming next"
      description="Assign approved leads to BDEs in bulk or by rules. This screen will be built in the next iteration."
    />
  ),
});

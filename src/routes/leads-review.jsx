import { createFileRoute } from "@tanstack/react-router";
import { LeadReviewTable } from "@/components/dashboard/LeadReviewTable";
import { pageHead } from "@/lib/leadgen/head";

export const Route = createFileRoute("/leads-review")({
  head: () => pageHead("Leads Review", "Approve or reject leads uploaded by research analysts."),
  component: () => <LeadReviewTable pageSize={12} />,
});

import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/common/PlaceholderPage";
import { pageHead } from "@/lib/leadgen/head";

export const Route = createFileRoute("/settings")({
  head: () => pageHead("Settings", "Workspace, credit and approval settings for LeadGen Pro."),
  component: () => (
    <PlaceholderPage
      title="Settings are coming next"
      description="Workspace preferences, credit rules and approval policies arrive in a later iteration."
    />
  ),
});

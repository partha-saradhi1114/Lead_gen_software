import { createFileRoute } from "@tanstack/react-router";
import { FollowUpCard } from "@/components/dashboard/FollowUpCard";
import { PlaceholderPage } from "@/components/common/PlaceholderPage";
import { pageHead } from "@/lib/leadgen/head";

export const Route = createFileRoute("/operations")({
  head: () => pageHead("Operations", "Follow-ups and day-to-day lead operations across the team."),
  component: () => (
    <PlaceholderPage
      title="Operations workspace is coming next"
      description="Call schedules, escalations and daily stand-up views arrive in a later iteration."
    >
      <div className="max-w-md">
        <FollowUpCard />
      </div>
    </PlaceholderPage>
  ),
});

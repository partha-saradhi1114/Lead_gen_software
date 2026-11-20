import { FollowUpCard } from "@/components/dashboard/FollowUpCard";
import { PlaceholderPage } from "@/components/common/PlaceholderPage";

export default function OperationsPage() {
  return (
    <PlaceholderPage
      title="Operations workspace is coming next"
      description="Call schedules, escalations and daily stand-up views arrive in a later iteration."
    >
      <div className="max-w-md">
        <FollowUpCard />
      </div>
    </PlaceholderPage>
  );
}

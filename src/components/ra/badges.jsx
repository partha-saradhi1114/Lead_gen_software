import { cn } from "@/lib/utils";

const BATCH = {
  Draft: "bg-muted text-muted-foreground",
  Uploaded: "bg-tint-cyan text-tint-cyan-foreground",
  "Under Review": "bg-tint-amber text-tint-amber-foreground",
  "Partially Approved": "bg-tint-blue text-tint-blue-foreground",
  Approved: "bg-tint-green text-tint-green-foreground",
  Rejected: "bg-tint-red text-tint-red-foreground",
};

export function BatchStatusBadge({ status }) {
  return (
    <span
      className={cn(
        "whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold",
        BATCH[status],
      )}
    >
      {status}
    </span>
  );
}

export const BATCH_STATUSES = Object.keys(BATCH);

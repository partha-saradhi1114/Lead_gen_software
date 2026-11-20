import { cn } from "@/lib/utils";

const TONE = {
  New: "bg-tint-blue text-tint-blue-foreground",
  Contacted: "bg-tint-cyan text-tint-cyan-foreground",
  Connected: "bg-tint-violet text-tint-violet-foreground",
  Interested: "bg-tint-amber text-tint-amber-foreground",
  "Not Interested": "bg-tint-red text-tint-red-foreground",
  Converted: "bg-tint-green text-tint-green-foreground",
};

export function StageBadge({ stage }) {
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold",
        TONE[stage],
      )}
    >
      {stage}
    </span>
  );
}

/** Hides most of a phone/email until the BDE spends a credit to unlock it. */
export const mask = (v) => (v ? v.slice(0, 4) + "•••••" + v.slice(-2) : "—");

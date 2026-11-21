import { cn } from "@/lib/utils";

const TONES = {
  blue: "bg-tint-blue text-tint-blue-foreground",
  amber: "bg-tint-amber text-tint-amber-foreground",
  green: "bg-tint-green text-tint-green-foreground",
  red: "bg-tint-red text-tint-red-foreground",
  violet: "bg-tint-violet text-tint-violet-foreground",
  cyan: "bg-tint-cyan text-tint-cyan-foreground",
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
  hint,
  hintTone = "muted",
}) {
  return (
    <div className="panel min-w-0 px-3.5 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="num pt-1 text-[22px] font-bold leading-none tracking-tight">
          {value}
        </div>
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg",
            TONES[tone],
          )}
        >
          <Icon className="size-4" strokeWidth={2.2} />
        </div>
      </div>
      <div className="mt-1.5 truncate text-xs font-medium text-muted-foreground">
        {label}
      </div>
      <div>
        {hint && (
          <div
            className={cn(
              "mt-1 truncate text-[11px] font-medium",
              hintTone === "up" && "text-success",
              hintTone === "down" && "text-destructive",
              hintTone === "muted" && "text-muted-foreground",
            )}
          >
            {hint}
          </div>
        )}
      </div>
    </div>
  );
}

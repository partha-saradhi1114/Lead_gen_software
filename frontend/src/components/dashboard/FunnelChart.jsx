import { ArrowDownRight } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fmt, pct } from "@/lib/leadgen/data";

const FILLS = [
  "bg-funnel-1",
  "bg-funnel-2",
  "bg-funnel-3",
  "bg-funnel-4",
  "bg-funnel-5",
];

export function FunnelChart({ stages }) {
  const top = stages[0]?.value ?? 0;
  return (
    <div className="space-y-1.5">
      {stages.map((s, i) => {
        const share = pct(s.value, top);
        const width = Math.max(30, share);
        const prev = i > 0 ? (stages[i - 1]?.value ?? null) : null;
        const drop = prev ? 100 - pct(s.value, prev) : null;
        return (
          <div
            key={s.label}
            className="grid grid-cols-[74px_1fr_64px] items-center gap-2"
          >
            <span className="text-xs font-medium text-muted-foreground">
              {s.label}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center">
                  <div
                    className={`${FILLS[i % FILLS.length]} flex h-8 cursor-default items-center justify-center rounded-md text-[13px] font-bold text-primary-foreground transition-[width,filter] duration-500 hover:brightness-110`}
                    style={{
                      width: `${width}%`,
                      clipPath: "polygon(0 0, 100% 0, 97% 100%, 3% 100%)",
                    }}
                  >
                    <span className="num">{fmt(s.value)}</span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <div className="font-semibold">
                  {s.label}: {fmt(s.value)}
                </div>
                <div>{share.toFixed(1)}% of uploaded</div>
                {prev !== null && (
                  <div>
                    {pct(s.value, prev).toFixed(1)}% from previous stage
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
            <span className="num text-right text-[11px] font-semibold">
              {drop === null ? (
                <span className="text-muted-foreground">100%</span>
              ) : (
                <span className="inline-flex items-center gap-0.5 text-destructive">
                  <ArrowDownRight className="size-3" />
                  {drop.toFixed(1)}%
                </span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

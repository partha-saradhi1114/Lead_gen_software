import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Pager({ current, pages, onChange }) {
  const nums = [];
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - current) <= 1) nums.push(p);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon-xs"
        disabled={current === 1}
        onClick={() => onChange(current - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft />
      </Button>
      {nums.map((n, i) =>
        n === "…" ? (
          <span key={`e${i}`} className="px-1">
            …
          </span>
        ) : (
          <Button
            key={n}
            size="icon-xs"
            variant={n === current ? "default" : "ghost"}
            className="num w-auto min-w-7 px-1.5 text-xs"
            onClick={() => onChange(n)}
          >
            {n}
          </Button>
        ),
      )}
      <Button
        variant="outline"
        size="icon-xs"
        disabled={current === pages}
        onClick={() => onChange(current + 1)}
        aria-label="Next page"
      >
        <ChevronRight />
      </Button>
    </div>
  );
}

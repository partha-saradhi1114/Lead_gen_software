import { cn } from "@/lib/utils";

/** Compact data table used across dashboard performance panels. */
export function PerformanceTable({
  columns,
  rows,
  rowKey,
  showTotal,
  maxHeight,
  className,
}) {
  const isScrollable = Boolean(maxHeight);

  return (
    <div
      className={cn(
        "overflow-x-auto",
        isScrollable && "overflow-y-auto scrollbar-thin relative",
        className,
      )}
      style={maxHeight ? { maxHeight } : undefined}
    >
      <table className="w-full text-[13px] border-collapse">
        <thead className={isScrollable ? "sticky top-0 z-10" : undefined}>
          <tr className="bg-muted/90 backdrop-blur-md text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border/70">
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  "px-2 py-2 align-bottom font-semibold leading-tight first:pl-4 last:pr-4",
                  c.align === "right" ? "text-right" : "text-left",
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={rowKey(r)}
              className="border-b border-border/70 transition-colors hover:bg-muted/40"
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    "num whitespace-nowrap px-2 py-2.5 first:pl-4 last:pr-4",
                    c.align === "right" && "text-right",
                  )}
                >
                  {c.render(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {showTotal && (
          <tfoot className={isScrollable ? "sticky bottom-0 z-10" : undefined}>
            <tr className="bg-muted/95 backdrop-blur-md font-semibold border-t border-border/80 shadow-xs">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    "num whitespace-nowrap px-2 py-2.5 first:pl-4 last:pr-4",
                    c.align === "right" && "text-right",
                  )}
                >
                  {c.total}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

export function RatePill({ value, tone = "green" }) {
  return (
    <span
      className={cn(
        "num inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
        tone === "green"
          ? "bg-tint-green text-tint-green-foreground"
          : "bg-tint-blue text-tint-blue-foreground",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          tone === "green" ? "bg-success" : "bg-primary",
        )}
      />
      {value.toFixed(1)}%
    </span>
  );
}

export function PersonCell({ name, sub }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[10px] font-bold text-primary">
        {initials}
      </span>
      <div className="leading-tight">
        <div className="font-medium">{name}</div>
        {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { fmt } from "@/lib/leadgen/data";
import { cn } from "@/lib/utils";
import { Pager } from "./Pager";

export function EmptyState({ title, hint, action }) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Inbox className="size-5" />
      </div>
      <div className="mt-3 text-sm font-semibold">{title}</div>
      {hint && (
        <div className="mt-1 max-w-sm text-xs text-muted-foreground">
          {hint}
        </div>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Paginated compact table with loading skeleton and empty state. Resets to page 1 when `resetKey` changes. */
export function DataTable({
  columns,
  rows,
  rowKey,
  pageSize = 10,
  resetKey,
  empty,
  rowClassName,
}) {
  const hydrated = true;
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [resetKey]);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pages);
  const visible = rows.slice((current - 1) * pageSize, current * pageSize);

  return (
    <div className="min-w-0 max-w-full">
      <div className="max-w-full overflow-x-auto overscroll-x-contain">
        <table className="w-full min-w-max text-[13px]">
          <thead>
            <tr className="bg-muted/70 text-[11px] uppercase tracking-wide text-muted-foreground">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    "whitespace-nowrap px-2.5 py-2 font-semibold first:pl-4 last:pr-4",
                    c.align === "right" ? "text-right" : "text-left",
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!hydrated
              ? Array.from({ length: Math.min(pageSize, 6) }, (_, i) => (
                  <tr key={i} className="border-b border-border/70">
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className="px-2.5 py-3 first:pl-4 last:pr-4"
                      >
                        <Skeleton className="h-3.5 w-full max-w-28" />
                      </td>
                    ))}
                  </tr>
                ))
              : visible.map((r) => (
                  <tr
                    key={rowKey(r)}
                    className={cn(
                      "border-b border-border/70 transition-colors hover:bg-muted/40",
                      rowClassName?.(r),
                    )}
                  >
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={cn(
                          "num px-2.5 py-2 first:pl-4 last:pr-4",
                          c.align === "right" && "text-right",
                          c.className,
                        )}
                      >
                        {c.render(r)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
        {hydrated &&
          rows.length === 0 &&
          (empty ?? (
            <EmptyState
              title="Nothing to show"
              hint="Try changing your search or filters."
            />
          ))}
      </div>
      {rows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-xs text-muted-foreground">
          <span className="num">
            Showing {(current - 1) * pageSize + 1}–
            {Math.min(current * pageSize, rows.length)} of {fmt(rows.length)}
          </span>
          <Pager current={current} pages={pages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}

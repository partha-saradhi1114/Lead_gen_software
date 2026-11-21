import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { fmt } from "@/lib/leadgen/data";

function DonutTooltip({ active, payload }) {
  const s = payload?.[0]?.payload;
  if (!active || !s) return null;
  return (
    <div className="rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-pop">
      <div className="flex items-center gap-1.5 font-semibold">
        <span className="size-2 rounded-full" style={{ background: s.color }} />
        {s.label}
      </div>
      <div className="num text-muted-foreground">
        {s.percent}% · {fmt(s.count)} leads
      </div>
    </div>
  );
}

export function DonutChart({ data, centerLabel }) {
  const total = data.reduce((a, d) => a + d.count, 0);
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center xl:flex-col 2xl:flex-row">
      <div className="relative size-[150px] shrink-0">
        {/* Recharts generates random clip ids, so render it only in the browser to avoid hydration mismatches. */}
        <PieChart width={150} height={150}>
          <Pie
            data={data}
            dataKey="count"
            nameKey="label"
            innerRadius={48}
            outerRadius={72}
            paddingAngle={2}
            stroke="none"
            isAnimationActive={false}
          >
            {data.map((d) => (
              <Cell key={d.key} fill={d.color} />
            ))}
          </Pie>
          <Tooltip content={<DonutTooltip />} wrapperStyle={{ zIndex: 10 }} />
        </PieChart>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="num text-lg font-bold leading-none">
            {fmt(total)}
          </span>
          <span className="mt-0.5 text-[10px] text-muted-foreground">
            {centerLabel}
          </span>
        </div>
      </div>
      <ul className="w-full min-w-0 flex-1 space-y-1.5">
        {data.map((d) => (
          <li key={d.key} className="flex items-center gap-2 text-xs">
            <span
              className="size-2.5 shrink-0 rounded-sm"
              style={{ background: d.color }}
            />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">
              {d.label}
            </span>
            <span className="num font-semibold">{d.percent}%</span>
            <span className="num w-9 text-right text-muted-foreground">
              {fmt(d.count)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

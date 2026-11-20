import { useState } from "react";
import { Coins, Database, Wallet } from "lucide-react";
import { Panel, PanelHeader } from "@/components/common/Panel";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLeadGen } from "@/lib/leadgen/store";
import { fmt, pct } from "@/lib/leadgen/data";

export function CreditSummaryCard() {
  const { kpis, state } = useLeadGen();
  const [open, setOpen] = useState(false);
  const rows = [
    {
      label: "Total Credits",
      value: kpis.creditsAllocated,
      icon: Database,
      cls: "bg-tint-blue text-tint-blue-foreground",
    },
    {
      label: "Credits Used",
      value: kpis.creditsUsed,
      icon: Coins,
      cls: "bg-tint-violet text-tint-violet-foreground",
    },
    {
      label: "Credits Available",
      value: kpis.creditsAvailable,
      icon: Wallet,
      cls: "bg-tint-green text-tint-green-foreground",
    },
  ];
  return (
    <Panel className="h-full">
      <PanelHeader
        title="Credit Summary"
        icon={
          <div className="flex size-8 items-center justify-center rounded-lg max-2xl:xl:hidden bg-tint-blue text-tint-blue-foreground">
            <Database className="size-4" />
          </div>
        }
        actions={
          <Button variant="soft" size="xs" onClick={() => setOpen(true)}>
            View Details
          </Button>
        }
      />
      <div className="flex flex-1 flex-col px-4 pb-4">
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center gap-2.5">
              <span className={`flex size-7 items-center justify-center rounded-md ${r.cls}`}>
                <r.icon className="size-3.5" />
              </span>
              <span className="flex-1 text-[13px] text-muted-foreground">{r.label}</span>
              <span className="num text-sm font-bold">{fmt(r.value)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1.5 border-t pt-2.5">
          <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Usage by BDE
          </div>
          {[...state.bdes]
            .sort((a, b) => pct(b.used, b.allocated) - pct(a.used, a.allocated))
            .slice(0, 3)
            .map((b) => (
              <div key={b.name} className="flex items-center gap-2 text-xs">
                <span className="w-20 truncate">{b.name}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-tint-violet-foreground"
                    style={{ width: `${pct(b.used, b.allocated)}%` }}
                  />
                </div>
                <span className="num w-9 text-right font-semibold">
                  {Math.round(pct(b.used, b.allocated))}%
                </span>
              </div>
            ))}
        </div>
        <div className="mt-auto pt-3">
          <div className="mb-1 flex justify-between text-[11px]">
            <span className="text-muted-foreground">Utilization</span>
            <span className="num font-semibold">{kpis.utilization}%</span>
          </div>
          <Progress value={kpis.utilization} className="h-2" />
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Credit breakdown by BDE</DialogTitle>
            <DialogDescription>
              {fmt(kpis.creditsUsed)} of {fmt(kpis.creditsAllocated)} credits used across the team.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-3">
            {state.bdes.map((b) => (
              <li key={b.name}>
                <div className="mb-1 flex justify-between text-[13px]">
                  <span className="font-medium">{b.name}</span>
                  <span className="num text-muted-foreground">
                    {fmt(b.used)} / {fmt(b.allocated)}
                  </span>
                </div>
                <Progress value={pct(b.used, b.allocated)} className="h-1.5" />
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </Panel>
  );
}

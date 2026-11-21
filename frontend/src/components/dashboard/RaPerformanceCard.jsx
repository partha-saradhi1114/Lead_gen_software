import { useState } from "react";
import { Eye, Microscope } from "lucide-react";
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
import { RA_EXTENDED, fmt, formatDate, pct } from "@/lib/leadgen/data";
import { PerformanceTable, PersonCell, RatePill } from "./PerformanceTable";

export function RaPerformanceCard() {
  const [selected, setSelected] = useState(null);
  const cols = [
    {
      key: "name",
      header: "RA Name",
      render: (r) => <PersonCell name={r.name} />,
    },
    {
      key: "up",
      header: "Uploaded",
      align: "right",
      render: (r) => fmt(r.uploaded),
    },
    {
      key: "ap",
      header: "Approved",
      align: "right",
      render: (r) => fmt(r.approved),
    },
    {
      key: "rj",
      header: "Rejected",
      align: "right",
      render: (r) => fmt(r.rejected),
    },
    {
      key: "rate",
      header: "Approval Rate",
      align: "right",
      render: (r) => (
        <RatePill value={pct(r.approved, r.uploaded)} tone="blue" />
      ),
    },
    {
      key: "act",
      header: "",
      align: "right",
      render: (r) => (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`View ${r.name}`}
          onClick={() => setSelected(r)}
        >
          <Eye className="text-muted-foreground" />
        </Button>
      ),
    },
  ];
  return (
    <Panel className="h-full">
      <PanelHeader
        title="Research Analyst Performance"
        subtitle="Upload quality by researcher"
        icon={
          <div className="flex size-8 items-center justify-center rounded-lg bg-tint-violet text-tint-violet-foreground">
            <Microscope className="size-4" />
          </div>
        }
        actions={
          <Button
            variant="soft"
            size="xs"
            onClick={() => setSelected(RA_EXTENDED[0] ?? null)}
          >
            View Details
          </Button>
        }
      />
      <PerformanceTable
        columns={cols}
        rows={RA_EXTENDED}
        rowKey={(r) => r.name}
      />
      <RaDetailsDialog
        ra={selected}
        onClose={() => setSelected(null)}
        onSelect={setSelected}
      />
    </Panel>
  );
}

function RaDetailsDialog({ ra, onClose, onSelect }) {
  const { state } = useLeadGen();
  const recent = ra
    ? state.leads.filter((l) => l.uploadedBy === ra.name).slice(0, 5)
    : [];
  return (
    <Dialog open={!!ra} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        {ra && (
          <>
            <DialogHeader>
              <DialogTitle>{ra.name} · Research Analyst</DialogTitle>
              <DialogDescription>
                Upload quality and latest submissions.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-wrap gap-1.5">
              {RA_EXTENDED.map((r) => (
                <Button
                  key={r.name}
                  size="xs"
                  variant={r.name === ra.name ? "default" : "outline"}
                  onClick={() => onSelect(r)}
                >
                  {r.name}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                ["Uploaded", ra.uploaded],
                ["Approved", ra.approved],
                ["Rejected", ra.rejected],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-muted p-3">
                  <div className="num text-lg font-bold">{fmt(v)}</div>
                  <div className="text-xs text-muted-foreground">{k}</div>
                </div>
              ))}
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-muted-foreground">Approval rate</span>
                <span className="num font-semibold">
                  {pct(ra.approved, ra.uploaded).toFixed(1)}%
                </span>
              </div>
              <Progress value={pct(ra.approved, ra.uploaded)} className="h-2" />
            </div>
            <div>
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Latest uploads
              </div>
              <ul className="divide-y rounded-lg border text-[13px]">
                {recent.map((l) => (
                  <li
                    key={l.id}
                    className="flex items-center justify-between gap-2 px-3 py-2"
                  >
                    <span className="truncate font-medium">{l.company}</span>
                    <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                      {formatDate(l.uploadedOn)}
                      <StatusBadge status={l.status} />
                    </span>
                  </li>
                ))}
                {recent.length === 0 && (
                  <li className="px-3 py-3 text-xs text-muted-foreground">
                    No uploads yet.
                  </li>
                )}
              </ul>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function StatusBadge({ status }) {
  const cls =
    status === "pending"
      ? "bg-tint-amber text-tint-amber-foreground"
      : status === "approved"
        ? "bg-tint-green text-tint-green-foreground"
        : "bg-tint-red text-tint-red-foreground";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${cls}`}
    >
      {status}
    </span>
  );
}

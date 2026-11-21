import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Upload,
  Users,
  XCircle,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Panel, PanelHeader } from "@/components/common/Panel";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DataTable } from "@/components/common/DataTable";
import { BatchStatusBadge } from "@/components/ra/badges";
import { useRaData } from "@/components/ra/useRaData";
import { downloadTemplate } from "@/lib/leadgen/excel";
import { CURRENT_RA, fmt, formatDate, pct } from "@/lib/leadgen/data";
import { toast } from "sonner";

export default function RaDashboard() {
  const { kpis, batches, leads, ra } = useRaData();
  const reviewed = kpis.approved + kpis.rejected;
  const recentRejected = leads
    .filter((l) => l.status === "rejected")
    .sort((a, b) => ((a.reviewedOn ?? "") < (b.reviewedOn ?? "") ? 1 : -1))
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,10.5rem),1fr))] gap-3">
        <KpiCard
          label="Total Leads Uploaded"
          value={fmt(kpis.total)}
          icon={Users}
          tone="blue"
          hint={`${batches.filter((b) => !b.draft).length} batches`}
        />
        <KpiCard
          label="Pending Review"
          value={fmt(kpis.pending)}
          icon={Clock}
          tone="amber"
          hint="Awaiting Master Admin"
        />
        <KpiCard
          label="Approved Leads"
          value={fmt(kpis.approved)}
          icon={CheckCircle2}
          tone="green"
          hint={`${pct(kpis.approved, reviewed).toFixed(1)}% approval rate`}
          hintTone="up"
        />
        <KpiCard
          label="Rejected Leads"
          value={fmt(kpis.rejected)}
          icon={XCircle}
          tone="red"
          hint={`${pct(kpis.rejected, reviewed).toFixed(1)}% of reviewed`}
          hintTone="down"
        />
        <KpiCard
          label="Duplicate Records"
          value={fmt(kpis.duplicates)}
          icon={Copy}
          tone="violet"
          hint="Caught before submission"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Panel className="min-w-0 xl:col-span-8">
          <PanelHeader
            title="Recent Upload Batches"
            subtitle="Your latest submissions and their review progress"
            actions={
              <Button asChild variant="soft" size="xs">
                <Link to="/ra/uploads">View all</Link>
              </Button>
            }
          />
          <DataTable
            rows={batches.slice(0, 6)}
            rowKey={(b) => b.id}
            pageSize={6}
            columns={[
              {
                key: "id",
                header: "Batch ID",
                render: (b) => <span className="font-semibold">{b.id}</span>,
              },
              {
                key: "d",
                header: "Uploaded",
                render: (b) => (
                  <span className="whitespace-nowrap text-muted-foreground">
                    {formatDate(b.uploadedOn)}
                  </span>
                ),
              },
              {
                key: "t",
                header: "Records",
                align: "right",
                render: (b) => fmt(b.totalRecords),
              },
              {
                key: "p",
                header: "Review progress",
                render: (b) => {
                  const done = b.approved + b.rejected;
                  const all = done + b.pending;
                  return (
                    <div className="flex min-w-32 items-center gap-2">
                      <Progress value={pct(done, all)} className="h-1.5" />
                      <span className="num w-9 text-right text-[11px] text-muted-foreground">
                        {Math.round(pct(done, all))}%
                      </span>
                    </div>
                  );
                },
              },
              {
                key: "s",
                header: "Status",
                render: (b) => <BatchStatusBadge status={b.status} />,
              },
            ]}
          />
        </Panel>

        <div className="space-y-4 xl:col-span-4">
          <Panel>
            <PanelHeader
              title="Upload new leads"
              subtitle="Excel or CSV, up to 5 MB"
            />
            <div className="grid gap-2 px-4 pb-4 sm:grid-cols-2 xl:grid-cols-1">
              <Button asChild>
                <Link to="/ra/upload">
                  <Upload /> Upload Leads
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  downloadTemplate().then(() =>
                    toast.success("Template downloaded"),
                  )
                }
              >
                <Download /> Download template
              </Button>
            </div>
          </Panel>
          <Panel>
            <PanelHeader
              title="Recent rejections"
              subtitle="Fix and resubmit for another review"
              actions={
                <Button asChild variant="soft" size="xs">
                  <Link to="/ra/rejected">Open</Link>
                </Button>
              }
            />
            <ul className="space-y-2 px-4 pb-4">
              {recentRejected.map((l) => (
                <li
                  key={l.id}
                  className="rounded-md bg-tint-red/60 px-2.5 py-1.5"
                >
                  <div className="truncate text-[13px] font-medium">
                    {l.company}
                  </div>
                  <div className="truncate text-[11px] text-tint-red-foreground">
                    {l.rejectionReason}
                  </div>
                </li>
              ))}
              {recentRejected.length === 0 && (
                <li className="text-xs text-muted-foreground">
                  No rejected leads. Nice work, {ra || CURRENT_RA}!
                </li>
              )}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Area,
  AreaChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CheckCircle2, Copy, Download, Gauge, Percent, Upload, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Panel, PanelHeader } from "@/components/common/Panel";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterSelect } from "@/components/common/Toolbar";
import { useRaData } from "@/components/ra/useRaData";
import { TODAY, fmt, formatDate, isoDaysBefore, pct } from "@/lib/leadgen/data";
import { exportRows } from "@/lib/leadgen/excel";
import { pageHead } from "@/lib/leadgen/head";

export const Route = createFileRoute("/ra/reports")({
  head: () =>
    pageHead(
      "RA Performance Report",
      "Upload trends, approval rates and data quality for research analysts.",
    ),
  component: Reports,
});

const RANGES = ["Last 14 Days", "Last 30 Days", "Last 60 Days"];
const tooltipStyle = { borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 };

function ChartBox({ children }) {
  return (
    <div className="h-64 px-2 pb-3">
      <ClientOnly fallback={<Skeleton className="mx-2 h-full" />}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </ClientOnly>
    </div>
  );
}

function Reports() {
  const { leads, batches } = useRaData();
  const [range, setRange] = useState("Last 30 Days");
  const days = range === "Last 14 Days" ? 14 : range === "Last 60 Days" ? 60 : 30;
  const start = isoDaysBefore(TODAY, days - 1);

  const data = useMemo(() => {
    const inRange = leads.filter((l) => l.uploadedOn >= start);
    const bs = batches.filter((b) => !b.draft && b.uploadedOn >= start);
    const daily = Array.from({ length: days }, (_, i) => {
      const d = isoDaysBefore(TODAY, days - 1 - i);
      return { date: formatDate(d).slice(0, 6), iso: d, uploaded: 0, approved: 0, rejected: 0 };
    });
    const idx = new Map(daily.map((d, i) => [d.iso, i]));
    for (const l of inRange) {
      const i = idx.get(l.uploadedOn);
      if (i === undefined) continue;
      daily[i].uploaded++;
      if (l.status === "approved") daily[i].approved++;
      if (l.status === "rejected") daily[i].rejected++;
    }
    const approved = inRange.filter((l) => l.status === "approved").length;
    const rejected = inRange.filter((l) => l.status === "rejected").length;
    const totalRecords = bs.reduce((a, b) => a + b.totalRecords, 0);
    const dups = bs.reduce((a, b) => a + b.duplicates, 0);
    const valid = bs.reduce((a, b) => a + b.validRecords, 0);
    const batchPerf = bs
      .slice(0, 10)
      .reverse()
      .map((b) => ({
        batch: b.id.replace(/^BT-/, ""),
        approved: b.approved,
        rejected: b.rejected,
        pending: b.pending,
      }));
    return {
      daily,
      approved,
      rejected,
      uploaded: inRange.length,
      dupRate: pct(dups, totalRecords),
      approvalRate: pct(approved, approved + rejected),
      quality: pct(valid, totalRecords),
      batchPerf,
      bs,
    };
  }, [leads, batches, days, start]);

  const doExport = async () => {
    try {
      await exportRows(
        `ra_report_${range.replace(/\s/g, "_").toLowerCase()}.xlsx`,
        "Daily",
        data.daily.map((d) => ({
          Date: formatDate(d.iso),
          Uploaded: d.uploaded,
          Approved: d.approved,
          Rejected: d.rejected,
        })),
      );
      toast.success("Report exported");
    } catch {
      toast.error("Export failed. Please try again.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <FilterSelect
          value={range === "Last 30 Days" ? "all" : range}
          onChange={(v) => setRange(v === "all" ? "Last 30 Days" : v)}
          all="Last 30 Days"
          options={RANGES.filter((r) => r !== "Last 30 Days")}
          label="Report period"
        />
        <Button size="sm" variant="outline" onClick={doExport}>
          <Download /> Export report
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Leads Uploaded"
          value={fmt(data.uploaded)}
          icon={Upload}
          tone="blue"
          hint={range}
        />
        <KpiCard
          label="Leads Approved"
          value={fmt(data.approved)}
          icon={CheckCircle2}
          tone="green"
        />
        <KpiCard label="Leads Rejected" value={fmt(data.rejected)} icon={XCircle} tone="red" />
        <KpiCard
          label="Duplicate Rate"
          value={`${data.dupRate.toFixed(1)}%`}
          icon={Copy}
          tone="violet"
          hint="of records in files"
        />
        <KpiCard
          label="Approval Rate"
          value={`${data.approvalRate.toFixed(1)}%`}
          icon={Percent}
          tone="cyan"
          hint="of reviewed leads"
        />
        <KpiCard
          label="Data Quality Rate"
          value={`${data.quality.toFixed(1)}%`}
          icon={Gauge}
          tone="amber"
          hint="valid / total records"
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel>
          <PanelHeader title="Daily upload trend" subtitle="Leads uploaded per day" />
          <ChartBox>
            <AreaChart data={data.daily} margin={{ left: -16, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="uploaded"
                name="Uploaded"
                stroke="var(--chart-1)"
                fill="var(--tint-blue)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartBox>
        </Panel>
        <Panel>
          <PanelHeader title="Approval vs rejection" subtitle="Review outcomes by upload date" />
          <ChartBox>
            <BarChart data={data.daily} margin={{ left: -16, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="approved" name="Approved" stackId="a" fill="var(--chart-3)" />
              <Bar
                dataKey="rejected"
                name="Rejected"
                stackId="a"
                fill="var(--chart-4)"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ChartBox>
        </Panel>
      </div>
      <Panel>
        <PanelHeader title="Upload batch performance" subtitle="Latest 10 batches in this period" />
        <ChartBox>
          <BarChart data={data.batchPerf} margin={{ left: -16, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="batch" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="approved" name="Approved" stackId="b" fill="var(--chart-3)" />
            <Bar dataKey="rejected" name="Rejected" stackId="b" fill="var(--chart-4)" />
            <Bar
              dataKey="pending"
              name="Pending"
              stackId="b"
              fill="var(--chart-5)"
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ChartBox>
      </Panel>
    </div>
  );
}

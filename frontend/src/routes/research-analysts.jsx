import { useState, useMemo } from "react";
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  Filter,
  Microscope,
  Search,
  Sparkles,
  Upload,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Panel, PanelHeader } from "@/components/common/Panel";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PersonCell } from "@/components/dashboard/PerformanceTable";
import { UploadLeadsDialog } from "@/components/dashboard/QuickActions";
import { useLeadGen } from "@/lib/leadgen/store";
import { RA_EXTENDED, RESEARCHERS, fmt, pct } from "@/lib/leadgen/data";

// Rich researcher performance metrics
const RA_METRICS = [
  {
    name: "Priya M",
    email: "priya.m@arahinfotech.com",
    uploaded: 1250,
    approved: 1020,
    rejected: 60,
    duplicates: 17,
    accuracy: 94.4,
    speed: "42 leads/hr",
    status: "Top Performer",
    topIndustry: "Healthcare",
  },
  {
    name: "Arjun K",
    email: "arjun.k@arahinfotech.com",
    uploaded: 980,
    approved: 760,
    rejected: 45,
    duplicates: 22,
    accuracy: 94.4,
    speed: "38 leads/hr",
    status: "Top Performer",
    topIndustry: "Diagnostics",
  },
  {
    name: "Neha R",
    email: "neha.r@arahinfotech.com",
    uploaded: 860,
    approved: 690,
    rejected: 40,
    duplicates: 14,
    accuracy: 94.5,
    speed: "35 leads/hr",
    status: "Solid Contributor",
    topIndustry: "Pharmaceuticals",
  },
  {
    name: "Sneha T",
    email: "sneha.t@arahinfotech.com",
    uploaded: 720,
    approved: 560,
    rejected: 52,
    duplicates: 19,
    accuracy: 91.5,
    speed: "31 leads/hr",
    status: "Solid Contributor",
    topIndustry: "Dental",
  },
  {
    name: "Rahul P",
    email: "rahul.p@arahinfotech.com",
    uploaded: 470,
    approved: 390,
    rejected: 38,
    duplicates: 28,
    accuracy: 91.1,
    speed: "26 leads/hr",
    status: "Audit Watch",
    topIndustry: "Wellness",
  },
];

// Sample batch submission audit log
const RECENT_BATCHES = [
  {
    id: "BAT-2026-042",
    researcher: "Priya M",
    source: "Web Directory",
    count: 120,
    approved: 112,
    rejected: 8,
    date: "2026-11-20",
    status: "Reviewed",
  },
  {
    id: "BAT-2026-041",
    researcher: "Arjun K",
    source: "Healthcare Expo",
    count: 85,
    approved: 76,
    rejected: 9,
    date: "2026-11-19",
    status: "Reviewed",
  },
  {
    id: "BAT-2026-040",
    researcher: "Neha R",
    source: "LinkedIn",
    count: 95,
    approved: 84,
    rejected: 11,
    date: "2026-11-18",
    status: "Reviewed",
  },
  {
    id: "BAT-2026-039",
    researcher: "Sneha T",
    source: "Cold Call",
    count: 60,
    approved: 51,
    rejected: 9,
    date: "2026-11-17",
    status: "Reviewed",
  },
  {
    id: "BAT-2026-038",
    researcher: "Rahul P",
    source: "Referral",
    count: 45,
    approved: 37,
    rejected: 8,
    date: "2026-11-16",
    status: "Reviewed",
  },
];

export default function ResearchAnalystsPage() {
  const { state } = useLeadGen();
  const [selectedRa, setSelectedRa] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [uploadOpen, setUploadOpen] = useState(false);

  // Compute overall stats
  const totalUploaded = RA_METRICS.reduce((sum, r) => sum + r.uploaded, 0);
  const totalApproved = RA_METRICS.reduce((sum, r) => sum + r.approved, 0);
  const totalRejected = RA_METRICS.reduce((sum, r) => sum + r.rejected, 0);
  const overallApprovalRate = pct(totalApproved, totalUploaded);

  const filteredResearchers = useMemo(() => {
    let list = RA_METRICS;
    if (selectedFilter !== "all") {
      list = list.filter((r) =>
        r.status.toLowerCase().includes(selectedFilter.toLowerCase()),
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.topIndustry.toLowerCase().includes(q),
      );
    }
    return list;
  }, [search, selectedFilter]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Microscope className="size-6 text-primary" /> Research Analyst (RA)
            Quality Hub
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor researcher throughput, audit upload quality, identify
            duplicate patterns, and enforce research SLA.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button onClick={() => setUploadOpen(true)} className="gap-2">
            <Upload className="size-4" /> Upload Leads for RA
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Active Research Analysts"
          value={RA_METRICS.length}
          icon={Users}
          hint="Assigned across 5 sectors"
          tone="blue"
        />
        <KpiCard
          label="Total Uploads Reviewed"
          value={fmt(totalUploaded)}
          icon={CheckCircle2}
          hint={`${fmt(totalApproved)} approved`}
          tone="green"
        />
        <KpiCard
          label="Overall Quality Rate"
          value={`${overallApprovalRate.toFixed(1)}%`}
          icon={Sparkles}
          hint="+2.1% quality gain"
          tone="purple"
        />
        <KpiCard
          label="Flagged Duplicates / Defects"
          value={fmt(totalRejected)}
          icon={XCircle}
          hint="Filtered before BDEs"
          tone="red"
        />
      </div>

      {/* Researcher Performance Table */}
      <Panel>
        <PanelHeader
          title="Researcher Quality Scorecard & Productivity"
          subtitle="Real-time accuracy, throughput rate, and quality tier evaluation"
          icon={
            <div className="flex size-8 items-center justify-center rounded-lg bg-tint-blue text-tint-blue-foreground">
              <Award className="size-4" />
            </div>
          }
        />

        <div className="border-b bg-muted/20 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search researcher name, email, or domain..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <Select value={selectedFilter} onValueChange={setSelectedFilter}>
              <SelectTrigger className="w-40 h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Quality Tiers</SelectItem>
                <SelectItem value="top">Top Performer</SelectItem>
                <SelectItem value="solid">Solid Contributor</SelectItem>
                <SelectItem value="watch">Audit Watch</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/40 font-medium text-muted-foreground uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Researcher</th>
                <th className="px-4 py-3 text-right">Uploaded</th>
                <th className="px-4 py-3 text-right">Approved</th>
                <th className="px-4 py-3 text-right">Rejected</th>
                <th className="px-4 py-3 text-right">Approval Rate</th>
                <th className="px-4 py-3 text-right">Duplicates</th>
                <th className="px-4 py-3">Top Industry</th>
                <th className="px-4 py-3">Status Tier</th>
                <th className="px-4 py-3 text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredResearchers.map((r) => {
                const rate = pct(r.approved, r.uploaded);
                return (
                  <tr
                    key={r.name}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <PersonCell name={r.name} />
                      </div>
                      <div className="text-[11px] text-muted-foreground pl-10 font-normal">
                        {r.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium">
                      {fmt(r.uploaded)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-emerald-600">
                      {fmt(r.approved)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-rose-600">
                      {fmt(r.rejected)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] ${
                          rate >= 80
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                        }`}
                      >
                        {rate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                      {r.duplicates}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {r.topIndustry}
                    </td>
                    <td className="px-4 py-3">
                      {r.status === "Top Performer" ? (
                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                          {r.status}
                        </Badge>
                      ) : r.status === "Solid Contributor" ? (
                        <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 text-[10px]">
                          {r.status}
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px]">
                          {r.status}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setSelectedRa(r)}
                        className="gap-1 text-primary hover:text-primary"
                      >
                        <Eye className="size-3.5" /> Details
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Recent Batch Submissions Log */}
      <Panel>
        <PanelHeader
          title="Recent Lead Sheet Upload Batches"
          subtitle="Audit verification log for uploaded sheets across all researchers"
          icon={
            <div className="flex size-8 items-center justify-center rounded-lg bg-tint-green text-tint-green-foreground">
              <FileSpreadsheet className="size-4" />
            </div>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/40 font-medium text-muted-foreground uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Batch ID</th>
                <th className="px-4 py-3">Researcher</th>
                <th className="px-4 py-3">Source Channel</th>
                <th className="px-4 py-3 text-right">Total Leads</th>
                <th className="px-4 py-3 text-right">Approved</th>
                <th className="px-4 py-3 text-right">Rejected</th>
                <th className="px-4 py-3">Date Uploaded</th>
                <th className="px-4 py-3">Review Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {RECENT_BATCHES.map((b) => (
                <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-primary">
                    {b.id}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {b.researcher}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {b.source}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-medium">
                    {b.count}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-600 font-medium">
                    {b.approved}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-rose-600 font-medium">
                    {b.rejected}
                  </td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">
                    {b.date}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                    >
                      {b.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Researcher Quality Audit Modal */}
      {selectedRa && (
        <Dialog open={!!selectedRa} onOpenChange={() => setSelectedRa(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Microscope className="size-5 text-primary" />
                Researcher Audit: {selectedRa.name}
              </DialogTitle>
              <DialogDescription>
                Detailed quality breakdown and submission metrics.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-muted/20 p-3">
                  <div className="text-[11px] text-muted-foreground">
                    Overall Accuracy
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-600">
                    {selectedRa.accuracy}%
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/20 p-3">
                  <div className="text-[11px] text-muted-foreground">
                    Ingestion Velocity
                  </div>
                  <div className="text-xl font-bold font-mono text-foreground">
                    {selectedRa.speed}
                  </div>
                </div>
              </div>

              <div className="space-y-2 rounded-lg border p-3.5 bg-card">
                <div className="text-xs font-semibold text-foreground">
                  Rejection Reason Breakdown
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Duplicates detected:
                    </span>
                    <span className="font-mono font-medium">
                      {selectedRa.duplicates}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Invalid phone/email:
                    </span>
                    <span className="font-mono font-medium">
                      {Math.round(selectedRa.rejected * 0.45)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Outside target segment:
                    </span>
                    <span className="font-mono font-medium">
                      {Math.round(selectedRa.rejected * 0.25)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                <span>Account: {selectedRa.email}</span>
                <Badge variant="outline" className="text-[10px]">
                  {selectedRa.status}
                </Badge>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Upload Dialog for quick upload */}
      <UploadLeadsDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Coins,
  Download,
  FileSpreadsheet,
  Filter,
  GitBranch,
  Layers,
  Search,
  Sparkles,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Panel, PanelHeader } from "@/components/common/Panel";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { LeadFlowCard } from "@/components/dashboard/LeadFlowCard";
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
import { ClientOnly } from "@/components/common/ClientOnly";
import { useLeadGen } from "@/lib/leadgen/store";
import { exportRows } from "@/lib/leadgen/excel";
import { LEAD_CATEGORIES, fmt, pct, formatDate } from "@/lib/leadgen/data";

const RANGES = ["Last 7 Days", "Last 14 Days", "Last 30 Days", "All Time"];

export default function ReportsPage() {
  const { state, kpis } = useLeadGen();
  const [range, setRange] = useState("Last 30 Days");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);

  // Filtered leads
  const filteredLeads = useMemo(() => {
    let list = state.leads || [];
    if (statusFilter !== "all") {
      list = list.filter((l) => l.status === statusFilter);
    }
    if (categoryFilter !== "all") {
      list = list.filter(
        (l) => (l.category || "Students / Education") === categoryFilter,
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          (l.company || "").toLowerCase().includes(q) ||
          (l.contact || "").toLowerCase().includes(q) ||
          (l.email || "").toLowerCase().includes(q) ||
          (l.city || "").toLowerCase().includes(q) ||
          (l.assignedName || "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [state.leads, statusFilter, categoryFilter, search]);

  // Daily trend data for chart
  const trendData = useMemo(() => {
    const days = [
      { date: "Day 1", uploaded: 12, approved: 9, rejected: 3 },
      { date: "Day 5", uploaded: 18, approved: 14, rejected: 4 },
      { date: "Day 10", uploaded: 25, approved: 20, rejected: 5 },
      { date: "Day 15", uploaded: 30, approved: 24, rejected: 6 },
      { date: "Day 20", uploaded: 22, approved: 19, rejected: 3 },
      { date: "Day 25", uploaded: 35, approved: 29, rejected: 6 },
      { date: "Day 30", uploaded: 40, approved: 34, rejected: 6 },
    ];
    return days;
  }, []);

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const rows = filteredLeads.map((l) => ({
        "Lead ID": l.id,
        Company: l.company || "N/A",
        "Contact Person": l.contact || "N/A",
        Designation: l.designation || "N/A",
        Email: l.email || "N/A",
        Phone: l.phone || "N/A",
        Category: l.category || "Students / Education",
        City: l.city || "N/A",
        Industry: l.industry || "N/A",
        Source: l.source || "Web",
        Status: (l.status || "").toUpperCase(),
        "Rejection Reason": l.rejectionReason || "None",
        "Assigned BDE": l.assignedName || "Unassigned",
        Stage: l.stage || "uploaded",
        "Uploaded By": l.researcher || "Research Team",
        "Uploaded On": l.uploadedOn || "2026-04-10",
      }));

      await exportRows("LeadGenPro_Analytics_Report.xlsx", "Leads", rows);
      toast.success("Excel report exported successfully", {
        description: `Exported ${rows.length} rows to LeadGenPro_Analytics_Report.xlsx`,
      });
    } catch (err) {
      toast.error("Failed to export Excel report: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <BarChart3 className="size-6 text-primary" /> Reports & Analytics
            Console
          </h1>
          <p className="text-sm text-muted-foreground">
            Complete executive oversight into lead ingestion, quality audit
            rates, BDE allocations, and conversion velocity.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-36 bg-background">
              <Calendar className="mr-2 size-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handleExportExcel}
            disabled={exporting}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <FileSpreadsheet className="size-4" />
            {exporting ? "Generating..." : "Export to Excel (.xlsx)"}
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      {(() => {
        const approved = kpis?.approved ?? 0;
        const rejected = kpis?.rejected ?? 0;
        const total = kpis?.total ?? 0;
        const creditsUsed = kpis?.creditsUsed ?? 0;
        const creditsAllocated = kpis?.creditsAllocated ?? 0;
        const reviewed = approved + rejected;

        const approvalRate =
          typeof kpis?.approvalRate === "number"
            ? kpis.approvalRate
            : reviewed > 0
              ? (approved / reviewed) * 100
              : 0;

        const defectRate = total > 0 ? (rejected / total) * 100 : 0;

        const utilization =
          typeof kpis?.utilization === "number"
            ? kpis.utilization
            : creditsAllocated > 0
              ? (creditsUsed / creditsAllocated) * 100
              : 0;

        return (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard
              label="Total Ingested Leads"
              value={fmt(total)}
              icon={Layers}
              hint="+12.4% vs prev period"
              tone="blue"
            />
            <KpiCard
              label="Approval Quality Rate"
              value={`${approvalRate.toFixed(1)}%`}
              icon={CheckCircle2}
              hint={`${approved} approved leads`}
              tone="green"
            />
            <KpiCard
              label="Rejection / Defect Rate"
              value={`${defectRate.toFixed(1)}%`}
              icon={XCircle}
              hint={`${rejected} defective records`}
              tone="red"
            />
            <KpiCard
              label="Credit Utilization"
              value={`${utilization.toFixed(0)}%`}
              icon={Coins}
              hint={`${creditsUsed} / ${creditsAllocated} used`}
              tone="purple"
            />
          </div>
        );
      })()}

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <LeadFlowCard />
        </div>

        <div className="lg:col-span-6">
          <Panel className="h-full flex flex-col">
            <PanelHeader
              title="Ingestion & Quality Velocity"
              subtitle="Daily volume of uploaded vs approved leads"
              icon={
                <div className="flex size-8 items-center justify-center rounded-lg bg-tint-green text-tint-green-foreground">
                  <TrendingUp className="size-4" />
                </div>
              }
            />
            <div className="flex-1 p-4">
              <ClientOnly>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={trendData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorUpload"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#2563eb"
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor="#2563eb"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorApproved"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#16a34a"
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor="#16a34a"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        opacity={0.3}
                      />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid var(--border)",
                          fontSize: "12px",
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="uploaded"
                        name="Uploaded"
                        stroke="#2563eb"
                        fillOpacity={1}
                        fill="url(#colorUpload)"
                      />
                      <Area
                        type="monotone"
                        dataKey="approved"
                        name="Approved"
                        stroke="#16a34a"
                        fillOpacity={1}
                        fill="url(#colorApproved)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </ClientOnly>
            </div>
          </Panel>
        </div>
      </div>

      {/* Detailed Lead Breakdown Table */}
      <Panel>
        <PanelHeader
          title={`Lead Master Ledger (${filteredLeads.length} Records)`}
          subtitle="Explore, filter, and audit full lead records across all statuses"
          icon={
            <div className="flex size-8 items-center justify-center rounded-lg bg-tint-blue text-tint-blue-foreground">
              <Layers className="size-4" />
            </div>
          }
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                className="gap-1.5"
              >
                <Download className="size-3.5" /> Export View
              </Button>
            </div>
          }
        />

        {/* Toolbar */}
        <div className="border-b bg-muted/20 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search company, contact, email, or BDE..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-44 h-9 text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {LEAD_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/40 font-medium text-muted-foreground uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Company & Contact</th>
                <th className="px-4 py-3">Phone & Email</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">City & Source</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assigned BDE</th>
                <th className="px-4 py-3">Stage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredLeads.slice(0, 15).map((l) => (
                <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-foreground">
                      {l.company}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {l.contact}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-foreground">
                      {l.phone || "—"}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {l.email || "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded-xs bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">
                      {l.category || "Students / Education"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>{l.city || "—"}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {l.source || "Web"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {l.status === "approved" ? (
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                        Approved
                      </Badge>
                    ) : l.status === "rejected" ? (
                      <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 text-[10px]">
                        Rejected
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px]">
                        Pending
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {l.assignedName ? (
                      <span className="text-primary">{l.assignedName}</span>
                    ) : (
                      <span className="text-muted-foreground italic">
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {l.stage || "uploaded"}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No leads match the selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {filteredLeads.length > 15 && (
            <div className="p-3 text-center text-xs text-muted-foreground border-t bg-muted/10">
              Showing top 15 of {filteredLeads.length} records. Click "Export to
              Excel" to download complete dataset.
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}

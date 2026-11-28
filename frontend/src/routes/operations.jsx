import { useState, useMemo } from "react";
import {
  CalendarClock,
  PhoneCall,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Search,
  Building2,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { Panel, PanelHeader } from "@/components/common/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLeadGen } from "@/lib/leadgen/store";
import { formatDate } from "@/lib/leadgen/data";

export default function OperationsPage() {
  const { state, dispatch } = useLeadGen();
  const [bdeFilter, setBdeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const leads = state.leads || [];
  const bdes = state.bdes || [];

  // Filter leads that have follow-ups or are assigned to BDEs
  const followUpLeads = useMemo(() => {
    return (state.leads || []).filter((l) => {
      const isAssigned = Boolean(l.assignedName || l.assignedTo);
      const matchesBde = bdeFilter === "all" || l.assignedName === bdeFilter;
      const matchesSearch =
        !searchTerm ||
        (l.company || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.contact || "").toLowerCase().includes(searchTerm.toLowerCase());
      return isAssigned && matchesBde && matchesSearch;
    });
  }, [state.leads, bdeFilter, searchTerm]);

  // Operational metrics
  const connectedCount = leads.filter(
    (l) => String(l.stage || "").toLowerCase() === "connected",
  ).length;
  const interestedCount = leads.filter((l) =>
    ["interested", "converted"].includes(String(l.stage || "").toLowerCase()),
  ).length;
  const followUpCount = leads.filter(
    (l) =>
      ["follow-up", "follow_up", "followup"].includes(
        String(l.stage || "").toLowerCase(),
      ) || Boolean(l.followUpDate),
  ).length;

  return (
    <div className="space-y-4">
      {/* Top Operations KPI summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <CalendarClock className="size-4 text-primary" /> Active Pipeline
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {followUpLeads.length}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <PhoneCall className="size-4 text-emerald-500" /> Connected Leads
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">
            {connectedCount}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <CheckCircle2 className="size-4 text-blue-500" /> Interested
            Prospects
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-600">
            {interestedCount}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Clock className="size-4 text-amber-500" /> Scheduled Follow-ups
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">
            {followUpCount}
          </div>
        </div>
      </div>

      {/* Main Operations Follow-up Board */}
      <Panel>
        <PanelHeader
          title="Daily Call Operations & Follow-ups"
          subtitle="Manage active BDE outreach schedules, call logs, and client conversions"
          icon={
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarClock className="size-4" />
            </div>
          }
          actions={
            <div className="flex items-center gap-2">
              <Select value={bdeFilter} onValueChange={setBdeFilter}>
                <SelectTrigger className="w-40 text-xs">
                  <SelectValue placeholder="All BDEs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    All BDEs
                  </SelectItem>
                  {bdes.map((b) => (
                    <SelectItem key={b.name} value={b.name} className="text-xs">
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
        />

        {/* Search & Status Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search company or contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">Showing:</span>
            <Badge variant="outline" className="font-semibold">
              {followUpLeads.length} active leads
            </Badge>
          </div>
        </div>

        {/* Lead Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/40 font-semibold text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Company & Contact</th>
                <th className="px-3 py-3">Assigned BDE</th>
                <th className="px-3 py-3">Current Stage</th>
                <th className="px-3 py-3">Follow-up Date</th>
                <th className="px-3 py-3">Notes & Activity</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {followUpLeads.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No active call schedules found for this filter.
                  </td>
                </tr>
              ) : (
                followUpLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">
                        {lead.company}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {lead.contact} · {lead.location || "Hyderabad"}
                      </div>
                    </td>
                    <td className="px-3 py-3 font-medium text-foreground">
                      <Badge variant="secondary" className="text-[10px]">
                        {lead.assignedName || "Unassigned"}
                      </Badge>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                          lead.stage === "connected"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : lead.stage === "interested"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : lead.stage === "out-of-coverage"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {lead.stage || "New"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-muted-foreground/70" />
                        {lead.followUpDate
                          ? formatDate(lead.followUpDate)
                          : "No date set"}
                      </div>
                    </td>
                    <td className="max-w-xs truncate px-3 py-3 text-muted-foreground">
                      {lead.notes || "No call notes logged yet."}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="xs"
                        variant="outline"
                        className="gap-1 text-[11px]"
                        onClick={() => {
                          dispatch({
                            type: "bdeRemindCall",
                            leadId: lead.id,
                            bde: lead.assignedName,
                            company: lead.company,
                            contact: lead.contact,
                            notes: lead.notes,
                            followUpDate: lead.followUpDate,
                          });
                          toast.success(
                            `Follow-up reminder sent to ${lead.assignedName || "team"}`,
                          );
                        }}
                      >
                        <PhoneCall className="size-3" /> Remind BDE
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

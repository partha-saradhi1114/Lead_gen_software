import { useState, useMemo, useEffect } from "react";
import {
  Share2,
  Users,
  CheckCircle2,
  AlertCircle,
  Building2,
  MapPin,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import { Panel, PanelHeader } from "@/components/common/Panel";
import { Pager } from "@/components/common/Pager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLeadGen } from "@/lib/leadgen/store";
import { api } from "@/lib/api";
import { LEAD_CATEGORIES, BDE_CATEGORIES } from "@/lib/leadgen/data";

export default function LeadAllocationPage() {
  const { state, dispatch } = useLeadGen();
  const [selectedIds, setSelectedIds] = useState([]);
  const [targetBde, setTargetBde] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [allocating, setAllocating] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  useEffect(() => {
    setPage(1);
  }, [searchTerm, industryFilter, categoryFilter]);

  // Filter approved leads available for allocation
  const approvedLeads = useMemo(() => {
    return (state.leads || []).filter((l) => l.status === "approved");
  }, [state.leads]);

  // Available BDEs
  const bdes = state.bdes || [];

  const filteredLeads = useMemo(() => {
    return approvedLeads.filter((l) => {
      const matchSearch =
        !searchTerm ||
        (l.company || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.contact || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.location &&
          l.location.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchIndustry =
        industryFilter === "all" || l.industry === industryFilter;
      const matchCategory =
        categoryFilter === "all" ||
        (l.category || "Students / Education") === categoryFilter;
      return matchSearch && matchIndustry && matchCategory;
    });
  }, [approvedLeads, searchTerm, industryFilter, categoryFilter]);

  // Unique industries
  const industries = useMemo(() => {
    const set = new Set(approvedLeads.map((l) => l.industry).filter(Boolean));
    return Array.from(set);
  }, [approvedLeads]);

  const pages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const current = Math.min(page, pages);
  const paginatedLeads = useMemo(() => {
    return filteredLeads.slice((current - 1) * pageSize, current * pageSize);
  }, [filteredLeads, current, pageSize]);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(filteredLeads.map((l) => l.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleLead = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleAllocate = async () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one lead to allocate");
      return;
    }
    if (!targetBde) {
      toast.error("Please select a BDE to allocate to");
      return;
    }

    try {
      setAllocating(true);

      // 1. Update local state in reducer immediately for responsive UI
      dispatch({
        type: "allocateLeads",
        leadIds: selectedIds,
        bde: targetBde,
      });

      // 2. Sync with backend API gracefully if available
      api.assignLeads?.(selectedIds, targetBde).catch((err) => {
        console.warn(
          "[API] Lead assignment background sync note:",
          err.message,
        );
      });

      toast.success(
        `Successfully allocated ${selectedIds.length} lead${selectedIds.length > 1 ? "s" : ""} to ${targetBde}!`,
      );
      setSelectedIds([]);
    } catch (err) {
      toast.error(err.message || "Failed to allocate leads");
    } finally {
      setAllocating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <CheckCircle2 className="size-4 text-emerald-500" /> Total Approved
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {approvedLeads.length}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <AlertCircle className="size-4 text-amber-500" /> Unallocated
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">
            {
              approvedLeads.filter((l) => !l.assignedTo && !l.assignedName)
                .length
            }
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Share2 className="size-4 text-blue-500" /> Allocated
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-600">
            {approvedLeads.filter((l) => l.assignedTo || l.assignedName).length}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Users className="size-4 text-violet-500" /> Active BDEs
          </div>
          <div className="mt-2 text-2xl font-bold text-violet-600">
            {bdes.length}
          </div>
        </div>
      </div>

      {/* Main Allocation Workspace */}
      <Panel>
        <PanelHeader
          title="Lead Allocation Console"
          subtitle="Select approved leads and assign them to Business Development Executives"
          icon={
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Share2 className="size-4" />
            </div>
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Select value={targetBde} onValueChange={setTargetBde}>
                <SelectTrigger className="w-56 text-xs">
                  <SelectValue placeholder="Select BDE..." />
                </SelectTrigger>
                <SelectContent>
                  {bdes.map((b) => (
                    <SelectItem key={b.name} value={b.name} className="text-xs">
                      {b.name} · {BDE_CATEGORIES[b.name] || "General"} (
                      {b.allocated - b.used} credits)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                size="sm"
                className="gap-1.5 text-xs font-semibold"
                disabled={selectedIds.length === 0 || !targetBde || allocating}
                onClick={handleAllocate}
              >
                <Share2 className="size-3.5" />
                {allocating
                  ? "Allocating..."
                  : `Allocate (${selectedIds.length})`}
              </Button>
            </div>
          }
        />

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5">
          <div className="flex flex-1 items-center gap-2 sm:max-w-xs">
            <Input
              placeholder="Search company, contact, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-8 w-44 text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  All Categories
                </SelectItem>
                {LEAD_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  All Industries
                </SelectItem>
                {industries.map((ind) => (
                  <SelectItem key={ind} value={ind} className="text-xs">
                    {ind}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedIds.length > 0 && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setSelectedIds([])}
                className="text-xs text-muted-foreground"
              >
                Clear selection ({selectedIds.length})
              </Button>
            )}
          </div>
        </div>

        {/* Leads Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/40 font-semibold text-muted-foreground">
              <tr>
                <th className="w-10 px-4 py-3">
                  <Checkbox
                    checked={
                      filteredLeads.length > 0 &&
                      selectedIds.length === filteredLeads.length
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="px-3 py-3">Company</th>
                <th className="px-3 py-3">Contact</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Industry</th>
                <th className="px-3 py-3">Location</th>
                <th className="px-3 py-3">Assigned To</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No approved leads matching criteria.
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead) => {
                  const isSelected = selectedIds.includes(lead.id);
                  return (
                    <tr
                      key={lead.id}
                      className={`transition-colors hover:bg-muted/30 ${
                        isSelected ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleLead(lead.id)}
                        />
                      </td>
                      <td className="px-3 py-3 font-semibold text-foreground">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="size-3.5 text-muted-foreground" />
                          {lead.company}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        <div>{lead.contact}</div>
                        <div className="text-[10px] text-muted-foreground/70">
                          {lead.designation}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-block rounded-xs bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
                          {lead.category || "Students / Education"}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant="secondary" className="text-[10px]">
                          {lead.industry}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="size-3 text-muted-foreground/70" />
                          {lead.location || "Hyderabad"}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {lead.assignedName ? (
                          <Badge
                            variant="outline"
                            className="gap-1 border-blue-200 bg-blue-50 text-blue-700"
                          >
                            <Briefcase className="size-3" /> {lead.assignedName}
                          </Badge>
                        ) : (
                          <span className="rounded bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                            Unassigned
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-xs text-muted-foreground">
          <span>
            Showing {filteredLeads.length === 0 ? 0 : (current - 1) * pageSize + 1}–
            {Math.min(current * pageSize, filteredLeads.length)} of {filteredLeads.length} leads
          </span>
          <Pager current={current} pages={pages} onChange={setPage} />
        </div>
      </Panel>
    </div>
  );
}

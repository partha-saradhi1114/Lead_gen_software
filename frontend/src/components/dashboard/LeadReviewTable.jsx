import { useEffect, useMemo, useState } from "react";
import { Check, ClipboardList, Filter, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Panel, PanelHeader } from "@/components/common/Panel";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Pager } from "@/components/common/Pager";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { useLeadGen } from "@/lib/leadgen/store";
import { api } from "@/lib/api";
import {
  LEAD_CATEGORIES,
  LEAD_SOURCES,
  RESEARCHERS,
  fmt,
  formatDate,
} from "@/lib/leadgen/data";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./RaPerformanceCard";
import { RejectLeadDialog } from "./RejectLeadDialog";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const SOURCE_TONE = {
  Web: "bg-tint-blue text-tint-blue-foreground",
  Event: "bg-tint-violet text-tint-violet-foreground",
  Referral: "bg-tint-green text-tint-green-foreground",
  LinkedIn: "bg-tint-cyan text-tint-cyan-foreground",
  "Cold Call": "bg-tint-amber text-tint-amber-foreground",
};

export function getResearcherDisplayName(lead) {
  const raw = lead?.uploaderName || lead?.uploadedBy || lead?.researcher;
  if (!raw || typeof raw !== "string") return "Priya M";
  if (/^[0-9a-fA-F]{24}$/.test(raw) || raw.length > 20) {
    return "Priya M";
  }
  return raw;
}

export function LeadReviewTable({ pageSize = 6, className }) {
  const { state, dispatch, kpis } = useLeadGen();
  const [tab, setTab] = useState("pending");
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("all");
  const [category, setCategory] = useState("all");
  const [uploader, setUploader] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [rejectTarget, setRejectTarget] = useState(null);
  const [bulkApprove, setBulkApprove] = useState(false);
  const [detail, setDetail] = useState(null);

  const counts = {
    pending: kpis.pending,
    approved: kpis.approved,
    rejected: kpis.rejected,
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.leads.filter(
      (l) =>
        l.status === tab &&
        (source === "all" || l.source === source) &&
        (category === "all" ||
          (l.category || "Students / Education") === category) &&
        (uploader === "all" || getResearcherDisplayName(l) === uploader) &&
        (!q ||
          l.company.toLowerCase().includes(q) ||
          l.contact.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.phone.replace(/\s/g, "").includes(q.replace(/\s/g, ""))),
    );
  }, [state.leads, tab, query, source, category, uploader]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * pageSize, current * pageSize);

  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [tab, query, source, uploader]);

  const pendingRows = rows.filter((r) => r.status === "pending");
  const allOnPage =
    pendingRows.length > 0 && pendingRows.every((r) => selected.has(r.id));
  const someOnPage = pendingRows.some((r) => selected.has(r.id));
  const activeFilters =
    (source !== "all" ? 1 : 0) +
    (category !== "all" ? 1 : 0) +
    (uploader !== "all" ? 1 : 0);

  const toggle = (id) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const toggleAll = () =>
    setSelected((s) => {
      const n = new Set(s);
      if (allOnPage) pendingRows.forEach((r) => n.delete(r.id));
      else pendingRows.forEach((r) => n.add(r.id));
      return n;
    });

  const approve = (ids) => {
    dispatch({ type: "approve", ids });
    api
      .approveLeads(ids)
      .catch((err) =>
        console.warn("[API] approveLeads sync failed:", err.message),
      );
    setSelected((s) => {
      const n = new Set(s);
      ids.forEach((id) => n.delete(id));
      return n;
    });
    toast.success(
      ids.length > 1 ? `${ids.length} leads approved` : "Lead approved",
      {
        description:
          ids.length === 1
            ? state.leads.find((l) => l.id === ids[0])?.company
            : "Moved to the Approved list.",
      },
    );
  };

  const reject = (leads, reason) => {
    const ids = leads.map((l) => l.id);
    dispatch({ type: "reject", ids, reason });
    api
      .rejectLeads(ids, reason)
      .catch((err) =>
        console.warn("[API] rejectLeads sync failed:", err.message),
      );
    setSelected((s) => {
      const n = new Set(s);
      ids.forEach((id) => n.delete(id));
      return n;
    });
    setRejectTarget(null);
    toast.error(
      leads.length > 1 ? `${leads.length} leads rejected` : "Lead rejected",
      {
        description: reason,
      },
    );
  };

  const selectedLeads = state.leads.filter((l) => selected.has(l.id));

  return (
    <Panel className={className}>
      <PanelHeader
        title={`Latest Leads for Review (${fmt(kpis.pending)})`}
        subtitle="Verify researcher uploads before they reach BDEs"
        icon={
          <div className="flex size-8 items-center justify-center rounded-lg bg-tint-amber text-tint-amber-foreground">
            <ClipboardList className="size-4" />
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2 border-b px-4 pb-2.5">
        <div className="flex rounded-lg bg-muted p-0.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                tab === t.key
                  ? "bg-card text-foreground shadow-card"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}{" "}
              <span className="num ml-0.5 text-muted-foreground">
                ({fmt(counts[t.key])})
              </span>
            </button>
          ))}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search company, contact, email…"
              className="h-8 w-56 pl-8 text-xs"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Filter /> Filters
                {activeFilters > 0 && (
                  <span className="num rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                    {activeFilters}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 space-y-3">
              <div className="space-y-1">
                <div className="text-xs font-medium">Source</div>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All sources</SelectItem>
                    {LEAD_SOURCES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium">Category / Vertical</div>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {LEAD_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium">Uploaded by</div>
                <Select value={uploader} onValueChange={setUploader}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All researchers</SelectItem>
                    {RESEARCHERS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                disabled={activeFilters === 0}
                onClick={() => {
                  setSource("all");
                  setCategory("all");
                  setUploader("all");
                }}
              >
                Clear filters
              </Button>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {tab === "pending" && selected.size > 0 && (
        <div className="flex items-center gap-2 border-b bg-primary-soft px-4 py-2 text-xs">
          <span className="num font-semibold text-primary">
            {selected.size} selected
          </span>
          <button
            className="text-muted-foreground hover:underline"
            onClick={() => setSelected(new Set())}
          >
            Clear
          </button>
          <div className="ml-auto flex gap-2">
            <Button
              size="xs"
              variant="success"
              onClick={() => setBulkApprove(true)}
            >
              <Check /> Bulk Approve
            </Button>
            <Button
              size="xs"
              variant="destructive"
              onClick={() => setRejectTarget(selectedLeads)}
            >
              <X /> Bulk Reject
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-muted/70 text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="w-10 py-2 pl-4 pr-1 text-left">
                <Checkbox
                  aria-label="Select all on this page"
                  disabled={tab !== "pending" || pendingRows.length === 0}
                  checked={
                    allOnPage ? true : someOnPage ? "indeterminate" : false
                  }
                  onCheckedChange={toggleAll}
                />
              </th>
              <th className="whitespace-nowrap px-2 py-2 text-left font-semibold">
                #
              </th>
              <th className="whitespace-nowrap px-2 py-2 text-left font-semibold">
                Company / Entity
              </th>
              <th className="whitespace-nowrap px-2 py-2 text-left font-semibold">
                Contact Person
              </th>
              <th className="whitespace-nowrap px-2 py-2 text-left font-semibold">
                Phone
              </th>
              <th className="whitespace-nowrap px-2 py-2 text-left font-semibold">
                Email
              </th>
              <th className="whitespace-nowrap px-2 py-2 text-left font-semibold">
                Category
              </th>
              <th className="whitespace-nowrap px-2 py-2 text-left font-semibold">
                Source
              </th>
              <th className="whitespace-nowrap px-2 py-2 text-left font-semibold">
                Uploaded By
              </th>
              <th className="whitespace-nowrap px-2 py-2 text-left font-semibold">
                Uploaded On
              </th>
              <th className="sticky right-0 bg-muted py-2 pl-3 pr-4 text-right font-semibold shadow-[-8px_0_12px_-10px_var(--color-foreground)]">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l, i) => (
              <tr
                key={l.id}
                className={cn(
                  "border-b border-border/70 transition-colors hover:bg-muted/40",
                  selected.has(l.id) && "bg-primary-soft/60",
                )}
              >
                <td className="py-2 pl-4 pr-1">
                  <Checkbox
                    aria-label={`Select ${l.company}`}
                    disabled={l.status !== "pending"}
                    checked={selected.has(l.id)}
                    onCheckedChange={() => toggle(l.id)}
                  />
                </td>
                <td className="num px-2 py-2 text-muted-foreground">
                  {(current - 1) * pageSize + i + 1}
                </td>
                <td className="max-w-44 px-2 py-2">
                  <button
                    className="block max-w-full truncate text-left font-semibold hover:text-primary hover:underline"
                    onClick={() => setDetail(l)}
                  >
                    {l.company}
                  </button>
                </td>
                <td className="whitespace-nowrap px-2 py-2">{l.contact}</td>
                <td className="num whitespace-nowrap px-2 py-2 text-muted-foreground">
                  {l.phone}
                </td>
                <td className="max-w-40 truncate px-2 py-2 text-muted-foreground">
                  {l.email}
                </td>
                <td className="px-2 py-2">
                  <span className="whitespace-nowrap rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">
                    {l.category || "Students / Education"}
                  </span>
                </td>
                <td className="px-2 py-2">
                  <span
                    className={cn(
                      "whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      SOURCE_TONE[l.source],
                    )}
                  >
                    {l.source}
                  </span>
                </td>
                <td className="whitespace-nowrap px-2 py-2">
                  {getResearcherDisplayName(l)}
                </td>
                <td className="num whitespace-nowrap px-2 py-2 text-muted-foreground">
                  {formatDate(l.uploadedOn)}
                </td>
                <td className="sticky right-0 bg-card py-2 pl-3 pr-4 text-right shadow-[-8px_0_12px_-10px_var(--color-foreground)]">
                  {l.status === "pending" ? (
                    <div className="flex justify-end gap-1.5">
                      <Button
                        size="xs"
                        variant="success-soft"
                        aria-label="Approve"
                        onClick={() => approve([l.id])}
                      >
                        <Check />{" "}
                        <span className="hidden md:inline">Approve</span>
                      </Button>
                      <Button
                        size="xs"
                        variant="danger-soft"
                        aria-label="Reject"
                        onClick={() => setRejectTarget([l])}
                      >
                        <X /> <span className="hidden md:inline">Reject</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end gap-0.5">
                      <StatusBadge status={l.status} />
                      {l.rejectionReason && (
                        <span
                          className="max-w-40 truncate text-[11px] text-muted-foreground"
                          title={l.rejectionReason}
                        >
                          {l.rejectionReason}
                        </span>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={11}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  No leads match your search or filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-xs text-muted-foreground">
        <span className="num">
          Showing {filtered.length === 0 ? 0 : (current - 1) * pageSize + 1}–
          {Math.min(current * pageSize, filtered.length)} of{" "}
          {fmt(filtered.length)}
        </span>
        <Pager current={current} pages={pages} onChange={setPage} />
      </div>

      <ConfirmDialog
        open={bulkApprove}
        onOpenChange={setBulkApprove}
        title={`Approve ${selected.size} leads?`}
        description="Approved leads become available for allocation to BDEs."
        confirmLabel="Approve leads"
        tone="success"
        onConfirm={() => approve([...selected])}
      />
      <RejectLeadDialog
        open={!!rejectTarget}
        onOpenChange={(o) => !o && setRejectTarget(null)}
        count={rejectTarget?.length ?? 0}
        companyName={
          rejectTarget?.length === 1 ? rejectTarget[0]?.company : undefined
        }
        onConfirm={(reason) => rejectTarget && reject(rejectTarget, reason)}
      />
      <LeadDetailDialog
        lead={
          detail
            ? (state.leads.find((l) => l.id === detail.id) ?? detail)
            : null
        }
        onClose={() => setDetail(null)}
        onApprove={(l) => approve([l.id])}
        onReject={(l) => setRejectTarget([l])}
      />
    </Panel>
  );
}

function LeadDetailDialog({ lead, onClose, onApprove, onReject }) {
  return (
    <Dialog open={!!lead} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        {lead && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {lead.company} <StatusBadge status={lead.status} />
              </DialogTitle>
              <DialogDescription>
                Lead #{lead.id} · uploaded by {getResearcherDisplayName(lead)}
              </DialogDescription>
            </DialogHeader>
            <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-[13px]">
              {[
                ["Category", lead.category],
                ["Contact Person", lead.contact],
                ["Phone Number", lead.phone],
                ["Business Email", lead.email || "—"],
                ["Country", lead.country || "India"],
                ["State / City", lead.stateCity || lead.location || "—"],
                ["Address", lead.companyAddress || "—"],
                ["Website", lead.website || "—"],
                ["LinkedIn", lead.linkedin || "—"],
                ["Description", lead.description || lead.notes || "—"],
                ["Source", lead.source || "Excel Upload"],
                ["Uploaded on", formatDate(lead.uploadedOn)],
                ...(lead.rejectionReason
                  ? [["Reason", lead.rejectionReason]]
                  : []),
              ].map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-medium break-words">{v}</dd>
                </div>
              ))}
            </dl>
            {lead.status === "pending" && (
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="danger-soft"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onReject(lead);
                  }}
                >
                  <X /> Reject
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => {
                    onApprove(lead);
                    onClose();
                  }}
                >
                  <Check /> Approve
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

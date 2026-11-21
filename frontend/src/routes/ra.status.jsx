import { useMemo, useState } from "react";
import { Eye, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Panel, PanelHeader } from "@/components/common/Panel";
import { DataTable, EmptyState } from "@/components/common/DataTable";
import {
  FilterSelect,
  SearchBox,
  TabPills,
  Toolbar,
} from "@/components/common/Toolbar";
import { StatusBadge } from "@/components/dashboard/RaPerformanceCard";
import { useRaData } from "@/components/ra/useRaData";
import { INDUSTRIES, formatDate } from "@/lib/leadgen/data";

function Remarks({ l }) {
  if (l.status === "rejected")
    return (
      <span className="text-tint-red-foreground">{l.rejectionReason}</span>
    );
  if (l.status === "approved")
    return (
      <span className="text-muted-foreground">
        Approved by Master Admin
        {l.reviewedOn ? ` · ${formatDate(l.reviewedOn)}` : ""}
      </span>
    );
  if (l.history?.length)
    return (
      <span className="text-tint-amber-foreground">
        Resubmitted after: {l.history.at(-1)?.reason}
      </span>
    );
  return <span className="text-muted-foreground">Awaiting admin review</span>;
}

export default function ApprovalStatus() {
  const { leads } = useRaData();
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [industry, setIndustry] = useState("all");
  const [open, setOpen] = useState(null);
  const counts = { all: leads.length, pending: 0, approved: 0, rejected: 0 };
  for (const l of leads) counts[l.status]++;

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return leads.filter(
      (l) =>
        (tab === "all" || l.status === tab) &&
        (industry === "all" || l.industry === industry) &&
        (!s ||
          l.company.toLowerCase().includes(s) ||
          l.contact.toLowerCase().includes(s) ||
          l.phone.replace(/\s/g, "").includes(s.replace(/\s/g, ""))),
    );
  }, [leads, tab, q, industry]);

  return (
    <Panel>
      <PanelHeader
        title="Approval Status"
        subtitle="Review decisions on the leads you've submitted"
      />
      <div className="mx-4 mb-2.5 flex items-center gap-2 rounded-md bg-tint-blue px-3 py-2 text-xs text-tint-blue-foreground">
        <ShieldCheck className="size-4 shrink-0" /> Only the Master Admin can
        approve or reject leads. Research Analysts can't approve their own
        uploads.
      </div>
      <Toolbar>
        <TabPills
          value={tab}
          onChange={setTab}
          tabs={[
            { key: "all", label: "All", count: counts.all },
            { key: "pending", label: "Pending", count: counts.pending },
            { key: "approved", label: "Approved", count: counts.approved },
            { key: "rejected", label: "Rejected", count: counts.rejected },
          ]}
        />
        <div className="ml-auto flex flex-wrap gap-2">
          <SearchBox
            value={q}
            onChange={setQ}
            placeholder="Search company, contact…"
          />
          <FilterSelect
            value={industry}
            onChange={setIndustry}
            all="All industries"
            options={INDUSTRIES}
            label="Industry"
          />
        </div>
      </Toolbar>
      <DataTable
        rows={rows}
        rowKey={(l) => l.id}
        resetKey={`${tab}|${q}|${industry}`}
        empty={
          <EmptyState
            title="No leads here yet"
            hint="Leads you submit will appear here with their review status."
          />
        }
        columns={[
          {
            key: "c",
            header: "Company Name",
            className:
              "sticky left-0 z-[1] max-w-52 truncate bg-card font-semibold",
            render: (l) => <span title={l.company}>{l.company}</span>,
          },
          {
            key: "p",
            header: "Contact Person",
            className: "whitespace-nowrap",
            render: (l) => l.contact,
          },
          {
            key: "ph",
            header: "Phone",
            className: "whitespace-nowrap text-muted-foreground",
            render: (l) => l.phone,
          },
          { key: "i", header: "Industry", render: (l) => l.industry ?? "—" },
          { key: "lo", header: "Location", render: (l) => l.location ?? "—" },
          { key: "s", header: "Source", render: (l) => l.source },
          {
            key: "d",
            header: "Submitted",
            className: "whitespace-nowrap text-muted-foreground",
            render: (l) => formatDate(l.resubmittedOn ?? l.uploadedOn),
          },
          {
            key: "st",
            header: "Review Status",
            render: (l) => <StatusBadge status={l.status} />,
          },
          {
            key: "r",
            header: "Admin Remarks",
            className: "min-w-48 text-xs",
            render: (l) => <Remarks l={l} />,
          },
          {
            key: "x",
            header: "Action",
            align: "right",
            render: (l) => (
              <Button size="xs" variant="outline" onClick={() => setOpen(l)}>
                <Eye /> View Details
              </Button>
            ),
          },
        ]}
      />
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="sm:max-w-lg">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2">
                  {open.company} <StatusBadge status={open.status} />
                </DialogTitle>
                <DialogDescription>
                  Batch {open.batchId ?? "—"} · submitted{" "}
                  {formatDate(open.resubmittedOn ?? open.uploadedOn)}
                </DialogDescription>
              </DialogHeader>
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-[13px]">
                {[
                  ["Contact Person", open.contact],
                  ["Designation", open.designation],
                  ["Phone", open.phone],
                  ["Email", open.email],
                  ["Industry", open.industry],
                  ["Location", open.location],
                  ["Source", open.source],
                  [
                    "Reviewed On",
                    open.reviewedOn && formatDate(open.reviewedOn),
                  ],
                ].map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="break-words font-medium">{v || "—"}</dd>
                  </div>
                ))}
              </dl>
              <div className="rounded-md bg-muted px-3 py-2 text-xs">
                <div className="mb-1 font-semibold">
                  {open.status === "rejected"
                    ? "Admin Remarks · Rejection reason"
                    : "Admin Remarks"}
                </div>
                <Remarks l={open} />
              </div>
              {open.history?.length > 0 && (
                <div className="text-xs">
                  <div className="mb-1 font-semibold">Rejection history</div>
                  <ul className="space-y-1">
                    {open.history.map((h, i) => (
                      <li
                        key={i}
                        className="rounded bg-tint-red/60 px-2 py-1 text-tint-red-foreground"
                      >
                        {h.reason}
                        {h.rejectedOn ? ` · ${formatDate(h.rejectedOn)}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </Panel>
  );
}

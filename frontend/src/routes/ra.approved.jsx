import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Panel, PanelHeader } from "@/components/common/Panel";
import { DataTable, EmptyState } from "@/components/common/DataTable";
import { FilterSelect, SearchBox, Toolbar } from "@/components/common/Toolbar";
import { Button } from "@/components/ui/button";
import { useRaData } from "@/components/ra/useRaData";
import { INDUSTRIES, LEAD_SOURCES, fmt, formatDate } from "@/lib/leadgen/data";
import { exportRows } from "@/lib/leadgen/excel";
import { pageHead } from "@/lib/leadgen/head";

export const Route = createFileRoute("/ra/approved")({
  head: () =>
    pageHead(
      "Approved Leads",
      "Leads approved by the Master Admin, with search, filters and export.",
    ),
  component: ApprovedLeads,
});

function ApprovedLeads() {
  const { leads, batches } = useRaData();
  const [q, setQ] = useState("");
  const [industry, setIndustry] = useState("all");
  const [source, setSource] = useState("all");
  const [batch, setBatch] = useState("all");
  const [exporting, setExporting] = useState(false);
  const approved = useMemo(() => leads.filter((l) => l.status === "approved"), [leads]);
  const batchIds = useMemo(() => batches.filter((b) => b.approved > 0).map((b) => b.id), [batches]);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return approved.filter(
      (l) =>
        (industry === "all" || l.industry === industry) &&
        (source === "all" || l.source === source) &&
        (batch === "all" || l.batchId === batch) &&
        (!s ||
          l.company.toLowerCase().includes(s) ||
          l.contact.toLowerCase().includes(s) ||
          l.email.toLowerCase().includes(s)),
    );
  }, [approved, q, industry, source, batch]);

  const doExport = async () => {
    if (rows.length === 0) return void toast.error("Nothing to export with the current filters");
    setExporting(true);
    try {
      await exportRows(
        `approved_leads_${new Date().toISOString().slice(0, 10)}.xlsx`,
        "Approved Leads",
        rows.map((l) => ({
          Company: l.company,
          "Contact Person": l.contact,
          Designation: l.designation ?? "",
          Industry: l.industry ?? "",
          Location: l.location ?? "",
          Phone: l.phone,
          Email: l.email,
          Source: l.source,
          "Batch ID": l.batchId ?? "",
          "Approval Date": l.reviewedOn ? formatDate(l.reviewedOn) : "",
        })),
      );
      toast.success(`Exported ${fmt(rows.length)} approved leads`);
    } catch {
      toast.error("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Panel>
      <PanelHeader
        title={`Approved Leads (${fmt(approved.length)})`}
        subtitle="Approved by the Master Admin and ready for BDE allocation"
        actions={
          <Button size="sm" variant="outline" onClick={doExport} disabled={exporting}>
            {exporting ? <Loader2 className="animate-spin" /> : <Download />} Export
          </Button>
        }
      />
      <Toolbar>
        <SearchBox value={q} onChange={setQ} placeholder="Search company, contact, email…" />
        <FilterSelect
          value={industry}
          onChange={setIndustry}
          all="All industries"
          options={INDUSTRIES}
          label="Industry"
        />
        <FilterSelect
          value={source}
          onChange={setSource}
          all="All sources"
          options={LEAD_SOURCES}
          label="Source"
        />
        <FilterSelect
          value={batch}
          onChange={setBatch}
          all="All batches"
          options={batchIds}
          label="Batch"
        />
      </Toolbar>
      <DataTable
        rows={rows}
        rowKey={(l) => l.id}
        resetKey={`${q}|${industry}|${source}|${batch}`}
        empty={
          <EmptyState
            title="No approved leads match"
            hint="Change the filters, or check Approval Status for leads still in review."
          />
        }
        columns={[
          {
            key: "c",
            header: "Company",
            className: "max-w-48 truncate font-semibold",
            render: (l) => l.company,
          },
          {
            key: "p",
            header: "Contact Person",
            className: "whitespace-nowrap",
            render: (l) => l.contact,
          },
          {
            key: "de",
            header: "Designation",
            className: "whitespace-nowrap text-muted-foreground",
            render: (l) => l.designation ?? "—",
          },
          { key: "i", header: "Industry", render: (l) => l.industry ?? "—" },
          { key: "lo", header: "Location", render: (l) => l.location ?? "—" },
          {
            key: "ph",
            header: "Phone",
            className: "whitespace-nowrap text-muted-foreground",
            render: (l) => l.phone,
          },
          {
            key: "e",
            header: "Email",
            className: "max-w-44 truncate text-muted-foreground",
            render: (l) => l.email || "—",
          },
          { key: "s", header: "Source", render: (l) => l.source },
          {
            key: "d",
            header: "Approval Date",
            className: "whitespace-nowrap text-muted-foreground",
            render: (l) => (l.reviewedOn ? formatDate(l.reviewedOn) : "—"),
          },
        ]}
      />
    </Panel>
  );
}

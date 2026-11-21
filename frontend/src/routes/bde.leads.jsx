import { useMemo, useState } from "react";
import { LockOpen, Pencil } from "lucide-react";
import { Panel, PanelHeader } from "@/components/common/Panel";
import { DataTable, EmptyState } from "@/components/common/DataTable";
import { FilterSelect, SearchBox, Toolbar } from "@/components/common/Toolbar";
import { Button } from "@/components/ui/button";
import { StageBadge, mask } from "@/components/bde/StageBadge";
import { UpdateLeadDialog } from "@/components/bde/UpdateLeadDialog";
import { useBdeData } from "@/components/bde/useBdeData";
import { useUnlock } from "@/components/bde/useUnlock";
import { BDE_STAGES, UNLOCK_COST } from "@/lib/leadgen/bde";
import { INDUSTRIES, fmt, formatDate } from "@/lib/leadgen/data";

export default function BdeLeads() {
  const data = useBdeData();
  const { rows, kpis, dispatch, bde } = data;
  const unlock = useUnlock(data);
  const [q, setQ] = useState("");
  const [stage, setStage] = useState("all");
  const [industry, setIndustry] = useState("all");
  const [editId, setEditId] = useState(null);
  const editing = rows.find((r) => r.leadId === editId) ?? null;

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (stage === "all" || r.stage === stage) &&
        (industry === "all" || r.lead.industry === industry) &&
        (!s ||
          r.lead.company.toLowerCase().includes(s) ||
          r.lead.contact.toLowerCase().includes(s)),
    );
  }, [rows, q, stage, industry]);

  return (
    <Panel>
      <PanelHeader
        title={`My Assigned Leads (${fmt(rows.length)})`}
        subtitle={`Unlocking a contact uses ${UNLOCK_COST} credit · ${fmt(kpis.available)} credits available`}
      />
      <Toolbar>
        <SearchBox
          value={q}
          onChange={setQ}
          placeholder="Search company or contact…"
        />
        <FilterSelect
          value={stage}
          onChange={setStage}
          all="All stages"
          options={BDE_STAGES}
          label="Stage"
        />
        <FilterSelect
          value={industry}
          onChange={setIndustry}
          all="All industries"
          options={INDUSTRIES}
          label="Industry"
        />
      </Toolbar>
      <DataTable
        rows={list}
        rowKey={(r) => r.leadId}
        resetKey={`${q}|${stage}|${industry}`}
        empty={
          <EmptyState
            title="No leads match"
            hint="Change the search or filters."
          />
        }
        columns={[
          {
            key: "c",
            header: "Company",
            className: "max-w-48 truncate font-semibold",
            render: (r) => r.lead.company,
          },
          {
            key: "p",
            header: "Contact",
            className: "whitespace-nowrap",
            render: (r) => r.lead.contact,
          },
          {
            key: "i",
            header: "Industry",
            render: (r) => r.lead.industry ?? "—",
          },
          {
            key: "ph",
            header: "Phone",
            className: "num whitespace-nowrap text-muted-foreground",
            render: (r) => (r.unlocked ? r.lead.phone : mask(r.lead.phone)),
          },
          {
            key: "e",
            header: "Email",
            className: "max-w-44 truncate text-muted-foreground",
            render: (r) => (r.unlocked ? r.lead.email : mask(r.lead.email)),
          },
          {
            key: "a",
            header: "Assigned",
            className: "whitespace-nowrap text-muted-foreground",
            render: (r) => formatDate(r.assignedOn),
          },
          {
            key: "s",
            header: "Stage",
            render: (r) => <StageBadge stage={r.stage} />,
          },
          {
            key: "f",
            header: "Next follow-up",
            className: "whitespace-nowrap text-muted-foreground",
            render: (r) =>
              r.followUp && !r.followUp.done ? formatDate(r.followUp.on) : "—",
          },
          {
            key: "x",
            header: "Action",
            align: "right",
            render: (r) =>
              r.unlocked ? (
                <Button
                  size="xs"
                  variant="soft"
                  onClick={() => setEditId(r.leadId)}
                >
                  <Pencil /> Update
                </Button>
              ) : (
                <Button size="xs" onClick={() => unlock(r)}>
                  <LockOpen /> Unlock
                </Button>
              ),
          },
        ]}
      />
      <UpdateLeadDialog
        row={editing}
        onClose={() => setEditId(null)}
        dispatch={dispatch}
        bde={bde}
      />
    </Panel>
  );
}

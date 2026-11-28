import { useMemo, useState } from "react";
import { Eye, EyeOff, LockOpen, Pencil } from "lucide-react";
import { Panel, PanelHeader } from "@/components/common/Panel";
import { DataTable, EmptyState } from "@/components/common/DataTable";
import { FilterSelect, SearchBox, Toolbar } from "@/components/common/Toolbar";
import { Button } from "@/components/ui/button";
import { StageBadge, mask } from "@/components/bde/StageBadge";
import { UpdateLeadDialog } from "@/components/bde/UpdateLeadDialog";
import { useBdeData } from "@/components/bde/useBdeData";
import { useUnlock } from "@/components/bde/useUnlock";
import { BDE_STAGES, UNLOCK_COST, normalizeStage } from "@/lib/leadgen/bde";
import { INDUSTRIES, fmt, formatDate } from "@/lib/leadgen/data";

export default function BdeLeads() {
  const data = useBdeData();
  const { rows, kpis, dispatch, bde } = data;
  const unlock = useUnlock(data);
  const [q, setQ] = useState("");
  const [stage, setStage] = useState("all");
  const [industry, setIndustry] = useState("all");
  const [editId, setEditId] = useState(null);
  const [viewedOpenIds, setViewedOpenIds] = useState(() => new Set());
  const editing = rows.find((r) => r.leadId === editId) ?? null;

  const toggleViewed = (leadId) => {
    setViewedOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(leadId)) {
        next.delete(leadId);
      } else {
        next.add(leadId);
      }
      return next;
    });
  };

  const isLeadViewedMode = (r) =>
    r.isViewed ||
    (bde?.toLowerCase() === "billa" && r.unlocked) ||
    (r.unlocked && !r.unlockedByMe);

  /** Extract who unlocked and when from lead/assignment data */
  const getViewerInfo = (r) => {
    // Viewer name: from lead.unlockedBy array (strings after mapLead populate)
    const unlockers = r.lead?.unlockedBy;
    let viewerName = "Unknown";
    if (Array.isArray(unlockers) && unlockers.length > 0) {
      const first = unlockers[0];
      viewerName = typeof first === "object" ? (first.name || "Unknown") : String(first);
    }

    // Viewed date: from activity entry containing "unlocked" or "Contact unlocked"
    const acts = Array.isArray(r.activity) ? r.activity : [];
    const unlockAct = acts.find(
      (a) => a.text && (a.text.includes("Contact unlocked") || a.text.toLowerCase().includes("unlocked"))
    );
    const rawDate = unlockAct?.on || r.assignedOn || r.lead?.assignedOn || "";
    let viewedDate = "";
    if (rawDate) {
      try {
        viewedDate = new Date(rawDate).toLocaleDateString("en-GB", {
          day: "2-digit", month: "short", year: "numeric",
        });
      } catch {
        viewedDate = rawDate;
      }
    }

    return { viewerName, viewedDate };
  };

  const shouldShowContactDetails = (r) => {
    if (!r.unlocked) return false;
    if (!isLeadViewedMode(r)) return true; // Update mode: details shown
    return viewedOpenIds.has(r.leadId); // Viewed mode: shown only if eye is open
  };

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (stage === "all" ||
          r.stage === stage ||
          normalizeStage(r.stage) === stage) &&
        (industry === "all" || r.lead.industry === industry) &&
        (!s ||
          (r.lead?.company || "").toLowerCase().includes(s) ||
          (r.lead?.contact || "").toLowerCase().includes(s)),
    );
  }, [rows, q, stage, industry]);

  return (
    <Panel>
      <PanelHeader
        title={`My Assigned Leads (${fmt(rows.length)})`}
        subtitle={`Vertical: ${data.category || "Students / Education"} · Unlocking a contact uses ${UNLOCK_COST} credit · ${fmt(kpis.available)} credits available`}
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
            render: (r) => (
              <div>
                <div className="font-semibold">{r.lead.company}</div>
                <span className="inline-block rounded-xs bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground font-normal">
                  {r.lead.category || data.category}
                </span>
              </div>
            ),
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
            render: (r) => (shouldShowContactDetails(r) ? r.lead.phone : mask(r.lead.phone)),
          },
          {
            key: "e",
            header: "Email",
            className: "max-w-44 truncate text-muted-foreground",
            render: (r) => (shouldShowContactDetails(r) ? r.lead.email : mask(r.lead.email)),
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
              r.followUp && !r.followUp.done
                ? formatDate(r.followUp.on)
                : r.lead?.followUpDate
                  ? formatDate(r.lead.followUpDate)
                  : "—",
          },
          {
            key: "x",
            header: "Action",
            align: "right",
            render: (r) => {
              if (!r.unlocked) {
                return (
                  <Button size="xs" onClick={() => unlock(r)}>
                    <LockOpen /> Unlock
                  </Button>
                );
              }

              if (isLeadViewedMode(r)) {
                const isEyeOpen = viewedOpenIds.has(r.leadId);
                const { viewerName, viewedDate } = getViewerInfo(r);
                return (
                  <div className="flex flex-col items-end gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="xs"
                        variant={isEyeOpen ? "soft" : "outline"}
                        onClick={() => toggleViewed(r.leadId)}
                        title={isEyeOpen ? "Click to hide contact details" : "Click to view contact details"}
                        className="gap-1.5"
                      >
                        {isEyeOpen ? (
                          <>
                            <Eye className="size-3.5" /> Viewed
                          </>
                        ) : (
                          <>
                            <EyeOff className="size-3.5" /> View
                          </>
                        )}
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => setEditId(r.leadId)}
                        title="Update lead notes/stage"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="size-3.5" /> Update
                      </Button>
                    </div>
                    {isEyeOpen && (
                      <div className="text-[10px] text-muted-foreground leading-tight text-right">
                        <span>Recently viewed by: <strong>{viewerName}</strong></span>
                        {viewedDate && (
                          <span className="ml-1">· {viewedDate}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Button
                  size="xs"
                  variant="soft"
                  onClick={() => setEditId(r.leadId)}
                >
                  <Pencil /> Update
                </Button>
              );
            },
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

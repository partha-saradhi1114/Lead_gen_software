import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, Pencil, PhoneCall, AlertCircle, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Panel, PanelHeader } from "@/components/common/Panel";
import { DataTable, EmptyState } from "@/components/common/DataTable";
import { TabPills, Toolbar } from "@/components/common/Toolbar";
import { Button } from "@/components/ui/button";
import { StageBadge } from "@/components/bde/StageBadge";
import { UpdateLeadDialog } from "@/components/bde/UpdateLeadDialog";
import { useBdeData } from "@/components/bde/useBdeData";
import { formatDate } from "@/lib/leadgen/data";

const LABEL = {
  overdue: "Overdue",
  today: "Today",
  upcoming: "Upcoming",
  done: "Completed",
};

export default function BdeFollowUps() {
  const { rows, dispatch, bde } = useBdeData();
  const [searchParams] = useSearchParams();
  const targetLeadId = searchParams.get("leadId");

  const targetRow = useMemo(() => {
    if (!targetLeadId) return null;
    return rows.find((r) => String(r.leadId) === String(targetLeadId)) ?? null;
  }, [rows, targetLeadId]);

  const [tab, setTab] = useState(() => {
    if (targetLeadId) {
      const match = rows.find(
        (r) => String(r.leadId) === String(targetLeadId),
      );
      if (match?.bucket && match.bucket !== "done") return match.bucket;
      return "today";
    }
    const overdueCount = rows.filter(
      (r) => r.followUp && r.bucket === "overdue",
    ).length;
    if (overdueCount === 0) {
      const todayCount = rows.filter(
        (r) => r.followUp && (r.bucket === "today" || r.adminReminded),
      ).length;
      if (todayCount > 0) return "today";
    }
    return "overdue";
  });

  const [editId, setEditId] = useState(null);

  const withFu = useMemo(() => {
    const base = rows.filter((r) => r.followUp);
    if (targetRow && !base.some((r) => String(r.leadId) === String(targetLeadId))) {
      const enrichedTarget = {
        ...targetRow,
        followUp: targetRow.followUp || {
          on: targetRow.lead?.followUpDate || "2026-11-28",
          note: targetRow.lead?.notes || "Admin Reminder: Immediate action required!",
          done: false,
        },
        bucket: targetRow.bucket || "today",
      };
      return [enrichedTarget, ...base];
    }
    return base;
  }, [rows, targetRow, targetLeadId]);

  const list = useMemo(
    () =>
      withFu
        .filter(
          (r) =>
            (targetLeadId && String(r.leadId) === String(targetLeadId)) ||
            (r.adminReminded && (tab === "today" || tab === "overdue")) ||
            r.bucket === tab,
        )
        .sort((a, b) => {
          if (targetLeadId && String(a.leadId) === String(targetLeadId)) return -1;
          if (targetLeadId && String(b.leadId) === String(targetLeadId)) return 1;
          if (a.adminReminded && !b.adminReminded) return -1;
          if (!a.adminReminded && b.adminReminded) return 1;
          return a.followUp.on < b.followUp.on ? -1 : 1;
        }),
    [withFu, tab, targetLeadId],
  );
  const editing = rows.find((r) => r.leadId === editId) ?? null;

  const done = (r) => {
    dispatch({ type: "bdeCompleteFollowUp", bde, leadId: r.leadId });
    toast.success(`Follow-up with ${r.lead.company} marked done`);
  };

  const activeFollowUp = targetRow && targetRow.followUp ? targetRow : null;

  return (
    <Panel>
      <PanelHeader
        title="My Follow-ups"
        subtitle="Complete a call, or update the lead to reschedule"
      />

      {/* If directed to a specific follow-up from notifications, show its full details card */}
      {activeFollowUp && (
        <div className="mx-4 mt-4 rounded-xl border border-red-300 bg-red-50/70 dark:bg-red-950/20 p-4 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-bold text-foreground">
                  {activeFollowUp.lead.company}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 border border-red-300 px-2 py-0.5 text-[10px] font-bold text-red-700">
                  ⚠️ Priority Follow-up Selected
                </span>
                <StageBadge stage={activeFollowUp.stage} />
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-0.5">
                <div>
                  <span className="text-foreground/70">Contact:</span>{" "}
                  <strong className="text-foreground">
                    {activeFollowUp.lead.contact}
                  </strong>
                </div>
                <div>
                  <span className="text-foreground/70">Phone:</span>{" "}
                  <a
                    href={`tel:${activeFollowUp.lead.phone}`}
                    className="font-semibold text-primary underline hover:text-primary/80"
                  >
                    {activeFollowUp.lead.phone || "No phone"}
                  </a>
                </div>
                <div>
                  <span className="text-foreground/70">Due Date:</span>{" "}
                  <strong className="text-foreground">
                    {formatDate(activeFollowUp.followUp.on)}
                  </strong>
                </div>
              </div>

              {activeFollowUp.followUp.note && (
                <div className="mt-2 text-xs text-foreground bg-background/80 rounded-md p-2 border border-border/80">
                  <span className="font-semibold text-muted-foreground mr-1">
                    Call Note:
                  </span>
                  {activeFollowUp.followUp.note}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 pt-1">
              <Button
                size="sm"
                variant="destructive"
                className="gap-1.5 text-xs font-semibold shadow-xs"
                onClick={() => setEditId(activeFollowUp.leadId)}
              >
                <PhoneCall className="size-3.5" /> Call & Update
              </Button>
              <Button
                size="sm"
                variant="success-soft"
                className="gap-1.5 text-xs"
                onClick={() => done(activeFollowUp)}
              >
                <Check className="size-3.5" /> Mark Done
              </Button>
            </div>
          </div>
        </div>
      )}

      <Toolbar>
        <TabPills
          value={tab}
          onChange={setTab}
          tabs={Object.keys(LABEL).map((k) => ({
            key: k,
            label: LABEL[k],
            count: withFu.filter((r) => r.bucket === k).length,
          }))}
        />
      </Toolbar>
      <DataTable
        rows={list}
        rowKey={(r) => r.leadId}
        resetKey={tab}
        empty={
          <EmptyState
            title={`No ${LABEL[tab].toLowerCase()} follow-ups`}
            hint="Schedule one from My Leads when updating a lead."
          />
        }
        columns={[
          {
            key: "c",
            header: "Company",
            className: "max-w-56 truncate font-semibold",
            render: (r) => (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={String(r.leadId) === String(targetLeadId) ? "font-bold text-primary underline" : ""}>
                  {r.lead.company}
                </span>
                {r.adminReminded && (
                  <span className="inline-flex items-center rounded-full bg-red-100 border border-red-300 px-1.5 py-0.2 text-[9px] font-bold text-red-700">
                    ⚠️ Immediate action required!
                  </span>
                )}
                {String(r.leadId) === String(targetLeadId) && (
                  <span className="inline-flex items-center rounded-full bg-blue-100 border border-blue-300 px-1.5 py-0.2 text-[9px] font-bold text-blue-700">
                    Selected
                  </span>
                )}
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
            key: "ph",
            header: "Phone",
            className: "num whitespace-nowrap text-muted-foreground",
            render: (r) => (
              <a
                href={`tel:${r.lead.phone}`}
                className="hover:underline text-foreground/90 font-medium"
              >
                {r.lead.phone}
              </a>
            ),
          },
          {
            key: "n",
            header: "Note",
            className: "max-w-56 truncate text-muted-foreground",
            render: (r) => r.followUp.note,
          },
          {
            key: "s",
            header: "Stage",
            render: (r) => <StageBadge stage={r.stage} />,
          },
          {
            key: "d",
            header: tab === "done" ? "Completed" : "Due",
            className:
              "whitespace-nowrap " +
              (tab === "overdue"
                ? "font-semibold text-destructive"
                : "text-muted-foreground"),
            render: (r) =>
              formatDate(
                tab === "done"
                  ? (r.followUp.doneOn ?? r.followUp.on)
                  : r.followUp.on,
              ),
          },
          {
            key: "x",
            header: "Action",
            align: "right",
            render: (r) =>
              tab === "done" ? null : (
                <div className="flex justify-end gap-1.5">
                  <Button
                    size="xs"
                    variant="success-soft"
                    onClick={() => done(r)}
                  >
                    <Check /> Done
                  </Button>
                  <Button
                    size="xs"
                    variant="soft"
                    onClick={() => setEditId(r.leadId)}
                  >
                    <Pencil /> Update
                  </Button>
                </div>
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

import { useMemo, useState } from "react";
import { Check, Pencil } from "lucide-react";
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
  const [tab, setTab] = useState("overdue");
  const [editId, setEditId] = useState(null);
  const withFu = rows.filter((r) => r.followUp);
  const list = useMemo(
    () =>
      withFu
        .filter((r) => r.bucket === tab)
        .sort((a, b) => (a.followUp.on < b.followUp.on ? -1 : 1)),
    [withFu, tab],
  );
  const editing = rows.find((r) => r.leadId === editId) ?? null;

  const done = (r) => {
    dispatch({ type: "bdeCompleteFollowUp", bde, leadId: r.leadId });
    toast.success(`Follow-up with ${r.lead.company} marked done`);
  };

  return (
    <Panel>
      <PanelHeader
        title="My Follow-ups"
        subtitle="Complete a call, or update the lead to reschedule"
      />
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
            key: "ph",
            header: "Phone",
            className: "num whitespace-nowrap text-muted-foreground",
            render: (r) => r.lead.phone,
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

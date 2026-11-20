import { useState } from "react";
import { UserPlus, Users } from "lucide-react";
import { Panel, PanelHeader } from "@/components/common/Panel";
import { Button } from "@/components/ui/button";
import { AddMemberDialog } from "@/components/dashboard/QuickActions";
import { PerformanceTable, PersonCell } from "@/components/dashboard/PerformanceTable";
import { useLeadGen } from "@/lib/leadgen/store";

export default function TeamPage() {
  const { state } = useLeadGen();
  const [open, setOpen] = useState(false);
  return (
    <Panel>
      <PanelHeader
        title={`Team Members (${state.team.length})`}
        subtitle="Research Analysts and BDEs"
        icon={
          <div className="flex size-8 items-center justify-center rounded-lg bg-tint-green text-tint-green-foreground">
            <Users className="size-4" />
          </div>
        }
        actions={
          <Button size="sm" onClick={() => setOpen(true)}>
            <UserPlus /> Add Team Member
          </Button>
        }
      />
      <PerformanceTable
        rows={state.team}
        rowKey={(m) => m.email}
        columns={[
          { key: "n", header: "Name", render: (m) => <PersonCell name={m.name} /> },
          {
            key: "r",
            header: "Role",
            render: (m) => (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${m.role === "BDE" ? "bg-tint-violet text-tint-violet-foreground" : "bg-tint-blue text-tint-blue-foreground"}`}
              >
                {m.role}
              </span>
            ),
          },
          {
            key: "e",
            header: "Email",
            render: (m) => <span className="text-muted-foreground">{m.email}</span>,
          },
          {
            key: "p",
            header: "Phone",
            render: (m) => <span className="text-muted-foreground">{m.phone || "—"}</span>,
          },
        ]}
      />
      <div className="h-2" />
      <AddMemberDialog open={open} onOpenChange={setOpen} />
    </Panel>
  );
}

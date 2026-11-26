import { useState, useMemo } from "react";
import { UserPlus, Users } from "lucide-react";
import { Panel, PanelHeader } from "@/components/common/Panel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddMemberDialog } from "@/components/dashboard/QuickActions";
import {
  PerformanceTable,
  PersonCell,
} from "@/components/dashboard/PerformanceTable";
import { useLeadGen } from "@/lib/leadgen/store";
import { getMemberCategory } from "@/lib/leadgen/data";
import { cn } from "@/lib/utils";

export default function TeamPage() {
  const { state } = useLeadGen();
  const [open, setOpen] = useState(false);
  const [roleTab, setRoleTab] = useState("bde");

  const bdeTeam = useMemo(
    () =>
      (state.team || []).filter(
        (m) => (m.role || "").trim().toUpperCase() === "BDE",
      ),
    [state.team],
  );

  const raTeam = useMemo(
    () =>
      (state.team || []).filter(
        (m) =>
          (m.role || "").toLowerCase().includes("research") ||
          (m.role || "").trim().toUpperCase() === "RA" ||
          (m.role || "").trim().toUpperCase() !== "BDE",
      ),
    [state.team],
  );

  const displayedTeam = roleTab === "bde" ? bdeTeam : raTeam;

  const nameCol = { key: "n", header: "Name", render: (m) => <PersonCell name={m.name} /> };
  const roleCol = {
    key: "r",
    header: "Role",
    render: (m) => (
      <span
        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
          m.role === "BDE"
            ? "bg-tint-violet text-tint-violet-foreground"
            : "bg-tint-blue text-tint-blue-foreground"
        }`}
      >
        {m.role}
      </span>
    ),
  };
  const categoryCol = {
    key: "c",
    header: "Category",
    render: (m) => (
      <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
        {getMemberCategory(m)}
      </span>
    ),
  };
  const emailCol = { key: "e", header: "Email", render: (m) => <span className="text-muted-foreground">{m.email}</span> };
  const phoneCol = { key: "p", header: "Phone", render: (m) => <span className="text-muted-foreground">{m.phone || "—"}</span> };
  const statusCol = {
    key: "s",
    header: "Status",
    render: (m) => {
      const isActive = (m.status || "Active").toLowerCase() === "active";
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
            isActive
              ? "bg-tint-green text-tint-green-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          <span className={cn("size-1.5 rounded-full", isActive ? "bg-emerald-500" : "bg-zinc-400")} />
          {m.status || "Active"}
        </span>
      );
    },
  };

  // BDE tab: show Category column; RA tab: no Category column
  const bdeColumns = [nameCol, roleCol, categoryCol, emailCol, phoneCol, statusCol];
  const raColumns = [nameCol, roleCol, emailCol, phoneCol, statusCol];

  return (
    <Panel className="h-full">
      <Tabs
        value={roleTab}
        onValueChange={setRoleTab}
        className="flex h-full flex-col gap-0"
      >
        <PanelHeader
          title={`Team Members (${displayedTeam.length})`}
          subtitle={
            roleTab === "bde"
              ? "Business Development Executives (BDE)"
              : "Research Analysts (RA)"
          }
          icon={
            <div className="flex size-8 items-center justify-center rounded-lg bg-tint-green text-tint-green-foreground">
              <Users className="size-4" />
            </div>
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <TabsList className="h-8">
                <TabsTrigger
                  value="bde"
                  onClick={() => setRoleTab("bde")}
                  className="px-3 text-xs"
                >
                  BDE
                </TabsTrigger>
                <TabsTrigger
                  value="ra"
                  onClick={() => setRoleTab("ra")}
                  className="px-3 text-xs"
                >
                  Research Analyst
                </TabsTrigger>
              </TabsList>
              <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5">
                <UserPlus className="size-4" /> Add Team Member
              </Button>
            </div>
          }
        />
        <TabsContent value="bde" className="mt-0 flex-1">
          <PerformanceTable
            rows={bdeTeam}
            rowKey={(m) => m.email}
            columns={bdeColumns}
          />
        </TabsContent>
        <TabsContent value="ra" className="mt-0 flex-1">
          <PerformanceTable
            rows={raTeam}
            rowKey={(m) => m.email}
            columns={raColumns}
          />
        </TabsContent>
      </Tabs>
      <div className="h-2" />
      <AddMemberDialog
        open={open}
        onOpenChange={setOpen}
        defaultRole={roleTab === "ra" ? "Research Analyst" : "BDE"}
        onMemberAdded={(newRole) => {
          setRoleTab(newRole === "Research Analyst" ? "ra" : "bde");
        }}
      />
    </Panel>
  );
}

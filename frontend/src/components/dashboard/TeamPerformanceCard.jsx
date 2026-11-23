import { Trophy } from "lucide-react";
import { Panel, PanelHeader } from "@/components/common/Panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLeadGen } from "@/lib/leadgen/store";
import { RA_PERFORMANCE, fmt, pct } from "@/lib/leadgen/data";
import { PerformanceTable, PersonCell, RatePill } from "./PerformanceTable";

export function TeamPerformanceCard() {
  const { state } = useLeadGen();
  const bdes = (state.bdes || []).map((b) => {
    const assignedLeads = (state.leads || []).filter(
      (l) => l.assignedName === b.name || l.assignedTo === b.name,
    );
    const connected =
      typeof b.connected === "number"
        ? b.connected
        : assignedLeads.filter((l) =>
            ["connected", "interested", "follow-up"].includes(l.stage),
          ).length;
    const interested =
      typeof b.interested === "number"
        ? b.interested
        : assignedLeads.filter((l) => l.stage === "interested").length;

    return {
      ...b,
      allocated: Number(b.allocated) || 0,
      used: Number(b.used) || 0,
      connected,
      interested,
    };
  });

  const t = bdes.reduce(
    (a, b) => ({
      allocated: a.allocated + b.allocated,
      used: a.used + b.used,
      connected: a.connected + b.connected,
      interested: a.interested + b.interested,
    }),
    { allocated: 0, used: 0, connected: 0, interested: 0 },
  );
  const bdeCols = [
    {
      key: "name",
      header: "BDE Name",
      render: (r) => <PersonCell name={r.name} />,
      total: "Total",
    },
    {
      key: "alloc",
      header: "Credits Allocated",
      align: "right",
      render: (r) => fmt(r.allocated),
      total: fmt(t.allocated),
    },
    {
      key: "used",
      header: "Credits Used",
      align: "right",
      render: (r) => fmt(r.used),
      total: fmt(t.used),
    },
    {
      key: "conn",
      header: "Connected",
      align: "right",
      render: (r) => fmt(r.connected),
      total: fmt(t.connected),
    },
    {
      key: "int",
      header: "Interested",
      align: "right",
      render: (r) => fmt(r.interested),
      total: fmt(t.interested),
    },
    {
      key: "conv",
      header: "Conversion",
      align: "right",
      render: (r) => <RatePill value={pct(r.interested, r.used)} />,
      total: <RatePill value={pct(t.interested, t.used)} />,
    },
  ];

  const ra = RA_PERFORMANCE;
  const rt = ra.reduce(
    (a, r) => ({
      uploaded: a.uploaded + r.uploaded,
      approved: a.approved + r.approved,
      rejected: a.rejected + r.rejected,
    }),
    { uploaded: 0, approved: 0, rejected: 0 },
  );
  const raCols = [
    {
      key: "name",
      header: "RA Name",
      render: (r) => <PersonCell name={r.name} />,
      total: "Total",
    },
    {
      key: "up",
      header: "Leads Uploaded",
      align: "right",
      render: (r) => fmt(r.uploaded),
      total: fmt(rt.uploaded),
    },
    {
      key: "ap",
      header: "Approved",
      align: "right",
      render: (r) => fmt(r.approved),
      total: fmt(rt.approved),
    },
    {
      key: "rj",
      header: "Rejected",
      align: "right",
      render: (r) => fmt(r.rejected),
      total: fmt(rt.rejected),
    },
    {
      key: "rate",
      header: "Approval Rate",
      align: "right",
      render: (r) => (
        <RatePill value={pct(r.approved, r.uploaded)} tone="blue" />
      ),
      total: <RatePill value={pct(rt.approved, rt.uploaded)} tone="blue" />,
    },
  ];

  return (
    <Panel className="h-full">
      <Tabs defaultValue="bde" className="flex h-full flex-col gap-0">
        <PanelHeader
          title={`Team Performance – ${state.dateRange === "Custom" ? "Custom Range" : state.dateRange}`}
          subtitle="Credits, connections and conversions by team member"
          icon={
            <div className="flex size-8 items-center justify-center rounded-lg bg-tint-amber text-tint-amber-foreground">
              <Trophy className="size-4" />
            </div>
          }
          actions={
            <TabsList className="h-8">
              <TabsTrigger value="bde" className="px-3 text-xs">
                BDE
              </TabsTrigger>
              <TabsTrigger value="ra" className="px-3 text-xs">
                Research Analyst
              </TabsTrigger>
            </TabsList>
          }
        />
        <TabsContent value="bde" className="mt-1 flex-1">
          <PerformanceTable
            columns={bdeCols}
            rows={bdes}
            rowKey={(r) => r.name}
            showTotal
            maxHeight="295px"
          />
        </TabsContent>
        <TabsContent value="ra" className="mt-1 flex-1">
          <PerformanceTable
            columns={raCols}
            rows={ra}
            rowKey={(r) => r.name}
            showTotal
            maxHeight="295px"
          />
        </TabsContent>
      </Tabs>
    </Panel>
  );
}

import { useState } from "react";
import { Coins, Gauge, PlusCircle, Wallet } from "lucide-react";
import { toast } from "sonner";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Panel, PanelHeader } from "@/components/common/Panel";
import { DataTable, EmptyState } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useBdeData } from "@/components/bde/useBdeData";
import { UNLOCK_COST } from "@/lib/leadgen/bde";
import { fmt, formatDate, pct } from "@/lib/leadgen/data";
import { useLeadGen } from "@/lib/leadgen/store";

export default function BdeCredits() {
  const { kpis, log, dispatch, bde } = useBdeData();
  const { state } = useLeadGen();
  const [amount, setAmount] = useState("50");
  const [reason, setReason] = useState("");
  const utilization = Math.round(pct(kpis.used, kpis.allocated));
  const byId = new Map(state.leads.map((l) => [l.id, l]));

  const request = (e) => {
    e.preventDefault();
    const n = Number(amount);
    if (!Number.isInteger(n) || n <= 0) return void toast.error("Enter a whole number of credits");
    if (!reason.trim()) return void toast.error("Add a reason for the request");
    dispatch({ type: "bdeRequestCredits", bde, amount: n, reason });
    setReason("");
    toast.success(`Requested ${fmt(n)} credits from the Master Admin`);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Credits Allocated"
          value={fmt(kpis.allocated)}
          icon={Wallet}
          tone="blue"
          hint="Set by the Master Admin"
        />
        <KpiCard
          label="Credits Used"
          value={fmt(kpis.used)}
          icon={Coins}
          tone="violet"
          hint={`${UNLOCK_COST} per unlocked contact`}
        />
        <KpiCard
          label="Credits Available"
          value={fmt(kpis.available)}
          icon={PlusCircle}
          tone="green"
          hint={kpis.available < 20 ? "Running low" : "Ready to use"}
          hintTone={kpis.available < 20 ? "down" : "up"}
        />
        <KpiCard
          label="Utilization"
          value={`${utilization}%`}
          icon={Gauge}
          tone="amber"
          hint="Used / allocated"
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-12">
        <Panel className="min-w-0 xl:col-span-8">
          <PanelHeader
            title="Credit activity"
            subtitle="Unlocks and requests made in this session"
          />
          <div className="flex items-center gap-3 px-4 pb-3">
            <Progress value={utilization} className="h-2" />
            <span className="num whitespace-nowrap text-xs text-muted-foreground">
              {fmt(kpis.used)} / {fmt(kpis.allocated)}
            </span>
          </div>
          <DataTable
            rows={log}
            rowKey={(c) => `${c.on}-${c.kind}-${c.leadId ?? c.note}-${log.indexOf(c)}`}
            empty={
              <EmptyState
                title="No credit activity yet"
                hint="Unlock a contact from My Leads, or request more credits."
              />
            }
            columns={[
              {
                key: "d",
                header: "Date",
                className: "whitespace-nowrap text-muted-foreground",
                render: (c) => formatDate(c.on),
              },
              {
                key: "k",
                header: "Type",
                render: (c) => (
                  <span
                    className={
                      c.kind === "Used"
                        ? "font-semibold text-tint-violet-foreground"
                        : "font-semibold text-primary"
                    }
                  >
                    {c.kind === "Used" ? "Contact unlocked" : "Top-up requested"}
                  </span>
                ),
              },
              {
                key: "x",
                header: "Details",
                className: "max-w-64 truncate",
                render: (c) =>
                  c.kind === "Used"
                    ? byId.get(c.leadId)?.company
                    : `${c.note} · awaiting Master Admin`,
              },
              {
                key: "a",
                header: "Credits",
                align: "right",
                render: (c) => (
                  <span className="num font-semibold">
                    {c.kind === "Used" ? `−${c.amount}` : `+${c.amount}`}
                  </span>
                ),
              },
            ]}
          />
        </Panel>
        <Panel className="xl:col-span-4">
          <PanelHeader
            title="Request more credits"
            subtitle="Sent to the Master Admin for approval"
          />
          <form onSubmit={request} className="grid gap-3 px-4 pb-4">
            <div className="grid gap-1.5">
              <Label htmlFor="cr-amt">Credits</Label>
              <Input
                id="cr-amt"
                type="number"
                min={1}
                step={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cr-why">Reason</Label>
              <Textarea
                id="cr-why"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. New campaign leads assigned this week"
              />
            </div>
            <Button type="submit">Send request</Button>
          </form>
        </Panel>
      </div>
    </div>
  );
}

import { useState } from "react";
import {
  Coins,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { CreditSummaryCard } from "@/components/dashboard/CreditSummaryCard";
import { TeamPerformanceCard } from "@/components/dashboard/TeamPerformanceCard";
import { Panel, PanelHeader } from "@/components/common/Panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AllocateCreditsDialog } from "@/components/dashboard/QuickActions";
import { useLeadGen } from "@/lib/leadgen/store";
import { api } from "@/lib/api";
import { fmt, formatDate } from "@/lib/leadgen/data";

export default function CreditsPage() {
  const { state, dispatch } = useLeadGen();
  const [openAllocate, setOpenAllocate] = useState(false);
  const [approvedRequests, setApprovedRequests] = useState(new Set());

  // Filter requests from credit log where kind is "Requested"
  const requests = (state.creditLog || [])
    .filter(
      (c) =>
        c.kind === "Requested" &&
        !approvedRequests.has(`${c.bde}-${c.amount}-${c.on}`),
    )
    .slice(0, 10);

  const handleApproveRequest = async (req) => {
    try {
      dispatch({ type: "allocate", bde: req.bde, amount: req.amount });
      api.allocateCredits(req.bde, req.amount).catch(() => {});
      setApprovedRequests((prev) =>
        new Set(prev).add(`${req.bde}-${req.amount}-${req.on}`),
      );
      toast.success(
        `Approved and allocated ${fmt(req.amount)} credits to ${req.bde}!`,
      );
    } catch (err) {
      toast.error(err.message || "Failed to approve credits");
    }
  };

  return (
    <div className="space-y-4">
      {/* Top action banner */}
      <div className="flex flex-col gap-2 rounded-lg border bg-card p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-bold text-foreground">
            BDE Credit Management & Governance
          </h2>
          <p className="text-xs text-muted-foreground">
            Manage credit allowances, monitor team usage, and fulfill top-up
            requests from BDEs.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setOpenAllocate(true)}
          className="gap-1.5 self-start text-xs font-semibold sm:self-auto"
        >
          <Coins className="size-3.5" /> Allocate Credits
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <CreditSummaryCard />
        </div>
        <div className="xl:col-span-8">
          <TeamPerformanceCard />
        </div>
      </div>

      {/* Credit Top-up Requests Section */}
      <Panel>
        <PanelHeader
          title={`BDE Credit Top-Up Requests (${requests.length})`}
          subtitle="Requests submitted by BDEs when running low on contact unlock credits"
          icon={
            <div className="flex size-8 items-center justify-center rounded-lg bg-tint-violet text-tint-violet-foreground">
              <PlusCircle className="size-4" />
            </div>
          }
        />
        <div className="p-4">
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
              <CheckCircle2 className="size-8 text-emerald-500" />
              <div className="mt-2 text-sm font-semibold text-foreground">
                All Credit Requests Up to Date
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                There are currently no pending credit top-up requests from BDEs.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b bg-muted/40 font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2.5">BDE</th>
                    <th className="px-3 py-2.5">Requested Amount</th>
                    <th className="px-3 py-2.5">Reason / Campaign</th>
                    <th className="px-3 py-2.5">Date</th>
                    <th className="px-3 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {requests.map((r, i) => (
                    <tr
                      key={`${r.bde}-${r.amount}-${i}`}
                      className="hover:bg-muted/20"
                    >
                      <td className="px-3 py-2.5 font-semibold text-foreground">
                        {r.bde}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge
                          variant="secondary"
                          className="font-mono text-xs font-bold text-violet-700"
                        >
                          +{fmt(r.amount)} Credits
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {r.note || "Campaign lead outreach"}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="size-3 text-muted-foreground/70" />
                          {formatDate(r.on)}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <Button
                          size="xs"
                          onClick={() => handleApproveRequest(r)}
                          className="gap-1 font-semibold"
                        >
                          <CheckCircle2 className="size-3" /> Approve &amp;
                          Allocate
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Panel>

      <AllocateCreditsDialog
        open={openAllocate}
        onOpenChange={setOpenAllocate}
      />
    </div>
  );
}

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, PencilLine, Upload } from "lucide-react";
import { Panel, PanelHeader } from "@/components/common/Panel";
import { DataTable, EmptyState } from "@/components/common/DataTable";
import { FilterSelect, SearchBox, Toolbar } from "@/components/common/Toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BATCH_STATUSES, BatchStatusBadge } from "@/components/ra/badges";
import { useRaData } from "@/components/ra/useRaData";
import { StatusBadge } from "@/components/dashboard/RaPerformanceCard";
import { fmt, formatDate } from "@/lib/leadgen/data";

export default function MyUploads() {
  const { batches, leads } = useRaData();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [open, setOpen] = useState(null);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return batches.filter(
      (b) =>
        (!s ||
          b.id.toLowerCase().includes(s) ||
          b.fileName.toLowerCase().includes(s)) &&
        (status === "all" || b.status === status) &&
        (!from || b.uploadedOn >= from) &&
        (!to || b.uploadedOn <= to),
    );
  }, [batches, q, status, from, to]);

  return (
    <Panel>
      <PanelHeader
        title={`Upload History (${fmt(batches.length)} batches)`}
        subtitle="Every file you've uploaded and where its leads stand"
        actions={
          <Button asChild size="sm">
            <Link to="/ra/upload">
              <Upload /> Upload Leads
            </Link>
          </Button>
        }
      />
      <Toolbar>
        <SearchBox
          value={q}
          onChange={setQ}
          placeholder="Search batch ID or file name…"
        />
        <FilterSelect
          value={status}
          onChange={setStatus}
          all="All statuses"
          options={BATCH_STATUSES}
          label="Batch status"
        />
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-8 w-36 text-xs"
            aria-label="From date"
          />
          to
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-8 w-36 text-xs"
            aria-label="To date"
          />
        </div>
        {(q || status !== "all" || from || to) && (
          <Button
            size="xs"
            variant="ghost"
            onClick={() => {
              setQ("");
              setStatus("all");
              setFrom("");
              setTo("");
            }}
          >
            Clear
          </Button>
        )}
      </Toolbar>
      <DataTable
        rows={rows}
        rowKey={(b) => b.id}
        resetKey={`${q}|${status}|${from}|${to}`}
        empty={
          <EmptyState
            title="No batches match"
            hint="Try a different search, status or date range."
          />
        }
        columns={[
          {
            key: "id",
            header: "Batch ID",
            render: (b) => (
              <span className="whitespace-nowrap font-semibold">{b.id}</span>
            ),
          },
          {
            key: "f",
            header: "File Name",
            className: "max-w-40 truncate",
            render: (b) => <span title={b.fileName}>{b.fileName}</span>,
          },
          {
            key: "d",
            header: "Upload Date",
            render: (b) => (
              <span className="whitespace-nowrap text-muted-foreground">
                {formatDate(b.uploadedOn)}
              </span>
            ),
          },
          {
            key: "t",
            header: "Total",
            align: "right",
            render: (b) => fmt(b.totalRecords),
          },
          {
            key: "v",
            header: "Valid",
            align: "right",
            render: (b) => fmt(b.validRecords),
          },
          {
            key: "p",
            header: "Pending",
            align: "right",
            render: (b) => fmt(b.pending),
          },
          {
            key: "a",
            header: "Approved",
            align: "right",
            render: (b) => (
              <span className="text-success">{fmt(b.approved)}</span>
            ),
          },
          {
            key: "r",
            header: "Rejected",
            align: "right",
            render: (b) => (
              <span className="text-destructive">{fmt(b.rejected)}</span>
            ),
          },
          {
            key: "du",
            header: "Duplicate Records",
            align: "right",
            render: (b) => fmt(b.duplicates),
          },
          {
            key: "s",
            header: "Status",
            render: (b) => <BatchStatusBadge status={b.status} />,
          },
          {
            key: "x",
            header: "Action",
            align: "right",
            render: (b) =>
              b.draft ? (
                <Button
                  size="xs"
                  variant="soft"
                  onClick={() => navigate({ to: "/ra/upload" })}
                >
                  <PencilLine /> Continue
                </Button>
              ) : (
                <Button size="xs" variant="outline" onClick={() => setOpen(b)}>
                  <Eye /> View Details
                </Button>
              ),
          },
        ]}
      />
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="sm:max-w-2xl">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {open.id} <BatchStatusBadge status={open.status} />
                </DialogTitle>
                <DialogDescription>
                  {open.fileName} · uploaded {formatDate(open.uploadedOn)}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {[
                  ["Total", open.totalRecords],
                  ["Valid", open.validRecords],
                  ["Pending", open.pending],
                  ["Approved", open.approved],
                  ["Rejected", open.rejected],
                  ["Duplicates", open.duplicates],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-muted p-2.5">
                    <div className="num text-base font-bold">{fmt(v)}</div>
                    <div className="text-[11px] text-muted-foreground">{k}</div>
                  </div>
                ))}
              </div>
              <div className="max-h-72 overflow-auto rounded-lg border">
                <table className="w-full text-[13px]">
                  <thead className="sticky top-0 bg-muted text-[11px] uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">Company</th>
                      <th className="px-3 py-2 text-left">Contact</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads
                      .filter((l) => l.batchId === open.id)
                      .map((l) => (
                        <tr key={l.id} className="border-t">
                          <td className="px-3 py-1.5 font-medium">
                            {l.company}
                          </td>
                          <td className="px-3 py-1.5 text-muted-foreground">
                            {l.contact}
                          </td>
                          <td className="px-3 py-1.5">
                            <StatusBadge status={l.status} />
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Panel>
  );
}

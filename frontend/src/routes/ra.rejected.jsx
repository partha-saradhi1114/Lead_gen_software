import { useEffect, useMemo, useState } from "react";
import { History, PencilLine } from "lucide-react";
import { toast } from "sonner";
import { Panel, PanelHeader } from "@/components/common/Panel";
import { DataTable, EmptyState } from "@/components/common/DataTable";
import { FilterSelect, SearchBox, Toolbar } from "@/components/common/Toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRaData } from "@/components/ra/useRaData";
import {
  INDUSTRIES,
  REJECTION_REASONS,
  fmt,
  formatDate,
} from "@/lib/leadgen/data";
import { isValidEmail, isValidPhone } from "@/lib/leadgen/validation";

export default function RejectedLeads() {
  const { leads } = useRaData();
  const [q, setQ] = useState("");
  const [reason, setReason] = useState("all");
  const [industry, setIndustry] = useState("all");
  const [edit, setEdit] = useState(null);
  const rejected = useMemo(
    () => leads.filter((l) => l.status === "rejected"),
    [leads],
  );
  const resubmitted = leads.filter(
    (l) => l.status === "pending" && l.history?.length,
  ).length;

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rejected.filter(
      (l) =>
        (reason === "all" || (l.rejectionReason ?? "").startsWith(reason)) &&
        (industry === "all" || l.industry === industry) &&
        (!s ||
          l.company.toLowerCase().includes(s) ||
          l.contact.toLowerCase().includes(s)),
    );
  }, [rejected, q, reason, industry]);

  return (
    <Panel>
      <PanelHeader
        title={`Rejected Leads (${fmt(rejected.length)})`}
        subtitle="Correct the data and resubmit — the original rejection stays on record"
        actions={
          resubmitted > 0 ? (
            <Button asChild size="xs" variant="soft">
              <Link to="/ra/status">{resubmitted} resubmitted · track</Link>
            </Button>
          ) : undefined
        }
      />
      <Toolbar>
        <SearchBox
          value={q}
          onChange={setQ}
          placeholder="Search company or contact…"
        />
        <FilterSelect
          value={reason}
          onChange={setReason}
          all="All reasons"
          options={REJECTION_REASONS}
          label="Rejection reason"
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
        rows={rows}
        rowKey={(l) => l.id}
        resetKey={`${q}|${reason}|${industry}`}
        empty={
          <EmptyState
            title="No rejected leads"
            hint="Leads the Master Admin rejects will appear here so you can fix and resubmit them."
          />
        }
        columns={[
          {
            key: "c",
            header: "Company",
            className: "max-w-52 truncate font-semibold",
            render: (l) => l.company,
          },
          {
            key: "p",
            header: "Contact Person",
            className: "whitespace-nowrap",
            render: (l) => l.contact,
          },
          { key: "i", header: "Industry", render: (l) => l.industry ?? "—" },
          {
            key: "s",
            header: "Submitted",
            className: "whitespace-nowrap text-muted-foreground",
            render: (l) => formatDate(l.resubmittedOn ?? l.uploadedOn),
          },
          {
            key: "r",
            header: "Rejected",
            className: "whitespace-nowrap text-muted-foreground",
            render: (l) => (l.reviewedOn ? formatDate(l.reviewedOn) : "—"),
          },
          {
            key: "re",
            header: "Rejection Reason",
            className: "min-w-44",
            render: (l) => (
              <div>
                <span className="rounded-full bg-tint-red px-2 py-0.5 text-[11px] font-semibold text-tint-red-foreground">
                  {l.rejectionReason}
                </span>
                {l.history?.length ? (
                  <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <History className="size-3" /> Rejected{" "}
                    {l.history.length + 1}×
                  </div>
                ) : null}
              </div>
            ),
          },
          {
            key: "a",
            header: "Action",
            align: "right",
            render: (l) => (
              <Button size="xs" variant="soft" onClick={() => setEdit(l)}>
                <PencilLine /> Correct &amp; resubmit
              </Button>
            ),
          },
        ]}
      />
      <ResubmitDialog lead={edit} onClose={() => setEdit(null)} />
    </Panel>
  );
}

const FIELDS = [
  ["company", "Company Name"],
  ["contact", "Contact Person"],
  ["designation", "Designation"],
  ["phone", "Phone Number"],
  ["email", "Email"],
  ["location", "Location"],
  ["industry", "Industry"],
];

function ResubmitDialog({ lead, onClose }) {
  const { dispatch } = useRaData();
  const [v, setV] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (lead) {
      setV(Object.fromEntries(FIELDS.map(([k]) => [k, String(lead[k] ?? "")])));
      setErrors({});
    }
  }, [lead]);

  const submit = () => {
    const e = {};
    for (const [k, label] of FIELDS)
      if (k !== "email" && !v[k]?.trim()) e[k] = `${label} is required`;
    if (v.phone && !isValidPhone(v.phone))
      e.phone = "Enter a valid 10-digit mobile number";
    if (v.email && !isValidEmail(v.email))
      e.email = "Enter a valid email address";
    setErrors(e);
    if (Object.keys(e).length)
      return void toast.error("Please fix the highlighted fields");
    dispatch({
      type: "resubmit",
      id: lead.id,
      changes: Object.fromEntries(FIELDS.map(([k]) => [k, v[k].trim()])),
    });
    toast.success(`${v.company} resubmitted for review`, {
      description: "The earlier rejection is kept in the lead's history.",
    });
    onClose();
  };

  return (
    <Dialog open={!!lead} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {lead && (
          <>
            <DialogHeader>
              <DialogTitle>Correct &amp; resubmit</DialogTitle>
              <DialogDescription>
                Lead #{lead.id} · batch {lead.batchId}
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-md bg-tint-red px-3 py-2 text-xs text-tint-red-foreground">
              <div className="font-semibold">
                Rejected
                {lead.reviewedOn
                  ? ` on ${formatDate(lead.reviewedOn)}`
                  : ""}: {lead.rejectionReason}
              </div>
              {lead.history?.map((h, i) => (
                <div key={i} className="opacity-80">
                  Earlier: {h.reason} ({formatDate(h.rejectedOn)})
                </div>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {FIELDS.map(([k, label]) => (
                <div key={k} className="space-y-1">
                  <Label htmlFor={`rs-${k}`} className="text-xs">
                    {label}
                    {k !== "email" && " *"}
                  </Label>
                  <Input
                    id={`rs-${k}`}
                    value={v[k] ?? ""}
                    onChange={(e) =>
                      setV((s) => ({ ...s, [k]: e.target.value }))
                    }
                    aria-invalid={!!errors[k]}
                    className={errors[k] ? "border-destructive" : ""}
                  />
                  {errors[k] && (
                    <p className="text-[11px] text-destructive">{errors[k]}</p>
                  )}
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={submit}>Resubmit for review</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

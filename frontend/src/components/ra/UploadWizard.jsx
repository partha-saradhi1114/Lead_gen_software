import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  FileSpreadsheet,
  Loader2,
  PartyPopper,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Panel, PanelHeader } from "@/components/common/Panel";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { TabPills } from "@/components/common/Toolbar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLeadGen } from "@/lib/leadgen/store";
import {
  CURRENT_RA,
  LEAD_SOURCES,
  TODAY,
  batchIdFor,
  fmt,
} from "@/lib/leadgen/data";
import { downloadTemplate, readSheetFile } from "@/lib/leadgen/excel";
import {
  MAX_FILE_MB,
  TEMPLATE_FIELDS,
  checkFile,
  rowsFromSheet,
  sampleSheet,
  summarize,
  validateRows,
} from "@/lib/leadgen/validation";
import { cn } from "@/lib/utils";

const STEPS = [
  "Upload File",
  "Preview Data",
  "Validation",
  "Upload Summary",
  "Submit",
];

export function UploadWizard() {
  const { state, dispatch } = useLeadGen();
  const inputRef = useRef(null);
  const [step, setStep] = useState(0);
  const [drag, setDrag] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);
  const [removed, setRemoved] = useState(new Set());
  const [filter, setFilter] = useState("all");
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [doneBatch, setDoneBatch] = useState(null);

  const kept = useMemo(
    () => rows.filter((r) => !removed.has(r.rowNo)),
    [rows, removed],
  );
  const validated = useMemo(
    () => validateRows(kept, state.leads),
    [kept, state.leads],
  );
  const summary = summarize(validated);
  const visible =
    filter === "all" ? validated : validated.filter((r) => r.status === filter);

  const reset = () => {
    setStep(0);
    setFileName("");
    setFileSize(0);
    setProgress(null);
    setError(null);
    setRows([]);
    setRemoved(new Set());
    setFilter("all");
    setDoneBatch(null);
  };

  const loadRows = (aoa, name, size) => {
    const { rows: parsed, missingColumns } = rowsFromSheet(aoa);
    if (missingColumns.length) {
      setError(
        `Missing required column${missingColumns.length > 1 ? "s" : ""}: ${missingColumns.join(", ")}. Please use the sample template.`,
      );
      toast.error("File doesn't match the template");
      return;
    }
    if (parsed.length === 0) {
      setError("No lead records found below the header row.");
      toast.error("No records found in the file");
      return;
    }
    setFileName(name);
    setFileSize(size);
    setRows(parsed);
    setRemoved(new Set());
    setError(null);
    setStep(1);
    toast.success(`${parsed.length} records read from ${name}`);
  };

  const handleFile = async (file) => {
    if (!file) return;
    const problem = checkFile(file);
    if (problem) {
      setError(problem);
      toast.error(problem);
      return;
    }
    setError(null);
    setProgress(0);
    try {
      const aoa = await readSheetFile(file, setProgress);
      await new Promise((r) => setTimeout(r, 300));
      loadRows(aoa, file.name, file.size);
    } catch {
      setError(
        "We couldn't read this file. Make sure it is a valid Excel or CSV file.",
      );
      toast.error("Could not read the file");
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const useSample = async () => {
    setError(null);
    for (const p of [20, 55, 85, 100]) {
      setProgress(p);
      await new Promise((r) => setTimeout(r, 120));
    }
    setProgress(null);
    loadRows(sampleSheet(), "sample_hospitals_south_india.xlsx", 18_432);
  };

  const removeRows = (nos, label) => {
    if (nos.length === 0) return;
    setRemoved((s) => new Set([...s, ...nos]));
    toast.success(`${nos.length} ${label} removed from this upload`);
  };

  const submit = async () => {
    const valid = validated.filter((r) => r.status === "valid");
    let seq = 1;
    while (
      state.batches.some((b) => b.id === batchIdFor(CURRENT_RA, TODAY, seq))
    )
      seq++;
    const id = batchIdFor(CURRENT_RA, TODAY, seq);
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 700));
    const toLead = (r) => {
      const v = r.values;
      const source =
        LEAD_SOURCES.find((s) => s.toLowerCase() === v.source.toLowerCase()) ??
        "Web";
      return {
        company: v.company,
        contact: v.contact,
        designation: v.designation,
        phone: v.phone,
        email: v.email,
        location: v.location,
        industry: v.industry,
        source,
        website: v.website || undefined,
        linkedin: v.linkedin || undefined,
        companySize: v.companySize || undefined,
        department: v.department || undefined,
        notes: v.notes || undefined,
      };
    };
    dispatch({
      type: "submitBatch",
      batch: {
        id,
        fileName,
        uploadedOn: TODAY,
        researcher: CURRENT_RA,
        totalRecords: rows.length,
        validRecords: valid.length,
        invalidRecords: summary.invalid,
        duplicates: summary.duplicate + [...removed].length,
      },
      rows: valid.map(toLead),
    });
    setSubmitting(false);
    setConfirm(false);
    setDoneBatch({ id, count: valid.length });
    toast.success(`Batch ${id} submitted for review`, {
      description: `${valid.length} valid records sent to the Master Admin.`,
    });
  };

  return (
    <div className="space-y-4">
      <Stepper step={doneBatch ? 5 : step} />

      {step === 0 && (
        <div className="grid gap-4 xl:grid-cols-12">
          <Panel className="xl:col-span-8">
            <PanelHeader
              title="Step 1 · Upload File"
              subtitle="Drag a lead sheet here or browse your computer"
            />
            <div className="px-4 pb-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDrag(false);
                  handleFile(e.dataTransfer.files[0]);
                }}
                className={cn(
                  "flex flex-col items-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
                  drag
                    ? "border-primary bg-primary-soft"
                    : "border-input bg-muted/40",
                  error && "border-destructive/60",
                )}
              >
                <div className="flex size-14 items-center justify-center rounded-2xl bg-tint-blue text-tint-blue-foreground">
                  <UploadCloud className="size-7" />
                </div>
                <div className="mt-3 text-sm font-semibold">
                  Drag and drop your Excel or CSV file
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Supported: .xlsx, .xls, .csv · Maximum {MAX_FILE_MB} MB
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => inputRef.current?.click()}
                    disabled={progress !== null}
                  >
                    <FileSpreadsheet /> Browse file
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={useSample}
                    disabled={progress !== null}
                  >
                    <Sparkles /> Try with sample data
                  </Button>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="sr-only"
                  aria-label="Lead file"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
                {progress !== null && (
                  <div className="mt-5 w-full max-w-sm">
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="size-3.5 animate-spin" /> Reading
                        file…
                      </span>
                      <span className="num">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
                {error && (
                  <div
                    className="mt-4 flex max-w-md items-start gap-2 rounded-md bg-tint-red px-3 py-2 text-left text-xs font-medium text-tint-red-foreground"
                    role="alert"
                  >
                    <XCircle className="mt-0.5 size-4 shrink-0" /> {error}
                  </div>
                )}
              </div>
            </div>
          </Panel>
          <Panel className="xl:col-span-4">
            <PanelHeader
              title="Upload instructions"
              actions={
                <Button
                  size="xs"
                  variant="soft"
                  onClick={() =>
                    downloadTemplate().then(() =>
                      toast.success("Template downloaded"),
                    )
                  }
                >
                  <Download /> Sample template
                </Button>
              }
            />
            <div className="space-y-3 px-4 pb-4 text-[13px]">
              <ol className="list-decimal space-y-1 pl-4 text-muted-foreground">
                <li>Download the sample template and keep its header row.</li>
                <li>
                  Fill one lead per row. Phone must be a 10-digit Indian mobile.
                </li>
                <li>Upload, preview, fix issues, then submit valid records.</li>
              </ol>
              <div>
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Required fields
                </div>
                <div className="flex flex-wrap gap-1">
                  {TEMPLATE_FIELDS.filter((f) => f.required).map((f) => (
                    <span
                      key={f.key}
                      className="rounded-full bg-tint-blue px-2 py-0.5 text-[11px] font-semibold text-tint-blue-foreground"
                    >
                      {f.label}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Optional fields
                </div>
                <div className="flex flex-wrap gap-1">
                  {TEMPLATE_FIELDS.filter((f) => !f.required).map((f) => (
                    <span
                      key={f.key}
                      className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                    >
                      {f.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {step >= 1 && !doneBatch && (
        <div className="panel flex flex-wrap items-center gap-3 px-4 py-2.5">
          <FileSpreadsheet className="size-5 text-success" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold">{fileName}</div>
            <div className="num text-[11px] text-muted-foreground">
              {(fileSize / 1024).toFixed(1)} KB · {fmt(rows.length)} records
            </div>
          </div>
          <Button size="xs" variant="ghost" onClick={reset}>
            <RotateCcw /> Choose another file
          </Button>
        </div>
      )}

      {step === 1 && (
        <Panel>
          <PanelHeader
            title="Step 2 · Preview Data"
            subtitle={`First ${Math.min(20, rows.length)} of ${rows.length} records`}
            actions={
              <Button size="sm" onClick={() => setStep(2)}>
                Run validation
              </Button>
            }
          />
          <RowsTable
            rows={rows.slice(0, 20).map((r) => ({
              ...r,
              errors: [],
              duplicates: [],
              status: "valid",
            }))}
            plain
          />
        </Panel>
      )}

      {step === 2 && (
        <Panel>
          <PanelHeader
            title="Step 3 · Validation"
            subtitle="Fix the file or remove problem rows. Duplicates are never merged into existing leads."
            actions={
              <>
                <Button size="sm" variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  size="sm"
                  onClick={() => setStep(3)}
                  disabled={summary.total === 0}
                >
                  Continue
                </Button>
              </>
            }
          />
          <div className="flex flex-wrap items-center gap-2 border-b px-4 pb-2.5">
            <TabPills
              value={filter}
              onChange={setFilter}
              tabs={[
                { key: "all", label: "All", count: summary.total },
                { key: "valid", label: "Valid", count: summary.valid },
                { key: "invalid", label: "Invalid", count: summary.invalid },
                {
                  key: "duplicate",
                  label: "Duplicates",
                  count: summary.duplicate,
                },
              ]}
            />
            <div className="ml-auto flex flex-wrap gap-2">
              <Button
                size="xs"
                variant="outline"
                disabled={summary.duplicate === 0}
                onClick={() =>
                  removeRows(
                    validated
                      .filter((r) => r.status === "duplicate")
                      .map((r) => r.rowNo),
                    "duplicate records",
                  )
                }
              >
                <Copy /> Remove duplicates
              </Button>
              <Button
                size="xs"
                variant="outline"
                disabled={summary.invalid === 0}
                onClick={() =>
                  removeRows(
                    validated
                      .filter((r) => r.status === "invalid")
                      .map((r) => r.rowNo),
                    "invalid records",
                  )
                }
              >
                <Trash2 /> Remove invalid
              </Button>
              {removed.size > 0 && (
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => setRemoved(new Set())}
                >
                  <RotateCcw /> Restore {removed.size} removed
                </Button>
              )}
            </div>
          </div>
          <RowsTable
            rows={visible}
            onRemove={(no) => removeRows([no], "record")}
          />
        </Panel>
      )}

      {step === 3 && (
        <Panel>
          <PanelHeader
            title="Step 4 · Upload Summary"
            subtitle="Only valid records will be sent for admin review"
            actions={
              <>
                <Button size="sm" variant="outline" onClick={() => setStep(2)}>
                  Back to validation
                </Button>
                <Button
                  size="sm"
                  onClick={() => setStep(4)}
                  disabled={summary.valid === 0}
                >
                  Continue
                </Button>
              </>
            }
          />
          <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryTile
              label="Total Records"
              value={rows.length}
              tone="bg-tint-blue text-tint-blue-foreground"
              icon={FileSpreadsheet}
            />
            <SummaryTile
              label="Valid Records"
              value={summary.valid}
              tone="bg-tint-green text-tint-green-foreground"
              icon={CheckCircle2}
            />
            <SummaryTile
              label="Invalid Records"
              value={summary.invalid}
              tone="bg-tint-red text-tint-red-foreground"
              icon={AlertTriangle}
            />
            <SummaryTile
              label="Duplicate Records"
              value={summary.duplicate}
              tone="bg-tint-violet text-tint-violet-foreground"
              icon={Copy}
            />
          </div>
          {removed.size > 0 && (
            <p className="px-4 pb-2 text-xs text-muted-foreground">
              {removed.size} rows removed by you are excluded from this upload.
            </p>
          )}
          <IssueBreakdown rows={validated} />
          {summary.valid === 0 && (
            <p className="px-4 pb-4 text-xs font-medium text-destructive">
              There are no valid records to submit. Go back and fix the file.
            </p>
          )}
        </Panel>
      )}

      {step === 4 && !doneBatch && (
        <Panel>
          <PanelHeader
            title="Step 5 · Final Submission"
            subtitle="Send valid records to the Master Admin for review"
          />
          <div className="grid gap-4 px-4 pb-4 md:grid-cols-2">
            <div className="space-y-2 rounded-lg bg-muted/60 p-3 text-[13px]">
              <Row k="File" v={fileName} />
              <Row k="Research Analyst" v={CURRENT_RA} />
              <Row k="Records to submit" v={fmt(summary.valid)} />
              <Row
                k="Excluded (invalid / duplicate)"
                v={`${summary.invalid} / ${summary.duplicate}`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch-note">
                Note for the reviewer (optional)
              </Label>
              <Input
                id="batch-note"
                placeholder="e.g. Leads from MedExpo Hyderabad"
              />
              <p className="text-xs text-muted-foreground">
                You can't approve your own leads. The Master Admin reviews each
                record.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t px-4 py-3">
            <Button variant="outline" size="sm" onClick={() => setStep(3)}>
              Back
            </Button>
            <Button
              size="sm"
              onClick={() => setConfirm(true)}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="animate-spin" /> : <Send />}{" "}
              Submit {fmt(summary.valid)} records for review
            </Button>
          </div>
        </Panel>
      )}

      {doneBatch && (
        <Panel>
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-tint-green text-tint-green-foreground">
              <PartyPopper className="size-7" />
            </div>
            <h2 className="mt-3 text-base font-semibold">
              Submitted for review
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {fmt(doneBatch.count)} records were sent to the Master Admin.
            </p>
            <div className="mt-3 rounded-md bg-muted px-3 py-1.5 text-sm">
              Batch ID: <span className="font-bold">{doneBatch.id}</span>
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to="/ra/uploads">View in My Uploads</Link>
              </Button>
              <Button size="sm" onClick={reset}>
                <UploadCloud /> Upload another file
              </Button>
            </div>
          </div>
        </Panel>
      )}

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`Submit ${summary.valid} records for review?`}
        description={`${summary.invalid + summary.duplicate} invalid or duplicate records will be left out. Submitted leads can't be edited until the admin reviews them.`}
        confirmLabel={submitting ? "Submitting…" : "Submit for review"}
        onConfirm={submit}
      />
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span className="truncate font-semibold">{v}</span>
    </div>
  );
}

function SummaryTile({ label, value, tone, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border px-3 py-3">
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-lg",
          tone,
        )}
      >
        <Icon className="size-4" />
      </span>
      <div>
        <div className="num text-xl font-bold leading-none">{fmt(value)}</div>
        <div className="mt-1 text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function IssueBreakdown({ rows }) {
  const counts = new Map();
  for (const r of rows)
    for (const m of [...r.errors, ...r.duplicates]) {
      const key = m.replace(/\s*\(.*\)$/, "");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  if (counts.size === 0)
    return (
      <p className="px-4 pb-4 text-xs font-medium text-success">
        No issues found — every record is valid.
      </p>
    );
  return (
    <div className="px-4 pb-4">
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Issues found
      </div>
      <div className="flex flex-wrap gap-1.5">
        {[...counts].map(([k, n]) => (
          <span key={k} className="rounded-full bg-muted px-2.5 py-1 text-xs">
            <span className="font-semibold">{n}</span> · {k}
          </span>
        ))}
      </div>
    </div>
  );
}

function RowsTable({ rows, plain, onRemove }) {
  if (rows.length === 0)
    return (
      <div className="px-4 py-10 text-center text-sm text-muted-foreground">
        No records in this view.
      </div>
    );
  return (
    <div className="max-h-[560px] overflow-auto">
      <table className="w-full text-[12.5px]">
        <thead className="sticky top-0 z-10">
          <tr className="bg-muted text-[11px] uppercase tracking-wide text-muted-foreground">
            <th className="px-2.5 py-2 pl-4 text-left">Row</th>
            {!plain && <th className="px-2.5 py-2 text-left">Status</th>}
            {!plain && (
              <th className="min-w-56 px-2.5 py-2 text-left">Issues</th>
            )}
            {TEMPLATE_FIELDS.map((f) => (
              <th
                key={f.key}
                className="whitespace-nowrap px-2.5 py-2 text-left"
              >
                {f.label}
                {f.required && " *"}
              </th>
            ))}
            {onRemove && <th className="px-2.5 py-2 pr-4" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.rowNo}
              className={cn(
                "border-b border-border/70",
                r.status === "invalid" && "bg-tint-red/50",
                r.status === "duplicate" && "bg-tint-amber/60",
              )}
            >
              <td className="num px-2.5 py-2 pl-4 text-muted-foreground">
                {r.rowNo}
              </td>
              {!plain && (
                <td className="px-2.5 py-2">
                  <span
                    className={cn(
                      "whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
                      r.status === "valid"
                        ? "bg-tint-green text-tint-green-foreground"
                        : r.status === "invalid"
                          ? "bg-tint-red text-tint-red-foreground"
                          : "bg-tint-amber text-tint-amber-foreground",
                    )}
                  >
                    {r.status}
                  </span>
                </td>
              )}
              {!plain && (
                <td className="px-2.5 py-2 text-[11px]">
                  {r.errors.map((e) => (
                    <div key={e} className="text-tint-red-foreground">
                      • {e}
                    </div>
                  ))}
                  {r.duplicates.map((e) => (
                    <div key={e} className="text-tint-amber-foreground">
                      • {e}
                    </div>
                  ))}
                  {r.status === "valid" && (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              )}
              {TEMPLATE_FIELDS.map((f) => (
                <td
                  key={f.key}
                  className={cn(
                    "max-w-48 truncate whitespace-nowrap px-2.5 py-2",
                    f.required &&
                      !r.values[f.key] &&
                      !plain &&
                      "font-semibold text-destructive",
                  )}
                >
                  {r.values[f.key] ||
                    (f.required && !plain ? (
                      "Missing"
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    ))}
                </td>
              ))}
              {onRemove && (
                <td className="px-2.5 py-2 pr-4">
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    aria-label={`Remove row ${r.rowNo}`}
                    onClick={() => onRemove(r.rowNo)}
                  >
                    <Trash2 className="text-muted-foreground" />
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Stepper({ step }) {
  return (
    <div className="panel flex gap-1 overflow-x-auto px-3 py-2.5">
      {STEPS.map((s, i) => (
        <div key={s} className="flex min-w-fit flex-1 items-center gap-2">
          <span
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
              i < step
                ? "bg-success text-success-foreground"
                : i === step
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {i < step ? "✓" : i + 1}
          </span>
          <span
            className={cn(
              "whitespace-nowrap text-xs font-semibold",
              i === step ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {s}
          </span>
          {i < STEPS.length - 1 && (
            <span className="mx-1 h-px min-w-4 flex-1 bg-border" />
          )}
        </div>
      ))}
    </div>
  );
}

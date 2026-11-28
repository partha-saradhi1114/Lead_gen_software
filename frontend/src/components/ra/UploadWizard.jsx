import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Copy,
  Download,
  FileSpreadsheet,
  Globe,
  Info,
  Loader2,
  Mail,
  MapPin,
  PartyPopper,
  Phone,
  PlusCircle,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
  UploadCloud,
  User,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLeadGen } from "@/lib/leadgen/store";
import { api } from "@/lib/api";
import {
  CURRENT_RA,
  LEAD_SOURCES,
  TODAY,
  currentDate,
  batchIdFor,
  fmt,
  getResearcherCategories,
} from "@/lib/leadgen/data";
import { downloadTemplate, readSheetFile } from "@/lib/leadgen/excel";
import {
  MAX_FILE_MB,
  TEMPLATE_FIELDS,
  checkFile,
  isValidEmail,
  isValidPhone,
  phoneDigits,
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
  const [mode, setMode] = useState("bulk"); // "bulk" | "manual"
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

  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);
  const currentRa =
    (storedUser.role === "ra" ||
      storedUser.role === "Research Analyst" ||
      storedUser.role === "researcher") &&
    storedUser.name &&
    storedUser.name.trim().toLowerCase() !== "research analyst"
      ? storedUser.name.trim()
      : CURRENT_RA;

  const assignedCategories = useMemo(
    () => getResearcherCategories(currentRa),
    [currentRa],
  );

  const kept = useMemo(
    () => rows.filter((r) => !removed.has(r.rowNo)),
    [rows, removed],
  );
  const validated = useMemo(
    () => validateRows(kept, state.leads, assignedCategories),
    [kept, state.leads, assignedCategories],
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
        `Missing required column${missingColumns.length > 1 ? "s" : ""}: ${missingColumns.join(", ")}. Please download the latest template.`,
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
    loadRows(sampleSheet(), "sample_healthcare_leads.xlsx", 18_432);
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
      state.batches.some((b) => b.id === batchIdFor(currentRa, currentDate(), seq))
    )
      seq++;
    const id = batchIdFor(currentRa, currentDate(), seq);
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 700));

    const toLead = (r) => {
      const v = r.values;
      const category =
        v.category || assignedCategories[0] || "Student/Corporate training";
      return {
        company: v.company,
        category,
        contact: v.contact,
        email: v.email || "",
        phone: v.phone,
        website: v.website || undefined,
        country: v.country || "India",
        stateCity: v.stateCity || undefined,
        companyAddress: v.companyAddress || undefined,
        linkedin: v.linkedin || undefined,
        description: v.description || undefined,
        // Legacy compatibility:
        source: v.source || "Excel Upload",
        designation: v.designation || undefined,
        industry: v.industry || undefined,
        location: v.stateCity || v.country || "India",
        notes: v.description || undefined,
      };
    };

    const batchCategory =
      valid[0]?.values?.category ||
      assignedCategories[0] ||
      "Student/Corporate training";

    dispatch({
      type: "submitBatch",
      batch: {
        id,
        fileName,
        category: batchCategory,
        uploadedOn: currentDate(),
        researcher: currentRa,
        totalRecords: rows.length,
        validRecords: valid.length,
        invalidRecords: summary.invalid,
        duplicates: summary.duplicate + [...removed].length,
      },
      rows: valid.map(toLead),
    });

    api
      .uploadBatch(
        {
          id,
          fileName,
          category: batchCategory,
          uploadedBy: currentRa,
          uploadedOn: currentDate(),
        },
        valid.map(toLead),
      )
      .catch((err) =>
        console.warn("[API] uploadBatch sync failed:", err.message),
      );

    setSubmitting(false);
    setConfirm(false);
    setDoneBatch({ id, count: valid.length });
    toast.success(`Batch ${id} submitted for review`, {
      description: `${valid.length} valid records sent to the Master Admin.`,
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Bar with Mode Switch and Researcher Assigned Categories Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3 shadow-sm">
        <div className="flex rounded-md border bg-muted/50 p-1">
          <button
            type="button"
            onClick={() => setMode("bulk")}
            className={cn(
              "flex items-center gap-2 rounded px-3 py-1.5 text-xs font-semibold transition-all",
              mode === "bulk"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <FileSpreadsheet className="size-4" />
            Excel / CSV Bulk Upload
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={cn(
              "flex items-center gap-2 rounded px-3 py-1.5 text-xs font-semibold transition-all",
              mode === "manual"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <PlusCircle className="size-4" />
            Manual Single Lead Entry
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>
            Research Analyst:{" "}
            <strong className="text-foreground">{currentRa}</strong>
          </span>
          <span className="text-border">|</span>
          <span className="font-medium text-foreground">
            Assigned Categories:
          </span>
          <div className="flex flex-wrap gap-1">
            {assignedCategories.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary"
              >
                <span className="size-1.5 rounded-full bg-primary" />
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      {mode === "manual" ? (
        <ManualLeadForm
          assignedCategories={assignedCategories}
          currentRa={currentRa}
          leads={state.leads}
          onSubmitSuccess={(lead) => {
            // Can switch or stay
          }}
          onSwitchToBulk={() => setMode("bulk")}
        />
      ) : (
        <>
          <Stepper step={doneBatch ? 5 : step} />

          {step === 0 && (
            <div className="grid gap-4 xl:grid-cols-12">
              <Panel className="xl:col-span-7">
                <PanelHeader
                  title="Step 1 · Upload Lead Sheet"
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
                            <Loader2 className="size-3.5 animate-spin" />{" "}
                            Reading file…
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

              <Panel className="xl:col-span-5">
                <PanelHeader
                  title="Lead Management Plan"
                  subtitle="Field requirements for lead upload"
                  actions={
                    <Button
                      size="xs"
                      variant="soft"
                      onClick={() =>
                        downloadTemplate(assignedCategories).then(() =>
                          toast.success("Standard template downloaded"),
                        )
                      }
                    >
                      <Download /> Sample template
                    </Button>
                  }
                />
                <div className="space-y-3 px-4 pb-4 text-[13px]">
                  <div className="overflow-hidden rounded-lg border bg-card">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-muted/60 text-left font-semibold text-muted-foreground">
                          <th className="px-3 py-2">Field</th>
                          <th className="px-3 py-2">Requirement</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {TEMPLATE_FIELDS.map((f) => (
                          <tr key={f.key} className="hover:bg-muted/30">
                            <td className="px-3 py-1.5 font-medium">
                              {f.label}
                            </td>
                            <td className="px-3 py-1.5">
                              <span
                                className={cn(
                                  "inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                  f.required
                                    ? "bg-tint-blue text-tint-blue-foreground"
                                    : f.requirement === "Valid format"
                                      ? "bg-tint-amber text-tint-amber-foreground"
                                      : "bg-muted text-muted-foreground",
                                )}
                              >
                                {f.requirement ||
                                  (f.required ? "Mandatory" : "Optional")}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="rounded-lg border bg-muted/20 p-3 text-xs space-y-1.5">
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      <Info className="size-3.5 text-primary" /> Category
                      Restriction
                    </div>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      You are assigned to upload leads exclusively for{" "}
                      <strong className="text-foreground">
                        {assignedCategories.join(", ")}
                      </strong>
                      . Rows with other categories will be flagged during
                      validation.
                    </p>
                  </div>
                </div>
              </Panel>
            </div>
          )}

          {step >= 1 && !doneBatch && (
            <div className="panel flex flex-wrap items-center gap-3 px-4 py-2.5">
              <FileSpreadsheet className="size-5 text-success" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold">
                  {fileName}
                </div>
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setStep(1)}
                    >
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
                    {
                      key: "invalid",
                      label: "Invalid",
                      count: summary.invalid,
                    },
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setStep(2)}
                    >
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
                  {removed.size} rows removed by you are excluded from this
                  upload.
                </p>
              )}
              <IssueBreakdown rows={validated} />
              {summary.valid === 0 && (
                <p className="px-4 pb-4 text-xs font-medium text-destructive">
                  There are no valid records to submit. Go back and fix the
                  file.
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
                  <Row k="Research Analyst" v={currentRa} />
                  <Row k="Records to submit" v={fmt(summary.valid)} />
                  <Row
                    k="Excluded (invalid / duplicate)"
                    v={`${summary.invalid} / ${summary.duplicate}`}
                  />
                  <Row
                    k="Assigned Categories"
                    v={assignedCategories.join(", ")}
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
                    You can't approve your own leads. The Master Admin reviews
                    each record.
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
        </>
      )}
    </div>
  );
}

/** Manual single lead entry form with all 11 required fields */
function ManualLeadForm({
  assignedCategories,
  currentRa,
  leads,
  onSubmitSuccess,
  onSwitchToBulk,
}) {
  const { state, dispatch } = useLeadGen();
  const categoryOptions = [
    "Student/Corporate training",
    "Health/Insurance",
    "Corporate firm",
    "Others",
  ];
  const [formData, setFormData] = useState({
    company: "",
    category: "Student/Corporate training",
    contact: "",
    email: "",
    phone: "",
    website: "",
    country: "India",
    stateCity: "",
    companyAddress: "",
    linkedin: "",
    description: "",
  });
  const [customCategory, setCustomCategory] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const fileInputRef = useRef(null);
  const [readingFile, setReadingFile] = useState(false);
  const [autoFilledFile, setAutoFilledFile] = useState(null);

  const handleAutoFillFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileError = checkFile(file);
    if (fileError) {
      toast.error(fileError);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setReadingFile(true);
    try {
      const aoa = await readSheetFile(file);
      if (!Array.isArray(aoa) || aoa.length === 0) {
        toast.error("File is empty");
        return;
      }

      const { rows } = rowsFromSheet(aoa);
      let first = rows?.[0]?.values;
      let totalRows = rows?.length || 0;

      // Fallback: If no standard headers found, inspect first rows of aoa directly
      if (!first) {
        const r0 = aoa[0] || [];
        const r1 = aoa[1] || [];
        const isHeader = r0.some(
          (c) =>
            typeof c === "string" &&
            /name|company|contact|phone|email/i.test(c),
        );
        const targetRow = isHeader && aoa.length > 1 ? r1 : r0;

        if (targetRow && targetRow.length > 0) {
          first = {
            company: targetRow[0] || "",
            category: targetRow[1] || "",
            contact: targetRow[2] || "",
            email: targetRow[3] || "",
            phone: targetRow[4] || "",
            website: targetRow[5] || "",
            country: targetRow[6] || "India",
            stateCity: targetRow[7] || "",
            companyAddress: targetRow[8] || "",
            linkedin: targetRow[9] || "",
            description: targetRow[10] || "",
          };
          totalRows = isHeader ? Math.max(1, aoa.length - 1) : aoa.length;
        }
      }

      if (!first || !Object.values(first).some(Boolean)) {
        toast.error("No valid lead data found in this file.");
        return;
      }

      // Auto-match category if present
      let cat = formData.category;
      let customCat = "";
      if (first.category) {
        const trimmedCat = String(first.category).trim();
        const matched = categoryOptions.find(
          (c) => c.toLowerCase() === trimmedCat.toLowerCase(),
        );
        if (matched) {
          cat = matched;
        } else {
          cat = "Others";
          customCat = trimmedCat;
        }
      }

      setFormData((prev) => ({
        ...prev,
        company: String(first.company || "").trim() || prev.company,
        category: cat,
        contact: String(first.contact || "").trim() || prev.contact,
        email: String(first.email || "").trim() || prev.email,
        phone: String(first.phone || "").trim() || prev.phone,
        website: String(first.website || "").trim() || prev.website,
        country: String(first.country || "").trim() || prev.country || "India",
        stateCity: String(first.stateCity || "").trim() || prev.stateCity,
        companyAddress:
          String(first.companyAddress || "").trim() || prev.companyAddress,
        linkedin: String(first.linkedin || "").trim() || prev.linkedin,
        description:
          String(first.description || "").trim() || prev.description,
      }));

      if (customCat) setCustomCategory(customCat);
      setErrors({});
      setAutoFilledFile({
        name: file.name,
        totalRows,
      });

      toast.success(
        `Auto-filled details from "${file.name}". You can review or edit before submitting.`,
      );
    } catch (err) {
      console.error("[Auto-fill] File read error:", err);
      toast.error(
        "Could not parse file. Ensure it is a valid Excel or CSV file.",
      );
    } finally {
      setReadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const phoneDuplicate = useMemo(() => {
    if (!formData.phone || formData.phone.trim().length < 7) return null;
    const digits = phoneDigits(formData.phone);
    return leads.find((l) => l.phone && phoneDigits(l.phone) === digits);
  }, [formData.phone, leads]);

  const emailDuplicate = useMemo(() => {
    if (!formData.email || !formData.email.includes("@")) return null;
    const target = formData.email.toLowerCase().trim();
    return leads.find(
      (l) => l.email && l.email.toLowerCase().trim() === target,
    );
  }, [formData.email, leads]);

  const resetForm = () => {
    setFormData({
      company: "",
      category: "Student/Corporate training",
      contact: "",
      email: "",
      phone: "",
      website: "",
      country: "India",
      stateCity: "",
      companyAddress: "",
      linkedin: "",
      description: "",
    });
    setCustomCategory("");
    setErrors({});
    setSuccess(null);
    setAutoFilledFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = () => {
    const errs = {};
    if (!formData.company.trim()) errs.company = "Company Name is mandatory";
    if (!formData.category.trim()) errs.category = "Category is mandatory";
    if (formData.category === "Others" && !customCategory.trim()) {
      errs.customCategory = "Please enter a custom category name";
    }
    if (!formData.contact.trim()) errs.contact = "Contact Person is mandatory";
    if (!formData.country.trim()) errs.country = "Country is mandatory";
    if (!formData.phone.trim()) errs.phone = "Phone Number is mandatory";
    else if (!isValidPhone(formData.phone))
      errs.phone = "Enter a valid phone number (e.g. 10-digit mobile)";

    if (formData.email.trim() && !isValidEmail(formData.email)) {
      errs.email =
        "Enter a valid business email format (e.g. name@company.com)";
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error("Please fill all mandatory fields properly");
      return;
    }
    setErrors({});
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));

    let seq = 1;
    while (
      state.batches.some((b) => b.id === batchIdFor(currentRa, currentDate(), seq))
    ) {
      seq++;
    }
    const batchId = batchIdFor(currentRa, currentDate(), seq);

    const resolvedCategory =
      formData.category === "Others"
        ? customCategory.trim()
        : formData.category.trim();

    const leadRecord = {
      company: formData.company.trim(),
      category: resolvedCategory,
      contact: formData.contact.trim(),
      email: formData.email.trim() || "",
      phone: formData.phone.trim(),
      website: formData.website.trim() || undefined,
      country: formData.country.trim(),
      stateCity: formData.stateCity.trim() || undefined,
      companyAddress: formData.companyAddress.trim() || undefined,
      linkedin: formData.linkedin.trim() || undefined,
      description: formData.description.trim() || undefined,
      location: formData.stateCity.trim() || formData.country.trim() || "India",
      source: "Manual Entry",
      notes: formData.description.trim() || undefined,
    };

    dispatch({
      type: "submitBatch",
      batch: {
        id: batchId,
        fileName: "Single Lead Manual Entry",
        category: resolvedCategory,
        uploadedOn: currentDate(),
        researcher: currentRa,
        totalRecords: 1,
        validRecords: 1,
        invalidRecords: 0,
        duplicates: 0,
      },
      rows: [leadRecord],
    });

    api
      .uploadBatch(
        {
          id: batchId,
          fileName: "Single Lead Manual Entry",
          category: resolvedCategory,
          uploadedBy: currentRa,
          uploadedOn: currentDate(),
        },
        [leadRecord],
      )
      .catch((err) =>
        console.warn("[API] single lead upload sync failed:", err.message),
      );

    setSubmitting(false);
    setSuccess({ ...leadRecord, batchId });
    toast.success(
      `Lead for "${leadRecord.company}" submitted for admin review`,
    );
    onSubmitSuccess?.(leadRecord);
  };

  if (success) {
    return (
      <Panel>
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-tint-green text-tint-green-foreground shadow-sm">
            <CheckCircle2 className="size-7" />
          </div>
          <h2 className="mt-4 text-lg font-bold">
            Lead Successfully Submitted!
          </h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Lead for{" "}
            <strong className="text-foreground">{success.company}</strong> has
            been added to the Master Admin review queue.
          </p>

          <div className="mt-4 grid w-full max-w-md grid-cols-2 gap-2 rounded-lg border bg-muted/40 p-3 text-left text-xs">
            <div>
              <span className="text-muted-foreground">Batch ID:</span>{" "}
              <span className="font-semibold">{success.batchId}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Category:</span>{" "}
              <span className="font-semibold">{success.category}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Contact:</span>{" "}
              <span className="font-semibold">{success.contact}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Phone:</span>{" "}
              <span className="font-semibold">{success.phone}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button size="sm" onClick={resetForm}>
              <PlusCircle className="size-4" /> Add Another Lead
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/ra/uploads">View in My Uploads</Link>
            </Button>
            <Button size="sm" variant="ghost" onClick={onSwitchToBulk}>
              Switch to Bulk Upload
            </Button>
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      <PanelHeader
        title="Single Lead Entry Form"
        subtitle="Enter lead details based on the Lead Management Plan specifications"
        actions={
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleAutoFillFile}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={readingFile}
              onClick={() => fileInputRef.current?.click()}
              className="h-8 gap-1.5 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/5 hover:border-primary transition-all shadow-2xs"
            >
              {readingFile ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <FileSpreadsheet className="size-3.5" />
              )}
              {readingFile
                ? "Reading file..."
                : "Auto-fill from File (Excel/CSV)"}
            </Button>
          </div>
        }
      />
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
        {/* Auto-fill feedback banner */}
        {autoFilledFile && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs animate-in fade-in-50">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Sparkles className="size-4" />
              </div>
              <div>
                <span className="font-semibold text-foreground">
                  Auto-filled from {autoFilledFile.name}
                </span>
                {autoFilledFile.totalRows > 1 && (
                  <span className="ml-2 text-muted-foreground">
                    (Loaded lead 1 of {autoFilledFile.totalRows}. Want to upload all in bulk?{" "}
                    <button
                      type="button"
                      onClick={onSwitchToBulk}
                      className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
                    >
                      Switch to Bulk Upload
                    </button>
                    )
                  </span>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={resetForm}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="mr-1 size-3" />
              Clear / Reset Form
            </Button>
          </div>
        )}
        {/* Company & Category Section */}
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold border-b pb-1.5 text-foreground">
            <Building2 className="size-4 text-primary" />
            Company & Category Information
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="company-name" className="text-xs font-semibold">
                Company Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="company-name"
                placeholder="e.g. Apollo Hospitals Ltd"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
                className={cn(errors.company && "border-destructive")}
              />
              {errors.company && (
                <p className="text-[11px] text-destructive font-medium">
                  {errors.company}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-xs font-semibold">
                Category (Assigned only){" "}
                <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(val) => {
                  setFormData({ ...formData, category: val });
                  if (val !== "Others") setCustomCategory("");
                  if (errors.category || errors.customCategory) {
                    setErrors((prev) => ({
                      ...prev,
                      category: undefined,
                      customCategory: undefined,
                    }));
                  }
                }}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select assigned category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-[11px] text-destructive font-medium">
                  {errors.category}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground">
                Only your assigned categories are selectable.
              </p>
            </div>

            {formData.category === "Others" && (
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                <Label htmlFor="custom-category" className="text-xs font-semibold">
                  Custom Category <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="custom-category"
                  placeholder="Type custom category name (e.g. Fintech, Real Estate, Retail)"
                  value={customCategory}
                  onChange={(e) => {
                    setCustomCategory(e.target.value);
                    if (errors.customCategory) {
                      setErrors((prev) => ({
                        ...prev,
                        customCategory: undefined,
                      }));
                    }
                  }}
                  autoFocus
                  className={cn(errors.customCategory && "border-destructive")}
                />
                {errors.customCategory && (
                  <p className="text-[11px] text-destructive font-medium">
                    {errors.customCategory}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground">
                  Enter custom category or industry domain for this lead.
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="country" className="text-xs font-semibold">
                Country <span className="text-destructive">*</span>
              </Label>
              <Input
                id="country"
                placeholder="e.g. India"
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
                className={cn(errors.country && "border-destructive")}
              />
              {errors.country && (
                <p className="text-[11px] text-destructive font-medium">
                  {errors.country}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="state-city" className="text-xs font-medium">
                State / City{" "}
                <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Input
                id="state-city"
                placeholder="e.g. Telangana / Hyderabad"
                value={formData.stateCity}
                onChange={(e) =>
                  setFormData({ ...formData, stateCity: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="company-address" className="text-xs font-medium">
                Company Address{" "}
                <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Input
                id="company-address"
                placeholder="e.g. Road No 2, Banjara Hills, Hyderabad"
                value={formData.companyAddress}
                onChange={(e) =>
                  setFormData({ ...formData, companyAddress: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        {/* Contact Person Details Section */}
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold border-b pb-1.5 text-foreground">
            <User className="size-4 text-primary" />
            Contact Person Information
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="contact-person" className="text-xs font-semibold">
                Contact Person <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contact-person"
                placeholder="e.g. Dr. K. Hari Prasad"
                value={formData.contact}
                onChange={(e) =>
                  setFormData({ ...formData, contact: e.target.value })
                }
                className={cn(errors.contact && "border-destructive")}
              />
              {errors.contact && (
                <p className="text-[11px] text-destructive font-medium">
                  {errors.contact}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone-number" className="text-xs font-semibold">
                Phone Number (Valid number){" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone-number"
                placeholder="e.g. +91 98480 12345"
                value={formData.phone}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, phone: val });
                  if (val.trim() && !isValidPhone(val)) {
                    setErrors((prev) => ({
                      ...prev,
                      phone:
                        "Invalid phone number (enter a valid 10-digit mobile number)",
                    }));
                  } else {
                    setErrors((prev) => {
                      const { phone: _removed, ...rest } = prev;
                      return rest;
                    });
                  }
                }}
                className={cn(errors.phone && "border-destructive")}
              />
              {errors.phone && (
                <p className="text-[11px] text-destructive font-medium">
                  {errors.phone}
                </p>
              )}
              {phoneDuplicate && (
                <div className="flex items-center gap-1 text-[11px] font-medium text-amber-600">
                  <AlertTriangle className="size-3.5 shrink-0" />
                  Warning: Phone exists in Lead #{phoneDuplicate.id} (
                  {phoneDuplicate.company})
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="business-email" className="text-xs font-medium">
                Business Email (Valid format){" "}
                <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Input
                id="business-email"
                type="email"
                placeholder="e.g. hariprasad@apollohospitals.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={cn(errors.email && "border-destructive")}
              />
              {errors.email && (
                <p className="text-[11px] text-destructive font-medium">
                  {errors.email}
                </p>
              )}
              {emailDuplicate && (
                <div className="flex items-center gap-1 text-[11px] font-medium text-amber-600">
                  <AlertTriangle className="size-3.5 shrink-0" />
                  Warning: Email exists in Lead #{emailDuplicate.id} (
                  {emailDuplicate.company})
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Web & Description Section */}
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold border-b pb-1.5 text-foreground">
            <Globe className="size-4 text-primary" />
            Online Presence & Description
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="website" className="text-xs font-medium">
                Website{" "}
                <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Input
                id="website"
                placeholder="e.g. https://apollohospitals.com"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="linkedin" className="text-xs font-medium">
                LinkedIn URL{" "}
                <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Input
                id="linkedin"
                placeholder="e.g. https://linkedin.com/company/apollo-hospitals"
                value={formData.linkedin}
                onChange={(e) =>
                  setFormData({ ...formData, linkedin: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="description" className="text-xs font-medium">
                Description / Notes{" "}
                <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Textarea
                id="description"
                rows={3}
                placeholder="Enter background notes, specialty, or lead context..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetForm}
            disabled={submitting}
          >
            Clear Form
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onSwitchToBulk}
              disabled={submitting}
            >
              Cancel & Switch to Bulk
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Send className="size-4" /> Submit Lead for Admin Review
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Panel>
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

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  ChevronRight,
  Coins,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Sparkles,
  Upload,
  UserPlus,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Panel, PanelHeader } from "@/components/common/Panel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  LEAD_CATEGORIES,
  LEAD_SOURCES,
  RESEARCHERS,
  fmt,
} from "@/lib/leadgen/data";
<<<<<<< HEAD
import { isValidEmail, phoneDigits } from "@/lib/leadgen/validation";
=======
import {
  isValidEmail,
  phoneDigits,
  validateMemberPhone,
  validateMemberEmail,
} from "@/lib/leadgen/validation";
>>>>>>> 3d8e57619193033ee706d2e1d1f5429169ec720d
import { cn } from "@/lib/utils";

export function QuickActionCard({
  icon: Icon,
  title,
  subtitle,
  tone,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-lg border border-transparent bg-muted/60 px-3 py-2.5 text-left transition-all hover:border-border hover:bg-card hover:shadow-card"
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          tone,
        )}
      >
        <Icon className="size-4.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold">{title}</span>
        <span className="block truncate text-[11px] text-muted-foreground">
          {subtitle}
        </span>
      </span>
      <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </button>
  );
}

export function QuickActions({ className }) {
  const [open, setOpen] = useState(null);
  const navigate = useNavigate();
  return (
    <Panel className={className}>
      <PanelHeader
        title="Quick Actions"
        icon={
          <div className="flex size-8 items-center justify-center rounded-lg bg-tint-blue text-tint-blue-foreground">
            <Zap className="size-4" />
          </div>
        }
      />
      <div className="grid gap-2 px-4 pb-4 sm:grid-cols-2 xl:grid-cols-4 min-[1680px]:grid-cols-1">
        <QuickActionCard
          icon={Upload}
          title="Upload Leads"
          subtitle="Import a lead sheet for an RA"
          tone="bg-tint-blue text-tint-blue-foreground"
          onClick={() => setOpen("upload")}
        />
        <QuickActionCard
          icon={Coins}
          title="Allocate Credits"
          subtitle="Top up credits for a BDE"
          tone="bg-tint-violet text-tint-violet-foreground"
          onClick={() => setOpen("allocate")}
        />
        <QuickActionCard
          icon={UserPlus}
          title="Add Team Member"
          subtitle="Invite an RA or BDE"
          tone="bg-tint-green text-tint-green-foreground"
          onClick={() => setOpen("member")}
        />
        <QuickActionCard
          icon={BarChart3}
          title="View Reports & Analytics"
          subtitle="Team and funnel insights"
          tone="bg-tint-amber text-tint-amber-foreground"
          onClick={() => navigate("/reports")}
        />
      </div>
      <UploadLeadsDialog
        open={open === "upload"}
        onOpenChange={(o) => setOpen(o ? "upload" : null)}
      />
      <AllocateCreditsDialog
        open={open === "allocate"}
        onOpenChange={(o) => setOpen(o ? "allocate" : null)}
      />
      <AddMemberDialog
        open={open === "member"}
        onOpenChange={(o) => setOpen(o ? "member" : null)}
      />
    </Panel>
  );
}

function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  onSubmit,
  children,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">{children}</div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">{submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, htmlFor, children }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

export function UploadLeadsDialog({ open, onOpenChange }) {
  const { dispatch } = useLeadGen();
  const [ra, setRa] = useState(RESEARCHERS[0] ?? "");
  const [source, setSource] = useState("Web");
  const [category, setCategory] = useState(LEAD_CATEGORIES[0]);
  const [file, setFile] = useState(null);
  const [count, setCount] = useState("25");

  useEffect(() => {
    if (open) {
      setFile(null);
      setCount("25");
    }
  }, [open]);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Upload Leads"
      description="Add a researcher's lead sheet with assigned category to the review queue."
      submitLabel="Upload to review"
      onSubmit={() => {
        const n = Number(count);
        if (!file)
          return void toast.error("Choose a CSV or Excel file to upload");
        if (!Number.isInteger(n) || n <= 0 || n > 500)
          return void toast.error("Enter between 1 and 500 records");
        dispatch({
          type: "upload",
          researcher: ra,
          count: n,
          source,
          category,
        });
        api
          .uploadBatch(
            { fileName: file.name, uploadedBy: ra, source, category },
            Array.from({ length: n }, (_, i) => ({
              company: `Company ${i + 1}`,
              contact: `Contact Person ${i + 1}`,
              email: `contact${i + 1}@lead.com`,
              phone: `+91 98765 ${String(10000 + i).slice(1)}`,
              country: "India",
              stateCity: "Telangana / Hyderabad",
              companyAddress: `Plot ${i + 10}, Tech Zone`,
              website: `https://company${i + 1}.com`,
              linkedin: `https://linkedin.com/company/lead${i + 1}`,
              description: `Lead generated in ${category}`,
              source,
              category,
              location: "Hyderabad",
              industry: "Healthcare",
            })),
          )
          .catch((err) =>
            console.warn("[API] uploadBatch sync failed:", err.message),
          );
        onOpenChange(false);
        toast.success(`${n} leads added to Pending Review`, {
          description: `${file.name} · ${category} · uploaded for ${ra}`,
        });
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Research Analyst">
          <Select value={ra} onValueChange={setRa}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESEARCHERS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Category / Vertical">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEAD_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Lead source">
        <Select value={source} onValueChange={(v) => setSource(v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LEAD_SOURCES.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Lead file" htmlFor="lead-file">
        <label
          htmlFor="lead-file"
          className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed bg-muted/50 px-3 py-3 transition-colors hover:border-primary hover:bg-primary-soft"
        >
          <FileSpreadsheet className="size-6 text-primary" />
          <span className="min-w-0 text-xs">
            <span className="block truncate font-semibold">
              {file ? file.name : "Choose CSV / XLSX file"}
            </span>
            <span className="text-muted-foreground">
              {file
                ? `${(file.size / 1024).toFixed(1)} KB`
                : "Up to 500 records per sheet"}
            </span>
          </span>
        </label>
        <input
          id="lead-file"
          type="file"
          accept=".csv,.xlsx,.xls"
          className="sr-only"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </Field>
      <Field label="Records in sheet" htmlFor="lead-count">
        <Input
          id="lead-count"
          type="number"
          min={1}
          max={500}
          value={count}
          onChange={(e) => setCount(e.target.value)}
        />
      </Field>
    </FormDialog>
  );
}

export function AllocateCreditsDialog({ open, onOpenChange }) {
  const { state, dispatch } = useLeadGen();
  const [bde, setBde] = useState(state.bdes[0]?.name ?? "");
  const [amount, setAmount] = useState("100");
  const row = state.bdes.find((b) => b.name === bde);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Allocate Credits"
      description="Each credit lets a BDE unlock one approved lead."
      submitLabel="Allocate credits"
      onSubmit={() => {
        const n = Number(amount);
        if (!Number.isInteger(n) || n <= 0)
          return void toast.error("Enter a whole number of credits above 0");
        dispatch({ type: "allocate", bde, amount: n });
        api
          .allocateCredits(bde, n)
          .catch((err) =>
            console.warn("[API] allocateCredits sync failed:", err.message),
          );
        onOpenChange(false);
        toast.success(`${fmt(n)} credits allocated to ${bde}`);
      }}
    >
      <Field label="BDE">
        <Select value={bde} onValueChange={setBde}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {state.bdes.map((b) => (
              <SelectItem key={b.name} value={b.name}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      {row && (
        <div className="num grid grid-cols-3 gap-2 rounded-lg bg-muted p-2.5 text-center text-xs">
          <div>
            <div className="font-bold">{fmt(row.allocated)}</div>
            <div className="text-muted-foreground">Allocated</div>
          </div>
          <div>
            <div className="font-bold">{fmt(row.used)}</div>
            <div className="text-muted-foreground">Used</div>
          </div>
          <div>
            <div className="font-bold">{fmt(row.allocated - row.used)}</div>
            <div className="text-muted-foreground">Remaining</div>
          </div>
        </div>
      )}
      <Field label="Credits to add" htmlFor="credit-amount">
        <Input
          id="credit-amount"
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </Field>
      <div className="flex gap-1.5">
        {[50, 100, 250, 500].map((n) => (
          <Button
            key={n}
            type="button"
            size="xs"
            variant={amount === String(n) ? "default" : "outline"}
            onClick={() => setAmount(String(n))}
          >
            +{n}
          </Button>
        ))}
      </div>
    </FormDialog>
  );
}

export function AddMemberDialog({ open, onOpenChange }) {
  const { state, dispatch } = useLeadGen();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("BDE");
  const [status, setStatus] = useState("Active");
  const [password, setPassword] = useState("Password@123");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setPhone("");
      setRole("BDE");
      setStatus("Active");
      setPassword("Password@123");
      setShowPassword(false);
    }
  }, [open]);

  const handleSubmit = () => {
    // 1. Full Name: Mandatory
    if (!name.trim()) {
      return void toast.error("Full name is mandatory");
    }

<<<<<<< HEAD
    // 2. Email: Unique, valid email
    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      return void toast.error("Enter a valid email address");
    }
    const emailExists = state.team.some(
      (m) => m.email.toLowerCase() === trimmedEmail.toLowerCase(),
    );
    if (emailExists) {
      return void toast.error("A team member with this email already exists");
    }

    // 3. Phone: Valid Indian mobile number
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      return void toast.error("Phone number is mandatory");
    }
    const digits = phoneDigits(trimmedPhone);
    if (!/^[6-9]\d{9}$/.test(digits)) {
      return void toast.error(
        "Enter a valid 10-digit Indian mobile number (+91...)",
      );
=======
    // 2. Email / Gmail: Must be in proper format & unique
    const emailResult = validateMemberEmail(email, state.team);
    if (!emailResult.valid) {
      return void toast.error(emailResult.error);
    }

    // 3. Mobile Number: Must consist of 10 digits, start with 6, 7, 8, or 9, and contain no alphabets
    const phoneResult = validateMemberPhone(phone);
    if (!phoneResult.valid) {
      return void toast.error(phoneResult.error);
>>>>>>> 3d8e57619193033ee706d2e1d1f5429169ec720d
    }

    // 4. Login Password: Secure initial password
    if (!password.trim()) {
      return void toast.error("Login password is mandatory");
    }
    if (password.trim().length < 6) {
      return void toast.error("Password must be at least 6 characters");
    }

    dispatch({
      type: "addMember",
      member: {
        name: name.trim(),
<<<<<<< HEAD
        email: trimmedEmail,
        phone: trimmedPhone.startsWith("+91")
          ? trimmedPhone
          : `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`,
=======
        email: emailResult.email,
        phone: phoneResult.formatted,
>>>>>>> 3d8e57619193033ee706d2e1d1f5429169ec720d
        role,
        status,
        password: password.trim(),
      },
    });

    onOpenChange(false);
    toast.success(`${name.trim()} added as ${role}`, {
<<<<<<< HEAD
      description: `Status: ${status} · Invite sent to ${trimmedEmail}`,
=======
      description: `Mobile: ${phoneResult.formatted} · Invite sent to ${emailResult.email}`,
>>>>>>> 3d8e57619193033ee706d2e1d1f5429169ec720d
    });
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add Team Member"
      description="Invite a Research Analyst or BDE to LeadGen Pro."
      submitLabel="Add member"
      onSubmit={handleSubmit}
    >
      <Field label="Role">
        <div className="grid grid-cols-2 gap-2">
          {["Research Analyst", "BDE"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cn(
                "rounded-md border px-3 py-2 text-xs font-semibold transition-colors cursor-pointer",
                role === r
                  ? "border-primary bg-primary-soft text-primary"
                  : "hover:bg-muted text-muted-foreground",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Full name" htmlFor="m-name">
        <Input
          id="m-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sandeep Rao"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Email / Gmail" htmlFor="m-email">
          <Input
            id="m-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@gmail.com"
          />
          <p className="mt-1 text-[10px] text-muted-foreground">
            Valid format (e.g. user@gmail.com)
          </p>
        </Field>
        <Field label="Mobile Number" htmlFor="m-phone">
          <Input
            id="m-phone"
            type="tel"
            value={phone}
            onChange={(e) => {
              // Strip any alphabetic characters immediately
              const cleaned = e.target.value.replace(/[a-zA-Z]/g, "");
              setPhone(cleaned);
            }}
            placeholder="10 digits (e.g. 9876543210)"
            maxLength={14}
          />
          <p className="mt-1 text-[10px] text-muted-foreground">
            10 digits starting with 6, 7, 8, or 9
          </p>
        </Field>
      </div>

      <Field label="Status" htmlFor="m-status">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger id="m-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label="Login Password" htmlFor="m-password">
        <div className="relative">
          <Input
            id="m-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Secure initial password"
            className="pr-24"
          />
          <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="size-3.5" />
              ) : (
                <Eye className="size-3.5" />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[11px] font-medium text-muted-foreground hover:text-primary"
              onClick={() => {
                const randomPwd =
                  "Pass@" + Math.random().toString(36).slice(-6) + "!";
                setPassword(randomPwd);
                setShowPassword(true);
                toast.info("Generated initial secure password");
              }}
              title="Generate secure password"
            >
              <Sparkles className="mr-1 size-3" />
              Gen
            </Button>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Secure initial password for employee's first sign in.
        </p>
      </Field>
    </FormDialog>
  );
}

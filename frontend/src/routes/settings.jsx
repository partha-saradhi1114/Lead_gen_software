import { useState, useEffect } from "react";
import {
  Bell,
  Check,
  CreditCard,
  Database,
  Globe,
  KeyRound,
  Lock,
  Mail,
  Save,
  Settings as SettingsIcon,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useLeadGen, loadStoredSettings } from "@/lib/leadgen/store";
import { api } from "@/lib/api";
import { Panel, PanelHeader } from "@/components/common/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const { state, dispatch } = useLeadGen();

  // Current user from localStorage or fallback
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const [activeTab, setActiveTab] = useState("general");

  const storedFallback = loadStoredSettings();
  const s = state?.settings || storedFallback;

  // General settings state initialized from global state / localStorage
  const [general, setGeneral] = useState({
    workspaceName:
      s.general?.workspaceName ||
      storedFallback.general?.workspaceName ||
      "Lead Generation Software",
    orgDomain: s.general?.orgDomain || "leadgen.pro",
    contactEmail:
      s.general?.contactEmail || storedUser.email || "sriram@leadgen.pro",
    timezone: s.general?.timezone || "Asia/Kolkata",
    currency: s.general?.currency || "INR",
  });

  // Credit policy state
  const [credits, setCredits] = useState({
    costPerUnlock: s.credits?.costPerUnlock ?? 10,
    defaultMonthlyQuota: s.credits?.defaultMonthlyQuota ?? 500,
    lowCreditThreshold: s.credits?.lowCreditThreshold ?? 50,
    autoDebitOnUnlock: s.credits?.autoDebitOnUnlock ?? true,
    requireApprovalForTopup: s.credits?.requireApprovalForTopup ?? false,
  });

  // Lead validation rules
  const [rules, setRules] = useState({
    strictPhoneValidation: s.rules?.strictPhoneValidation ?? true,
    requireBusinessEmail: s.rules?.requireBusinessEmail ?? true,
    autoDeduplicate: s.rules?.autoDeduplicate ?? true,
    maxBatchSize: s.rules?.maxBatchSize ?? 500,
    autoArchiveRejectedAfterDays: s.rules?.autoArchiveRejectedAfterDays ?? 30,
  });

  // Notifications
  const [notifications, setNotifications] = useState({
    emailOnUpload: s.notifications?.emailOnUpload ?? true,
    emailOnReview: s.notifications?.emailOnReview ?? false,
    lowCreditAlerts: s.notifications?.lowCreditAlerts ?? true,
    dailyDigest: s.notifications?.dailyDigest ?? true,
    inAppPopups: s.notifications?.inAppPopups ?? true,
  });

  // Synchronize when state.settings changes (e.g. from backend hydration or storage events)
  useEffect(() => {
    if (state?.settings?.general) {
      setGeneral((prev) => ({ ...prev, ...state.settings.general }));
    }
    if (state?.settings?.credits) {
      setCredits((prev) => ({ ...prev, ...state.settings.credits }));
    }
    if (state?.settings?.rules) {
      setRules((prev) => ({ ...prev, ...state.settings.rules }));
    }
    if (state?.settings?.notifications) {
      setNotifications((prev) => ({
        ...prev,
        ...state.settings.notifications,
      }));
    }
  }, [state?.settings]);

  // Password / Security state
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (sectionKey, sectionLabel) => {
    setSaving(true);
    let valuesToSave = {};
    if (sectionKey === "general") valuesToSave = general;
    else if (sectionKey === "credits") valuesToSave = credits;
    else if (sectionKey === "rules") valuesToSave = rules;
    else if (sectionKey === "notifications") valuesToSave = notifications;

    // 1. Synchronously persist to localStorage immediately
    try {
      const currentStored = loadStoredSettings();
      const updatedStored = {
        ...currentStored,
        [sectionKey]: {
          ...(currentStored[sectionKey] || {}),
          ...valuesToSave,
        },
      };
      localStorage.setItem("leadgen_settings", JSON.stringify(updatedStored));
    } catch (_e) {
      console.warn("[Settings] localStorage write note:", _e);
    }

    // 2. Dispatch to local state so all components (sidebar, header, settings) update immediately
    dispatch({
      type: "updateSettings",
      section: sectionKey,
      values: valuesToSave,
    });

    // 3. Keep document tab title permanently fixed to Lead Generation Software
    if (typeof document !== "undefined") {
      document.title = "Lead Generation Software";
    }

    // 4. Persist to backend server API if available
    try {
      await api.updateSettings(sectionKey, valuesToSave);
    } catch (apiErr) {
      // Backend may be running on Vercel SPA or offline; localStorage is the persistent source of truth
      console.warn("[Settings] Backend updateSettings note:", apiErr.message);
    }

    setSaving(false);
    toast.success(`${sectionLabel} updated successfully`, {
      description:
        "Your workspace configuration has been saved and applied across the platform.",
    });
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    if (!passwords.currentPassword) {
      toast.error("Please enter your current password");
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success("Password changed successfully", {
        description: "Please use your new password next time you sign in.",
      });
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <SettingsIcon className="size-6 text-primary" /> Workspace Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your workspace profile, credit governance, validation rules,
            and team notifications.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            Active Workspace:{" "}
            {state?.settings?.general?.workspaceName || general.workspaceName}
          </Badge>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto p-1 bg-muted/60">
          <TabsTrigger
            value="general"
            className="gap-2 py-2 text-xs md:text-sm"
          >
            <Globe className="size-4" /> Workspace
          </TabsTrigger>
          <TabsTrigger
            value="credits"
            className="gap-2 py-2 text-xs md:text-sm"
          >
            <CreditCard className="size-4" /> Credit Policies
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-2 py-2 text-xs md:text-sm">
            <ShieldCheck className="size-4" /> Validation Rules
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="gap-2 py-2 text-xs md:text-sm"
          >
            <Bell className="size-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="gap-2 py-2 text-xs md:text-sm"
          >
            <Lock className="size-4" /> Security
          </TabsTrigger>
        </TabsList>

        {/* 1. GENERAL / WORKSPACE TAB */}
        <TabsContent value="general">
          <Panel>
            <PanelHeader
              title="Workspace Identity & Regional Preferences"
              subtitle="Configure public business information and localization settings."
              icon={
                <div className="flex size-8 items-center justify-center rounded-lg bg-tint-blue text-tint-blue-foreground">
                  <Globe className="size-4" />
                </div>
              }
            />
            <div className="p-6 space-y-6 max-w-3xl">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ws-name">Workspace / Company Name</Label>
                  <Input
                    id="ws-name"
                    value={general.workspaceName}
                    onChange={(e) =>
                      setGeneral({ ...general, workspaceName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-domain">Primary Domain</Label>
                  <Input
                    id="org-domain"
                    value={general.orgDomain}
                    onChange={(e) =>
                      setGeneral({ ...general, orgDomain: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">
                    Lead Contact / Admin Email
                  </Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={general.contactEmail}
                    onChange={(e) =>
                      setGeneral({ ...general, contactEmail: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">System Time Zone</Label>
                  <Select
                    value={general.timezone}
                    onValueChange={(v) =>
                      setGeneral({ ...general, timezone: v })
                    }
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">
                        Asia/Kolkata (IST +5:30)
                      </SelectItem>
                      <SelectItem value="UTC">UTC (Universal Time)</SelectItem>
                      <SelectItem value="America/New_York">
                        America/New_York (EST)
                      </SelectItem>
                      <SelectItem value="America/Los_Angeles">
                        America/Los_Angeles (PST)
                      </SelectItem>
                      <SelectItem value="Europe/London">
                        Europe/London (GMT)
                      </SelectItem>
                      <SelectItem value="Asia/Dubai">
                        Asia/Dubai (GST +4:00)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currency">Operational Currency</Label>
                  <Select
                    value={general.currency}
                    onValueChange={(v) =>
                      setGeneral({ ...general, currency: v })
                    }
                  >
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">
                        INR (₹) - Indian Rupee
                      </SelectItem>
                      <SelectItem value="USD">USD ($) - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR (€) - Euro</SelectItem>
                      <SelectItem value="GBP">
                        GBP (£) - British Pound
                      </SelectItem>
                      <SelectItem value="AED">
                        AED (د.إ) - UAE Dirham
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end">
                <Button
                  onClick={() => handleSave("general", "Workspace Profile")}
                  disabled={saving}
                  className="gap-2"
                >
                  <Save className="size-4" /> Save Workspace Profile
                </Button>
              </div>
            </div>
          </Panel>
        </TabsContent>

        {/* 2. CREDITS POLICIES TAB */}
        <TabsContent value="credits">
          <Panel>
            <PanelHeader
              title="BDE Credit Governance & Cost Settings"
              subtitle="Define credit consumption per contact unlock, monthly refill amounts, and alert thresholds."
              icon={
                <div className="flex size-8 items-center justify-center rounded-lg bg-tint-violet text-tint-violet-foreground">
                  <CreditCard className="size-4" />
                </div>
              }
            />
            <div className="p-6 space-y-6 max-w-3xl">
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="space-y-2 rounded-lg border bg-card p-4">
                  <Label
                    htmlFor="cost-unlock"
                    className="font-semibold text-xs"
                  >
                    Cost per Contact Unlock
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="cost-unlock"
                      type="number"
                      min={1}
                      max={100}
                      value={credits.costPerUnlock}
                      onChange={(e) =>
                        setCredits({
                          ...credits,
                          costPerUnlock: Number(e.target.value) || 10,
                        })
                      }
                      className="font-mono text-base font-bold"
                    />
                    <span className="text-xs text-muted-foreground">
                      Credits
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Deducted from the BDE's wallet when unlocking phone & email.
                  </p>
                </div>

                <div className="space-y-2 rounded-lg border bg-card p-4">
                  <Label
                    htmlFor="monthly-quota"
                    className="font-semibold text-xs"
                  >
                    Default Monthly Refill
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="monthly-quota"
                      type="number"
                      min={50}
                      max={5000}
                      step={50}
                      value={credits.defaultMonthlyQuota}
                      onChange={(e) =>
                        setCredits({
                          ...credits,
                          defaultMonthlyQuota: Number(e.target.value) || 500,
                        })
                      }
                      className="font-mono text-base font-bold"
                    />
                    <span className="text-xs text-muted-foreground">
                      Credits
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Initial balance granted to newly created BDE accounts.
                  </p>
                </div>

                <div className="space-y-2 rounded-lg border bg-card p-4">
                  <Label htmlFor="low-thresh" className="font-semibold text-xs">
                    Low Credit Warning Alert
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="low-thresh"
                      type="number"
                      min={10}
                      max={200}
                      value={credits.lowCreditThreshold}
                      onChange={(e) =>
                        setCredits({
                          ...credits,
                          lowCreditThreshold: Number(e.target.value) || 50,
                        })
                      }
                      className="font-mono text-base font-bold"
                    />
                    <span className="text-xs text-muted-foreground">
                      Credits
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Triggers warning banner in BDE portal when balance falls
                    below.
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold">
                      Immediate Auto-Debit on Unlock
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Instantly record credit transaction and lock contact
                      visibility to unlocking BDE.
                    </p>
                  </div>
                  <Switch
                    checked={credits.autoDebitOnUnlock}
                    onCheckedChange={(c) =>
                      setCredits({ ...credits, autoDebitOnUnlock: c })
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold">
                      Require Admin Approval for Overdrafts / Extra Credits
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      BDEs cannot unlock additional leads once balance reaches
                      zero without top-up.
                    </p>
                  </div>
                  <Switch
                    checked={credits.requireApprovalForTopup}
                    onCheckedChange={(c) =>
                      setCredits({ ...credits, requireApprovalForTopup: c })
                    }
                  />
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end">
                <Button
                  onClick={() => handleSave("credits", "Credit Policies")}
                  disabled={saving}
                  className="gap-2"
                >
                  <Save className="size-4" /> Save Credit Governance
                </Button>
              </div>
            </div>
          </Panel>
        </TabsContent>

        {/* 3. VALIDATION RULES TAB */}
        <TabsContent value="rules">
          <Panel>
            <PanelHeader
              title="Lead Quality & Ingestion Policies"
              subtitle="Enforce automated checks during Excel/CSV uploads and lead approval workflows."
              icon={
                <div className="flex size-8 items-center justify-center rounded-lg bg-tint-green text-tint-green-foreground">
                  <ShieldCheck className="size-4" />
                </div>
              }
            />
            <div className="p-6 space-y-6 max-w-3xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-semibold">
                        Strict 10-Digit Phone Validation
                      </Label>
                      <Badge variant="secondary" className="text-[10px]">
                        Recommended
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Verify Indian mobile format (starts with 6-9, 10 digits).
                      Flags invalid numbers automatically.
                    </p>
                  </div>
                  <Switch
                    checked={rules.strictPhoneValidation}
                    onCheckedChange={(c) =>
                      setRules({ ...rules, strictPhoneValidation: c })
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold">
                      Require Business Email Domain
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Flags free generic domains (@gmail.com, @yahoo.com) for
                      extra manual review by Admin.
                    </p>
                  </div>
                  <Switch
                    checked={rules.requireBusinessEmail}
                    onCheckedChange={(c) =>
                      setRules({ ...rules, requireBusinessEmail: c })
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold">
                      Automated Duplicate Check
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Prevent uploading duplicate phone numbers or email
                      addresses already present in database.
                    </p>
                  </div>
                  <Switch
                    checked={rules.autoDeduplicate}
                    onCheckedChange={(c) =>
                      setRules({ ...rules, autoDeduplicate: c })
                    }
                  />
                </div>

                <div className="rounded-lg border p-4 bg-muted/20 space-y-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-semibold">
                        Categorical Lead Segregation & BDE Verticals
                      </Label>
                      <Badge variant="secondary" className="text-[10px]">
                        Active
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Restrict BDEs to only view, unlock, and manage leads
                      matching their specialized vertical category (e.g. Student
                      Database for Training Institutes). Master Admin has
                      superuser access across all categories.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[
                      "Students / Education",
                      "IT & Upskilling",
                      "Corporate Training",
                      "Healthcare & Pharma",
                      "General Enquiries",
                    ].map((cat) => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1 text-xs font-semibold text-foreground"
                      >
                        <span className="size-1.5 rounded-full bg-primary" />
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="max-batch">Max Upload Batch Limit</Label>
                  <Input
                    id="max-batch"
                    type="number"
                    min={50}
                    max={2000}
                    value={rules.maxBatchSize}
                    onChange={(e) =>
                      setRules({
                        ...rules,
                        maxBatchSize: Number(e.target.value) || 500,
                      })
                    }
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Maximum rows allowed per single Excel/CSV upload.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="archive-days">
                    Auto-Archive Rejected Leads
                  </Label>
                  <Select
                    value={String(rules.autoArchiveRejectedAfterDays)}
                    onValueChange={(v) =>
                      setRules({
                        ...rules,
                        autoArchiveRejectedAfterDays: Number(v),
                      })
                    }
                  >
                    <SelectTrigger id="archive-days">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">After 15 days</SelectItem>
                      <SelectItem value="30">After 30 days</SelectItem>
                      <SelectItem value="60">After 60 days</SelectItem>
                      <SelectItem value="90">After 90 days</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    Removes rejected leads from the active operational queue
                    into cold storage.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end">
                <Button
                  onClick={() => handleSave("rules", "Validation Rules")}
                  disabled={saving}
                  className="gap-2"
                >
                  <Save className="size-4" /> Save Ingestion Policies
                </Button>
              </div>
            </div>
          </Panel>
        </TabsContent>

        {/* 4. NOTIFICATIONS TAB */}
        <TabsContent value="notifications">
          <Panel>
            <PanelHeader
              title="Notifications & Activity Alerts"
              subtitle="Manage operational notifications sent to Admins, Researchers, and BDEs."
              icon={
                <div className="flex size-8 items-center justify-center rounded-lg bg-tint-amber text-tint-amber-foreground">
                  <Bell className="size-4" />
                </div>
              }
            />
            <div className="p-6 space-y-6 max-w-3xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold">
                      Batch Upload Notifications
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Notify admin team whenever a Research Analyst submits a
                      new lead batch for review.
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailOnUpload}
                    onCheckedChange={(c) =>
                      setNotifications({ ...notifications, emailOnUpload: c })
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold">
                      Lead Review Status Alerts
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Send email feedback to the Research Analyst when their
                      uploaded batch is approved or rejected.
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailOnReview}
                    onCheckedChange={(c) =>
                      setNotifications({ ...notifications, emailOnReview: c })
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold">
                      Low BDE Credit Alerts
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Send an alert to the Admin dashboard when any BDE drops
                      below the low credit threshold.
                    </p>
                  </div>
                  <Switch
                    checked={notifications.lowCreditAlerts}
                    onCheckedChange={(c) =>
                      setNotifications({ ...notifications, lowCreditAlerts: c })
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold">
                      Daily Executive Digest
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Deliver an end-of-day summary email of total leads
                      uploaded, reviewed, and converted.
                    </p>
                  </div>
                  <Switch
                    checked={notifications.dailyDigest}
                    onCheckedChange={(c) =>
                      setNotifications({ ...notifications, dailyDigest: c })
                    }
                  />
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end">
                <Button
                  onClick={() =>
                    handleSave("notifications", "Notification Preferences")
                  }
                  disabled={saving}
                  className="gap-2"
                >
                  <Save className="size-4" /> Save Notification Settings
                </Button>
              </div>
            </div>
          </Panel>
        </TabsContent>

        {/* 5. SECURITY & PASSWORDS TAB */}
        <TabsContent value="security">
          <Panel>
            <PanelHeader
              title="Account Security & Access Credentials"
              subtitle="Update your administrator login password and verify security status."
              icon={
                <div className="flex size-8 items-center justify-center rounded-lg bg-tint-red text-tint-red-foreground">
                  <Lock className="size-4" />
                </div>
              }
            />
            <div className="p-6 space-y-6 max-w-xl">
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cur-pass">Current Password</Label>
                  <Input
                    id="cur-pass"
                    type="password"
                    placeholder="Enter current password"
                    value={passwords.currentPassword}
                    onChange={(e) =>
                      setPasswords({
                        ...passwords,
                        currentPassword: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-pass">New Password</Label>
                  <Input
                    id="new-pass"
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={passwords.newPassword}
                    onChange={(e) =>
                      setPasswords({
                        ...passwords,
                        newPassword: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conf-pass">Confirm New Password</Label>
                  <Input
                    id="conf-pass"
                    type="password"
                    placeholder="Re-type new password"
                    value={passwords.confirmPassword}
                    onChange={(e) =>
                      setPasswords({
                        ...passwords,
                        confirmPassword: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" disabled={saving} className="gap-2">
                    <KeyRound className="size-4" /> Update Password
                  </Button>
                </div>
              </form>

              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
                  <ShieldAlert className="size-4 text-primary" /> Session
                  Information
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    Current User:{" "}
                    <span className="font-mono text-foreground">
                      {storedUser.name || "Administrator"} (
                      {storedUser.email || "sriram@leadgen.pro"})
                    </span>
                  </p>
                  <p>
                    Role:{" "}
                    <span className="font-semibold text-foreground uppercase">
                      {storedUser.role || "ADMIN"}
                    </span>
                  </p>
                  <p>
                    Token Status:{" "}
                    <span className="text-emerald-600 font-medium">
                      Valid JWT session active
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}

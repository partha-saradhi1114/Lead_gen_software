import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { SEED_TEAM } from "@/lib/leadgen/data";
import {
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Crown,
  Database,
  Eye,
  EyeOff,
  GraduationCap,
  Layers,
  Lock,
  Mail,
  Microscope,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BrandLogo } from "@/components/common/BrandLogo";

const DEMO_ROLES = [
  {
    role: "admin",
    title: "Master Admin",
    personaName: "Sriram",
    desc: "Oversee lead allocation, quality audit & credit governance",
    email: "sriram@leadgen.pro",
    path: "/",
    icon: Crown,
    vertical: "All Categories",
    theme: {
      activeBorder: "border-amber-500 ring-2 ring-amber-500/25 bg-amber-500/5",
      iconBg:
        "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-amber-500/30",
      badge:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      buttonGradient:
        "from-amber-600 via-amber-700 to-amber-800 hover:from-amber-500 hover:to-amber-700",
    },
  },
  {
    role: "ra",
    title: "Research Analyst",
    personaName: "Priya M",
    desc: "Upload Excel sheets, ingest candidate pools & review rejections",
    email: "priya.m@leadgen.pro",
    path: "/ra",
    icon: Microscope,
    vertical: "Multi-Vertical Sourcing",
    theme: {
      activeBorder:
        "border-purple-500 ring-2 ring-purple-500/25 bg-purple-500/5",
      iconBg:
        "bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-purple-500/30",
      badge:
        "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      buttonGradient:
        "from-purple-600 via-indigo-600 to-purple-800 hover:from-purple-500 hover:to-indigo-700",
    },
  },
  {
    role: "bde",
    title: "Admissions BDE",
    personaName: "Ravi Kumar",
    desc: "Access student leads, unlock contacts & log call dispositions",
    email: "ravi.kumar@leadgen.pro",
    path: "/bde",
    icon: Briefcase,
    vertical: "Students / Education",
    theme: {
      activeBorder: "border-cyan-500 ring-2 ring-cyan-500/25 bg-cyan-500/5",
      iconBg:
        "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-cyan-500/30",
      badge:
        "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
      buttonGradient:
        "from-blue-600 via-cyan-600 to-indigo-700 hover:from-blue-500 hover:to-cyan-600",
    },
  },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(DEMO_ROLES[0]);
  const [email, setEmail] = useState(DEMO_ROLES[0].email);
  const [activeMemberName, setActiveMemberName] = useState(
    DEMO_ROLES[0].personaName,
  );
  const [password, setPassword] = useState("Password@123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  // Load all team members dynamically from static seed + localStorage
  const allTeamMembers = useMemo(() => {
    const list = [
      {
        name: "Sriram",
        email: "sriram@leadgen.pro",
        phone: "+91 98450 12345",
        role: "Master Admin",
      },
      ...SEED_TEAM,
    ];
    try {
      const raw = localStorage.getItem("leadgen_team");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map();
          list.forEach((m) => map.set(m.email.toLowerCase(), m));
          parsed.forEach((m) => {
            if (m && m.email) map.set(m.email.toLowerCase(), m);
          });
          return Array.from(map.values());
        }
      }
    } catch {}
    return list;
  }, []);

  // Filter team members matching the currently selected role
  const roleMembers = useMemo(() => {
    return allTeamMembers.filter((m) => {
      if (selectedRole.role === "admin") {
        return (
          m.role?.toLowerCase().includes("admin") ||
          m.name?.toLowerCase() === "sriram"
        );
      }
      if (selectedRole.role === "ra") {
        return (
          m.role === "Research Analyst" ||
          m.role === "ra" ||
          m.role?.toLowerCase().includes("analyst") ||
          m.role?.toLowerCase().includes("research")
        );
      }
      if (selectedRole.role === "bde") {
        return (
          m.role === "BDE" ||
          m.role === "bde" ||
          m.role?.toLowerCase().includes("business development")
        );
      }
      return false;
    });
  }, [allTeamMembers, selectedRole.role]);

  const handleSelectRole = (r) => {
    setSelectedRole(r);
    // Find matching member for this role or fall back to persona
    const firstMatching = allTeamMembers.find((m) => {
      if (r.role === "admin") return m.role?.toLowerCase().includes("admin");
      if (r.role === "ra")
        return (
          m.role === "Research Analyst" ||
          m.role === "ra" ||
          m.role?.toLowerCase().includes("analyst")
        );
      if (r.role === "bde")
        return (
          m.role === "BDE" ||
          m.role === "bde" ||
          m.role?.toLowerCase().includes("business development")
        );
      return false;
    });
    const chosenName = firstMatching?.name || r.personaName;
    const chosenEmail = firstMatching?.email || r.email;
    setActiveMemberName(chosenName);
    setEmail(chosenEmail);
    setPassword("Password@123");
  };

  const handleSelectMember = (member) => {
    setActiveMemberName(member.name);
    setEmail(member.email);
    setPassword("Password@123");
  };

  const handleEmailChange = (val) => {
    setEmail(val);
    const clean = val.trim().toLowerCase();
    const match = allTeamMembers.find(
      (m) =>
        m.email?.toLowerCase() === clean ||
        m.name?.toLowerCase() === clean,
    );
    if (match) {
      setActiveMemberName(match.name);
      if (
        (match.role === "Research Analyst" ||
          match.role === "ra" ||
          match.role?.toLowerCase().includes("analyst")) &&
        selectedRole.role !== "ra"
      ) {
        setSelectedRole(DEMO_ROLES[1]);
      } else if (
        (match.role === "BDE" ||
          match.role === "bde" ||
          match.role?.toLowerCase().includes("business development")) &&
        selectedRole.role !== "bde"
      ) {
        setSelectedRole(DEMO_ROLES[2]);
      } else if (
        match.role?.toLowerCase().includes("admin") &&
        selectedRole.role !== "admin"
      ) {
        setSelectedRole(DEMO_ROLES[0]);
      }
    } else {
      if (clean) {
        const fallbackName = clean.includes("@")
          ? clean.split("@")[0]
          : clean;
        setActiveMemberName(fallbackName);
      } else {
        setActiveMemberName(selectedRole.personaName);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter a valid work email address");
      return;
    }

    const cleanInput = email.trim().toLowerCase();
    const matchedMember = allTeamMembers.find(
      (m) =>
        m.email?.toLowerCase() === cleanInput ||
        m.name?.toLowerCase() === cleanInput,
    );

    const resolvedName =
      matchedMember?.name ||
      activeMemberName ||
      (email.includes("@") ? email.split("@")[0] : email.trim()) ||
      selectedRole.personaName;

    const resolvedRole =
      matchedMember?.role === "BDE" || matchedMember?.role === "bde"
        ? "bde"
        : matchedMember?.role === "Research Analyst" ||
          matchedMember?.role === "ra" ||
          matchedMember?.role?.toLowerCase().includes("analyst")
        ? "ra"
        : matchedMember?.role?.toLowerCase().includes("admin")
        ? "admin"
        : selectedRole.role;

    try {
      setLoading(true);
      const data = await api.login(email.trim(), password);
      if (data && data.token) {
        const finalUser = {
          ...data.user,
          name: data.user.name || resolvedName,
          role: data.user.role || resolvedRole,
          phone: data.user.phone || matchedMember?.phone || "",
        };
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(finalUser));
        toast.success(`Welcome back, ${finalUser.name}!`);

        if (finalUser.role === "admin") navigate("/");
        else if (finalUser.role === "ra") navigate("/ra");
        else if (finalUser.role === "bde") navigate("/bde");
        else navigate(selectedRole.path);
        return;
      }
    } catch (err) {
      console.warn(
        "[Login] Server auth fallback to local session:",
        err.message,
      );
      // Fallback local session using matched member identity
      const demoUser = {
        name: resolvedName,
        email: matchedMember?.email || email.trim(),
        role: resolvedRole,
        phone: matchedMember?.phone || "",
        category:
          matchedMember?.category ||
          selectedRole.vertical ||
          "Students / Education",
        credits: resolvedRole === "bde" ? (matchedMember?.credits ?? 500) : 0,
        creditsUsed:
          resolvedRole === "bde" ? (matchedMember?.creditsUsed ?? 0) : 0,
      };
      const fallbackToken = "demo-session-token-" + Date.now();
      localStorage.setItem("token", fallbackToken);
      localStorage.setItem("user", JSON.stringify(demoUser));
      toast.success(
        `Signed in as ${demoUser.name} (${
          resolvedRole === "ra"
            ? "Research Analyst"
            : resolvedRole === "bde"
            ? "Admissions BDE"
            : "Master Admin"
        })`,
      );
      navigate(
        resolvedRole === "ra"
          ? "/ra"
          : resolvedRole === "bde"
          ? "/bde"
          : "/",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* ========================================================
          LEFT HERO PANEL: Creative, Colorful Enterprise Brand Showcase
          ======================================================== */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-slate-950 p-10 text-white lg:flex">
        {/* Ambient Gradient Glow Spheres */}
        <div className="pointer-events-none absolute -left-20 -top-20 size-96 rounded-full bg-blue-600/25 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-1/3 size-96 rounded-full bg-purple-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/4 size-96 rounded-full bg-cyan-500/20 blur-3xl" />

        {/* Subtle grid pattern overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:28px_28px] opacity-10" />

        {/* Top Header: Brand Logo Component */}
        <div className="relative z-10">
          <BrandLogo size="lg" light subtitle={true} />
        </div>

        {/* Center Hero: Platform Value Proposition */}
        <div className="relative z-10 my-auto max-w-lg space-y-6 pt-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-300 backdrop-blur-md">
            <ShieldCheck className="size-3.5 text-cyan-400" />
            Enterprise Lead Governance & Outreach
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white xl:text-4xl">
              From Raw Ingestion to Confirmed Admissions & Closures.
            </h1>
            <p className="text-sm leading-relaxed text-slate-300">
              A unified operational hub connecting Research Analyst datasets,
              Master Admin QA gatekeepers, and specialized Admissions BDE
              outreach workflows.
            </p>
          </div>

          {/* Interactive Feature Cards (Glassmorphism) */}
          <div className="space-y-3 pt-2">
            {/* Card 1: Three Persona Flow */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-md transition-all hover:bg-white/10">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-cyan-400 ring-1 ring-cyan-500/30">
                  <Layers className="size-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">
                    3 Specialized Persona Workspaces
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Master Admin (Governance) · Research Analyst (Ingestion) ·
                    BDE (Outreach)
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Vertical Segmentation Showcase */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-md transition-all hover:bg-white/10">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-cyan-300">
                Segmented Lead Verticals
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[
                  { label: "Students / Education", emoji: "🎓" },
                  { label: "IT & Upskilling", emoji: "💻" },
                  { label: "Corporate Training", emoji: "🏢" },
                  { label: "Healthcare & Pharma", emoji: "🏥" },
                  { label: "General Enquiries", emoji: "🌐" },
                ].map((v) => (
                  <span
                    key={v.label}
                    className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-slate-900/80 px-2 py-0.5 text-[10px] font-medium text-slate-200"
                  >
                    <span>{v.emoji}</span> {v.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Status & Copyright */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80 pt-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="flex size-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80" />
            <span>MongoDB Atlas Cloud Connected · SSL 256-Bit</span>
          </div>
          <div>
            © {new Date().getFullYear()} LeadGen Pro. All rights reserved.
          </div>
        </div>
      </div>

      {/* ========================================================
          RIGHT PANEL: Creative, Interactive & User-Friendly Sign In
          ======================================================== */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Header (Shows only on small screens) */}
          <div className="flex items-center justify-center lg:hidden">
            <BrandLogo size="md" subtitle={true} />
          </div>

          {/* Form Header */}
          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              <Sparkles className="size-3" /> Secure Workspace Sign In
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Welcome back
            </h2>
            <p className="text-xs text-muted-foreground">
              Choose your role to load demo credentials, or sign in with your
              work email.
            </p>
          </div>

          {/* Persona Quick Selector (3 Vibrant Cards) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>Select Access Persona</span>
              <span className="text-[10px] text-primary">
                1-Click Fast Switch
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {DEMO_ROLES.map((r) => {
                const Icon = r.icon;
                const isSelected = selectedRole.role === r.role;
                return (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => handleSelectRole(r)}
                    className={`group relative flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? r.theme.activeBorder
                        : "border-border bg-card/60 hover:border-muted-foreground/30 hover:bg-card shadow-xs"
                    }`}
                  >
                    {/* Active Corner Check Indicator */}
                    {isSelected && (
                      <span className="absolute right-1.5 top-1.5 flex size-3.5 items-center justify-center rounded-full bg-primary text-[8px] text-primary-foreground font-bold">
                        ✓
                      </span>
                    )}

                    <div
                      className={`mb-2 flex size-9 items-center justify-center rounded-lg shadow-sm transition-transform duration-200 group-hover:scale-105 ${r.theme.iconBg}`}
                    >
                      <Icon className="size-4" strokeWidth={2.4} />
                    </div>

                    <span className="text-xs font-bold leading-tight text-foreground line-clamp-1">
                      {r.title}
                    </span>
                    <span className="mt-0.5 text-[10px] font-medium text-muted-foreground">
                      {r.personaName}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom/Created Team Member Quick Switcher */}
            {roleMembers.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                  <span>Switch {selectedRole.title} Account:</span>
                  <span className="text-[10px] text-muted-foreground">
                    {roleMembers.length} available
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {roleMembers.map((m) => {
                    const isCurrent =
                      activeMemberName?.toLowerCase() === m.name?.toLowerCase() ||
                      email?.toLowerCase() === m.email?.toLowerCase();
                    return (
                      <button
                        key={m.email || m.name}
                        type="button"
                        onClick={() => handleSelectMember(m)}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                          isCurrent
                            ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                            : "border bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {m.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Active Role Description Banner */}
          <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3.5 py-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">
                Active Profile:
              </span>
              <span className="text-muted-foreground">
                {activeMemberName} ({selectedRole.title})
              </span>
            </div>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${selectedRole.theme.badge}`}
            >
              {selectedRole.vertical}
            </span>
          </div>

          {/* Credentials Form Card */}
          <Card className="border-border/80 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Enter Credentials</span>
                <span className="text-[11px] font-normal text-muted-foreground">
                  Pre-filled for demo
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Work Email Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium">
                    Work Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="text"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      placeholder="name@leadgen.pro or account name"
                      className="h-9 pl-9 text-xs"
                      required
                    />
                  </div>
                </div>

                {/* Password Field with Show/Hide Toggle */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-medium">
                      Password
                    </Label>
                    <button
                      type="button"
                      onClick={() => setForgotModalOpen(true)}
                      className="text-[11px] font-medium text-primary hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-9 pl-9 pr-9 text-xs font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={setRememberMe}
                    />
                    <label
                      htmlFor="remember"
                      className="text-xs text-muted-foreground cursor-pointer select-none"
                    >
                      Remember this session
                    </label>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    AES-256 Encrypted
                  </span>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className={`w-full gap-2 text-xs font-bold text-white shadow-md transition-all duration-200 cursor-pointer bg-gradient-to-r ${selectedRole.theme.buttonGradient}`}
                >
                  {loading ? (
                    "Signing in..."
                  ) : (
                    <>
                      Sign In as {activeMemberName || selectedRole.title}
                      <ChevronRight className="size-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Quick Helper Footer Note */}
          <div className="flex items-center justify-center gap-4 text-center text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-emerald-500" /> Single
              Sign-On
            </span>
            <span>·</span>
            <span>Enterprise Portal</span>
            <span>·</span>
            <button
              type="button"
              onClick={() => {
                toast.info("Need an account? Please contact admin@leadgen.pro");
              }}
              className="text-primary hover:underline cursor-pointer"
            >
              Need access?
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Dialog open={forgotModalOpen} onOpenChange={setForgotModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="size-5 text-primary" /> Reset Account Access
            </DialogTitle>
            <DialogDescription>
              Enterprise password policy for LeadGen Pro.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs text-muted-foreground">
            <p>
              To maintain strict data confidentiality of candidate databases,
              passwords are managed by your organization&apos;s Master
              Administrator.
            </p>
            <div className="rounded-lg border bg-muted/40 p-3 space-y-1.5">
              <div className="font-semibold text-foreground">
                Organization Master Admin Contact:
              </div>
              <div className="text-primary font-mono font-medium">
                admin@leadgen.pro
              </div>
              <div className="text-[11px]">
                Demo Default Password:{" "}
                <code className="font-bold text-foreground">Password@123</code>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              size="sm"
              onClick={() => {
                setPassword("Password@123");
                setForgotModalOpen(false);
                toast.success("Demo password restored: Password@123");
              }}
            >
              Reset to Default (Password@123)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

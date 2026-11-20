import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Briefcase,
  Crown,
  Lock,
  Mail,
  Microscope,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { pageHead } from "@/lib/leadgen/head";

export const Route = createFileRoute("/login")({
  head: () =>
    pageHead("Sign In", "Sign in to your LeadGen Pro workspace — Master Admin, RA, or BDE."),
  component: LoginPage,
});

const DEMO_ROLES = [
  {
    role: "admin",
    title: "Master Admin",
    desc: "Oversee lead allocation, review approvals & credits",
    email: "sriram@arahinfotech.com",
    path: "/",
    icon: Crown,
    badgeColor: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    iconBg: "bg-amber-500 text-white",
  },
  {
    role: "ra",
    title: "Research Analyst",
    desc: "Upload Excel leads, track batches & approval status",
    email: "priya.m@arahinfotech.com",
    path: "/ra",
    icon: Microscope,
    badgeColor: "bg-violet-500/10 text-violet-600 border-violet-500/20",
    iconBg: "bg-violet-500 text-white",
  },
  {
    role: "bde",
    title: "Business Development",
    desc: "Access assigned leads, use credits & update pipeline",
    email: "ravi.kumar@arahinfotech.com",
    path: "/bde",
    icon: Briefcase,
    badgeColor: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    iconBg: "bg-cyan-500 text-white",
  },
];

function LoginPage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(DEMO_ROLES[0]);
  const [email, setEmail] = useState(DEMO_ROLES[0].email);
  const [password, setPassword] = useState("••••••••••••");
  const [loading, setLoading] = useState(false);

  const handleSelectRole = (r) => {
    setSelectedRole(r);
    setEmail(r.email);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter a valid email address");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success(`Welcome back! Signed in as ${selectedRole.title}`);
      navigate({ to: selectedRole.path });
    }, 400);
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-950">
      {/* Left Branding Hero */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-slate-900 p-10 text-white lg:flex">
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 text-lg font-bold tracking-tight">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow">
              <Sparkles className="size-5" />
            </div>
            <span>LeadGen Pro</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Enterprise Lead & Analyst Operations</p>
        </div>

        <div className="relative z-10 max-w-md space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs text-slate-300 backdrop-blur">
            <ShieldCheck className="size-3.5 text-primary" />
            Role-Based Access Control
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">
            Streamlined Lead Quality, Allocation & BDE Outreach
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            One unified platform connecting Master Admin operations, Research Analyst data
            pipelines, and BDE conversion workflows.
          </p>
        </div>

        <div className="relative z-10 text-xs text-slate-500">
          © {new Date().getFullYear()} Arah Infotech. All rights reserved.
        </div>
      </div>

      {/* Right Login Container */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Sign In</h1>
            <p className="text-sm text-muted-foreground">
              Select your role to explore the unified workspace
            </p>
          </div>

          {/* Quick Role Selection Cards */}
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold text-muted-foreground">Select Persona</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {DEMO_ROLES.map((r) => {
                const Icon = r.icon;
                const isSelected = selectedRole.role === r.role;
                return (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => handleSelectRole(r)}
                    className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                        : "border-border bg-card hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div
                      className={`mb-2 flex size-8 items-center justify-center rounded-lg ${r.iconBg}`}
                    >
                      <Icon className="size-4" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">{r.title}</span>
                    <span className="mt-0.5 text-[10px] text-muted-foreground line-clamp-1">
                      {r.role.toUpperCase()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">{selectedRole.title}</CardTitle>
                  <CardDescription className="text-xs">{selectedRole.desc}</CardDescription>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${selectedRole.badgeColor}`}
                >
                  {selectedRole.role.toUpperCase()}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs">
                    Work Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs">
                      Password
                    </Label>
                    <button
                      type="button"
                      onClick={() => toast.info("Demo mode: password not required")}
                      className="text-[11px] text-primary hover:underline"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 text-xs"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full gap-2 text-xs font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    "Signing in..."
                  ) : (
                    <>
                      Enter Workspace <ArrowRight className="size-3.5" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="text-center text-xs text-muted-foreground">
            Switching between workspaces is also available inside the header menu anytime.
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  Crown,
  LogOut,
  Microscope,
  Briefcase,
  Settings,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useLeadGen } from "@/lib/leadgen/store";
import { CURRENT_RA, NOTIFICATIONS, formatDate } from "@/lib/leadgen/data";
import { cn } from "@/lib/utils";
import { findNavItem, roleForPath } from "./nav";
import { CURRENT_BDE } from "@/lib/leadgen/bde";

const RANGES = ["Last 7 Days", "Last 30 Days", "Last 90 Days", "Custom"];
const TONE = {
  blue: "bg-primary",
  amber: "bg-warning",
  red: "bg-destructive",
  green: "bg-success",
};

export function AppHeader() {
  const location = useLocation();
  const pathname = location.pathname;
  const { state, dispatch } = useLeadGen();
  const [profileOpen, setProfileOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [from, setFrom] = useState("2026-11-01");
  const [to, setTo] = useState("2026-11-18");
  const [customLabel, setCustomLabel] = useState(null);
  const [unread, setUnread] = useState(NOTIFICATIONS.map((n) => n.id));

  const navigate = useNavigate();
  const role = roleForPath(pathname);
  const ra = role !== "admin";
  const item = findNavItem(pathname);
  const home = item?.url === "/ra" || item?.url === "/bde" || !item;
  const title =
    role === "ra"
      ? home
        ? "Research Analyst Dashboard"
        : item.title
      : role === "bde"
        ? home
          ? "BDE Dashboard"
          : item.title
        : !item || item.url === "/"
          ? "Master Operations"
          : item.title;
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const displayName =
    storedUser.name ||
    (role === "ra" ? CURRENT_RA : role === "bde" ? CURRENT_BDE : "Sriram");

  const displayRole =
    storedUser.role === "admin" || storedUser.role === "Master Admin"
      ? "Master Admin"
      : storedUser.role === "ra" || storedUser.role === "Research Analyst"
        ? "Research Analyst"
        : storedUser.role === "bde" || storedUser.role === "BDE"
          ? "Business Development Executive"
          : role === "ra"
            ? "Research Analyst"
            : role === "bde"
              ? "Business Development Executive"
              : "Master Admin";

  const subtitle =
    role === "ra" && item?.url === "/ra"
      ? `Welcome back, ${displayName}`
      : role === "bde" && item?.url === "/bde"
        ? `Welcome back, ${displayName}`
        : (item?.subtitle ?? "Admin Dashboard");

  const getInitials = (name) => {
    if (!name) return "US";
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const user = {
    name: displayName,
    role: displayRole,
    email:
      storedUser.email ||
      (role === "ra"
        ? "priya.m@leadgen.pro"
        : role === "bde"
          ? "ravi.kumar@leadgen.pro"
          : "sriram@leadgen.pro"),
    initials: getInitials(displayName),
  };

  const rangeLabel =
    state.dateRange === "Custom" && customLabel ? customLabel : state.dateRange;

  return (
    <header className="sticky top-0 z-20 flex h-15 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur md:px-5">
      <SidebarTrigger className="-ml-1 text-muted-foreground" />
      <div className="flex min-w-0 items-center gap-2.5">
        <div
          className={cn(
            "hidden size-9 shrink-0 items-center justify-center rounded-lg sm:flex",
            role === "ra"
              ? "bg-tint-violet text-tint-violet-foreground"
              : role === "bde"
                ? "bg-tint-cyan text-tint-cyan-foreground"
                : "bg-tint-amber text-tint-amber-foreground",
          )}
        >
          {role === "ra" ? (
            <Microscope className="size-4.5" />
          ) : role === "bde" ? (
            <Briefcase className="size-4.5" />
          ) : (
            <Crown className="size-4.5" />
          )}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-[15px] font-bold leading-tight">
            {title}
          </h1>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {!ra && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="hidden h-9 gap-2 text-[13px] sm:inline-flex"
              >
                <CalendarDays className="text-muted-foreground" />
                {rangeLabel}
                <ChevronDown className="text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Date range
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={state.dateRange}
                onValueChange={(v) => {
                  if (v === "Custom") {
                    setCustomOpen(true);
                    return;
                  }
                  dispatch({ type: "setDateRange", range: v });
                  toast.success(`Showing data for ${v.toLowerCase()}`);
                }}
              >
                {RANGES.map((r) => (
                  <DropdownMenuRadioItem
                    key={r}
                    value={r}
                    className="text-[13px]"
                  >
                    {r}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="relative size-9"
              aria-label="Notifications"
            >
              <Bell className="text-muted-foreground" />
              {unread.length > 0 && (
                <span className="absolute -right-1 -top-1 flex size-4.5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {unread.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between border-b px-3 py-2.5">
              <span className="text-sm font-semibold">Notifications</span>
              <button
                className="text-xs font-medium text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                disabled={unread.length === 0}
                onClick={() => setUnread([])}
              >
                Mark all as read
              </button>
            </div>
            <div className="py-1">
              {NOTIFICATIONS.map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className="items-start gap-2.5 px-3 py-2"
                  onSelect={(e) => {
                    e.preventDefault();
                    setUnread((u) => u.filter((id) => id !== n.id));
                  }}
                >
                  <span
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      TONE[n.tone],
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div
                      className={cn(
                        "text-[13px] leading-snug",
                        unread.includes(n.id)
                          ? "font-semibold"
                          : "text-muted-foreground",
                      )}
                    >
                      {n.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {n.time}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-muted">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {user.initials}
              </span>
              <span className="hidden text-left md:block">
                <span className="block text-[13px] font-semibold leading-tight">
                  {user.name}
                </span>
                <span className="block text-[11px] leading-tight text-muted-foreground">
                  {user.role}
                </span>
              </span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>
              <div className="text-sm font-semibold">{user.name}</div>
              <div className="text-xs font-normal text-muted-foreground">
                {user.email}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setProfileOpen(true)}>
              <User /> My Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                navigate("/settings");
              }}
            >
              <Settings /> Account Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                toast.success("Signed out successfully");
                navigate("/login");
              }}
            >
              <LogOut /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* User Profile Modal */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>My Profile</DialogTitle>
            <DialogDescription>
              View your account details and security settings.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-3.5 rounded-lg border bg-muted/30 p-3.5">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
              {user.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  {user.name}
                </span>
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  {user.role}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground/80">
                Organization:{" "}
                {state?.settings?.general?.workspaceName ||
                  "Lead Generation Software"}
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="text-xs font-semibold text-foreground">
              Security · Change Password
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="New Password (min. 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setProfileOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                if (!newPassword || newPassword.length < 6) {
                  toast.error("Password must be at least 6 characters");
                  return;
                }
                if (newPassword !== confirmPassword) {
                  toast.error("Passwords do not match");
                  return;
                }
                setNewPassword("");
                setConfirmPassword("");
                setProfileOpen(false);
                toast.success("Password updated successfully!");
              }}
            >
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Custom date range</DialogTitle>
            <DialogDescription>
              Pick the period to show across the dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="from">From</Label>
              <Input
                id="from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!from || !to || from > to) {
                  toast.error("Start date must be before end date");
                  return;
                }
                dispatch({ type: "setDateRange", range: "Custom" });
                setCustomLabel(
                  `${formatDate(from).slice(0, 6)} – ${formatDate(to).slice(0, 6)}`,
                );
                setCustomOpen(false);
                toast.success("Custom date range applied");
              }}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}

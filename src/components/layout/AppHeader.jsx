import { useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
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
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { state, dispatch } = useLeadGen();
  const [customOpen, setCustomOpen] = useState(false);
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
  const subtitle =
    role === "ra" && item?.url === "/ra"
      ? `Welcome back, ${CURRENT_RA}`
      : role === "bde" && item?.url === "/bde"
        ? `Welcome back, ${CURRENT_BDE}`
        : (item?.subtitle ?? "Admin Dashboard");
  const user =
    role === "ra"
      ? {
          name: CURRENT_RA,
          role: "Research Analyst",
          initials: "PM",
          email: "priya.m@arahinfotech.com",
        }
      : role === "bde"
        ? {
            name: CURRENT_BDE,
            role: "Business Development Executive",
            initials: "RK",
            email: "ravi.kumar@arahinfotech.com",
          }
        : {
            name: "Sriram",
            role: "Master Admin",
            initials: "SR",
            email: "sriram@arahinfotech.com",
          };

  const rangeLabel = state.dateRange === "Custom" && customLabel ? customLabel : state.dateRange;

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
          <h1 className="truncate text-[15px] font-bold leading-tight">{title}</h1>
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
                  <DropdownMenuRadioItem key={r} value={r} className="text-[13px]">
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
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", TONE[n.tone])} />
                  <div className="min-w-0 flex-1">
                    <div
                      className={cn(
                        "text-[13px] leading-snug",
                        unread.includes(n.id) ? "font-semibold" : "text-muted-foreground",
                      )}
                    >
                      {n.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{n.time}</div>
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
                <span className="block text-[13px] font-semibold leading-tight">{user.name}</span>
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
              <div className="text-xs font-normal text-muted-foreground">{user.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => toast.info("Profile page arrives in the next iteration")}
            >
              <User /> My Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => toast.info("Account settings arrive in the next iteration")}
            >
              <Settings /> Account Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => {
                toast.success("Signed out");
                navigate({ to: "/login" });
              }}
            >
              <LogOut /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Custom date range</DialogTitle>
            <DialogDescription>Pick the period to show across the dashboard.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="from">From</Label>
              <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="to">To</Label>
              <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
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
                setCustomLabel(`${formatDate(from).slice(0, 6)} – ${formatDate(to).slice(0, 6)}`);
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

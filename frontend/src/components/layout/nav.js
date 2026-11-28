import {
  Bell,
  BarChart3,
  CheckCircle2,
  FolderUp,
  ListChecks,
  Upload,
  XCircle,
  ClipboardCheck,
  Coins,
  LayoutDashboard,
  Microscope,
  Settings,
  Share2,
  Users,
  Workflow,
  ListTodo,
  CalendarClock,
} from "lucide-react";

export const NAV_ITEMS = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    subtitle: "Admin Dashboard",
  },
  {
    title: "Leads Review",
    url: "/leads-review",
    icon: ClipboardCheck,
    subtitle: "Approve or reject uploaded leads",
  },
  {
    title: "Lead Allocation",
    url: "/lead-allocation",
    icon: Share2,
    subtitle: "Distribute approved leads to BDEs",
  },
  {
    title: "BDE Credit Management",
    url: "/credits",
    icon: Coins,
    subtitle: "Allocate and track BDE credits",
  },
  {
    title: "Research Analyst (RA)",
    url: "/research-analysts",
    icon: Microscope,
    subtitle: "Researcher uploads and quality",
  },
  {
    title: "Team Management",
    url: "/team",
    icon: Users,
    subtitle: "Researchers and BDEs",
  },
  {
    title: "Operations",
    url: "/operations",
    icon: Workflow,
    subtitle: "Follow-ups and daily operations",
  },
  {
    title: "Reports & Analytics",
    url: "/reports",
    icon: BarChart3,
    subtitle: "Performance insights",
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    subtitle: "Workspace preferences",
  },
  {
    title: "Notifications",
    url: "/notifications",
    icon: Bell,
    subtitle: "System alerts and team notifications",
  },
];

/** Research Analyst navigation (role-specific menu, same sidebar design). */
export const RA_NAV_ITEMS = [
  {
    title: "Dashboard",
    url: "/ra",
    icon: LayoutDashboard,
    subtitle: "Research Analyst Dashboard",
  },
  {
    title: "Upload Leads",
    url: "/ra/upload",
    icon: Upload,
    subtitle: "Import an Excel or CSV lead sheet",
  },
  {
    title: "My Uploads",
    url: "/ra/uploads",
    icon: FolderUp,
    subtitle: "Upload history and batches",
  },
  {
    title: "Approval Status",
    url: "/ra/status",
    icon: ListChecks,
    subtitle: "Track submitted leads",
  },
  {
    title: "Approved Leads",
    url: "/ra/approved",
    icon: CheckCircle2,
    subtitle: "Leads approved by the Master Admin",
  },
  {
    title: "Rejected Leads",
    url: "/ra/rejected",
    icon: XCircle,
    subtitle: "Correct and resubmit rejected leads",
  },
  {
    title: "Reports",
    url: "/ra/reports",
    icon: BarChart3,
    subtitle: "My performance report",
  },
];

/** BDE navigation (role-specific menu, same sidebar design). */
export const BDE_NAV_ITEMS = [
  {
    title: "Dashboard",
    url: "/bde",
    icon: LayoutDashboard,
    subtitle: "BDE Dashboard",
  },
  {
    title: "My Leads",
    url: "/bde/leads",
    icon: ListTodo,
    subtitle: "Unlock, call and update assigned leads",
  },
  {
    title: "Follow-ups",
    url: "/bde/follow-ups",
    icon: CalendarClock,
    subtitle: "Overdue, today and upcoming calls",
  },
  {
    title: "Credit Usage",
    url: "/bde/credits",
    icon: Coins,
    subtitle: "Balance, usage and top-up requests",
  },
  {
    title: "Notifications",
    url: "/bde/notifications",
    icon: Bell,
    subtitle: "Admin reminders and activity alerts",
  },
];

export const isBdePath = (path) => path === "/bde" || path.startsWith("/bde/");
/** Which role's area a path belongs to: "admin" | "ra" | "bde". */
export const roleForPath = (path) =>
  isRaPath(path) ? "ra" : isBdePath(path) ? "bde" : "admin";
export const NAV_BY_ROLE = {
  admin: NAV_ITEMS,
  ra: RA_NAV_ITEMS,
  bde: BDE_NAV_ITEMS,
};

export const isRaPath = (path) => path === "/ra" || path.startsWith("/ra/");

export function findNavItem(path) {
  const items = NAV_BY_ROLE[roleForPath(path)];
  const root = items[0].url;
  return [...items]
    .reverse()
    .find((n) =>
      n.url === root
        ? path === root || path === root + "/"
        : path === n.url || path.startsWith(n.url + "/"),
    );
}

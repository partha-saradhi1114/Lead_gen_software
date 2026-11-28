import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { BrandLogo } from "@/components/common/BrandLogo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useLeadGen } from "@/lib/leadgen/store";
import { fmt, getNotificationsForUser, getStoredReadNotificationIds } from "@/lib/leadgen/data";
import { NAV_BY_ROLE, findNavItem, roleForPath } from "./nav";
import { CURRENT_BDE, selectBdeKpis } from "@/lib/leadgen/bde";

const ROLE_LABEL = {
  admin: "Main Menu",
  ra: "Research Analyst",
  bde: "Business Development",
};
const ROLE_FOOT = {
  admin: "Admin Console",
  ra: "Research Analyst",
  bde: "BDE Workspace",
};
import { CURRENT_RA } from "@/lib/leadgen/data";

export function AppSidebar() {
  const location = useLocation();
  const pathname = location.pathname;
  const { kpis, state } = useLeadGen();
  const role = roleForPath(pathname);
  const ra = role === "ra";
  const items = NAV_BY_ROLE[role];
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();
  const currentBdeName =
    (storedUser.role === "bde" ||
      storedUser.role === "BDE" ||
      storedUser.role === "Business Development Executive") &&
    storedUser.name
      ? storedUser.name
      : CURRENT_BDE;
  const currentRaName =
    (storedUser.role === "ra" ||
      storedUser.role === "Research Analyst" ||
      storedUser.role === "researcher") &&
    storedUser.name
      ? storedUser.name
      : CURRENT_RA;

  const [readIds, setReadIds] = useState(() => getStoredReadNotificationIds());

  useEffect(() => {
    const handleReadChange = () => {
      setReadIds(getStoredReadNotificationIds());
    };
    window.addEventListener("leadgen_notifications_read_change", handleReadChange);
    return () => {
      window.removeEventListener("leadgen_notifications_read_change", handleReadChange);
    };
  }, []);

  const bdeDue =
    role === "bde"
      ? (({ overdue, today }) => overdue + today)(
          selectBdeKpis(state, currentBdeName),
        )
      : 0;
  const bdeNotifs =
    role === "bde" ? getNotificationsForUser("bde", currentBdeName) : [];
  const bdeUnreadCount = bdeNotifs.filter((n) => !readIds.has(String(n.id))).length;
  const adminNotifs =
    role === "admin" ? getNotificationsForUser("admin", "Sriram") : [];
  const adminUnreadCount = adminNotifs.filter((n) => !readIds.has(String(n.id))).length;
  const activeUrl = findNavItem(pathname)?.url;
  const raRejected = ra
    ? state.leads.filter(
        (l) =>
          (l.uploadedBy === currentRaName ||
            l.uploaderName === currentRaName) &&
          l.status === "rejected",
      ).length
    : 0;

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="px-3 pb-3 pt-4">
        <BrandLogo size="md" light={true} subtitle={true} />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-sidebar-muted">
            {ROLE_LABEL[role]}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {items.map((item) => {
                const active = item.url === activeUrl;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className="h-9 rounded-lg text-[13px] font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:shadow-pop"
                    >
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.url === "/ra/rejected" && raRejected > 0 && (
                      <SidebarMenuBadge className="rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-destructive-foreground peer-data-[active=true]/menu-button:text-destructive-foreground">
                        {fmt(raRejected)}
                      </SidebarMenuBadge>
                    )}
                    {item.url === "/bde/follow-ups" && bdeDue > 0 && (
                      <SidebarMenuBadge className="rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-destructive-foreground peer-data-[active=true]/menu-button:text-destructive-foreground">
                        {fmt(bdeDue)}
                      </SidebarMenuBadge>
                    )}
                    {item.url === "/bde/notifications" && bdeUnreadCount > 0 && (
                      <SidebarMenuBadge className="rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground peer-data-[active=true]/menu-button:text-destructive-foreground animate-pulse">
                        {fmt(bdeUnreadCount)}
                      </SidebarMenuBadge>
                    )}
                    {item.url === "/notifications" && adminUnreadCount > 0 && (
                      <SidebarMenuBadge className="rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground peer-data-[active=true]/menu-button:text-destructive-foreground animate-pulse">
                        {fmt(adminUnreadCount)}
                      </SidebarMenuBadge>
                    )}
                    {item.url === "/leads-review" &&
                      role === "admin" &&
                      kpis.pending > 0 && (
                        <SidebarMenuBadge className="rounded-full bg-warning px-1.5 text-[10px] font-semibold text-warning-foreground peer-data-[active=true]/menu-button:text-warning-foreground">
                          {fmt(kpis.pending)}
                        </SidebarMenuBadge>
                      )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 group-data-[collapsible=icon]:hidden">
        <div className="rounded-lg bg-sidebar-accent p-3">
          <div className="text-[11px] text-sidebar-muted">Workspace</div>
          <div
            className="text-[13px] font-semibold text-sidebar-accent-foreground truncate"
            title={
              state?.settings?.general?.workspaceName ||
              "Lead Generation Software"
            }
          >
            {state?.settings?.general?.workspaceName ||
              "Lead Generation Software"}
          </div>
          <div className="mt-0.5 text-[11px] text-sidebar-muted">
            v1.0 · {ROLE_FOOT[role]}
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

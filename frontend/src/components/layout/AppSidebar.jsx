import { Link, useRouterState } from "@tanstack/react-router";
import { Target } from "lucide-react";
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
import { fmt } from "@/lib/leadgen/data";
import { NAV_BY_ROLE, findNavItem, roleForPath } from "./nav";
import { CURRENT_BDE, selectBdeKpis } from "@/lib/leadgen/bde";

const ROLE_LABEL = { admin: "Main Menu", ra: "Research Analyst", bde: "Business Development" };
const ROLE_FOOT = { admin: "Admin Console", ra: "Research Analyst", bde: "BDE Workspace" };
import { CURRENT_RA } from "@/lib/leadgen/data";

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { kpis, state } = useLeadGen();
  const role = roleForPath(pathname);
  const ra = role === "ra";
  const items = NAV_BY_ROLE[role];
  const bdeDue =
    role === "bde"
      ? (({ overdue, today }) => overdue + today)(selectBdeKpis(state, CURRENT_BDE))
      : 0;
  const activeUrl = findNavItem(pathname)?.url;
  const raRejected = ra
    ? state.leads.filter((l) => l.uploadedBy === CURRENT_RA && l.status === "rejected").length
    : 0;

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="px-3 pb-3 pt-4">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-pop">
            <Target className="size-5" strokeWidth={2.4} />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="truncate text-[15px] font-bold leading-tight text-sidebar-accent-foreground">
              LeadGen Pro
            </div>
            <div className="text-[11px] leading-tight text-sidebar-muted">
              Lead Generation &amp; Team Operations
            </div>
          </div>
        </div>
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
                    {item.url === "/leads-review" && role === "admin" && kpis.pending > 0 && (
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
          <div className="text-[13px] font-semibold text-sidebar-accent-foreground">
            Arah Infotech
          </div>
          <div className="mt-0.5 text-[11px] text-sidebar-muted">v1.0 · {ROLE_FOOT[role]}</div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

import { Outlet } from "react-router-dom";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";

export function AppLayout() {
  return (
    <SidebarProvider style={{ "--sidebar-width": "245px", "--sidebar-width-icon": "3.5rem" }}>
      <AppSidebar />
      <SidebarInset className="min-w-0 bg-background">
        <AppHeader />
        <main className="min-w-0 max-w-full flex-1 overflow-x-hidden p-4 md:p-5">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

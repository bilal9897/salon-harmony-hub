import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import { Scissors } from "lucide-react";

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border/50 bg-card/60 backdrop-blur-md px-4 sticky top-0 z-10">
            <SidebarTrigger className="mr-3" />
            <div className="h-5 w-px bg-border mr-3" />
            <span className="text-sm font-medium text-muted-foreground tracking-tight">Salon Management</span>
          </header>
          <main className="flex-1 p-5 md:p-8 overflow-y-auto">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

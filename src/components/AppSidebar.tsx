import {
  LayoutDashboard,
  CreditCard,
  Users,
  Receipt,
  Wallet,
  ScanLine,
  Scissors,
  FileBarChart,
  Settings,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Payments & Expenses", url: "/payments", icon: CreditCard },
  { title: "Staff", url: "/staff", icon: Users },
  { title: "Daily Cash", url: "/daily-cash", icon: Wallet },
  { title: "Reports", url: "/reports", icon: FileBarChart },
];

const toolItems = [
  { title: "AI Scanner", url: "/scanner", icon: ScanLine },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const renderItems = (items: typeof mainItems) =>
    items.map((item) => (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild>
          <NavLink
            to={item.url}
            end={item.url === "/"}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-sidebar-foreground transition-all duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
                <Scissors className="h-4 w-4 text-sidebar-primary-foreground" />
              </div>
              {!collapsed && (
                <span className="font-display text-base font-bold text-sidebar-accent-foreground tracking-tight">
                  GlamBook
                </span>
              )}
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5 px-2">
              {renderItems(mainItems)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="px-4 text-[11px] uppercase tracking-widest text-sidebar-foreground/40">
            {!collapsed && "Tools"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5 px-2">
              {renderItems(toolItems)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

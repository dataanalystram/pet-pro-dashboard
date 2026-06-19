import {
  LayoutDashboard, CalendarDays, Users, Inbox, Scissors,
  Megaphone, Boxes, BarChart3, MessageSquare, UserCog, Settings, LogOut, Star,
  ShoppingCart, Sparkles, Repeat, ChevronsLeft,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";

import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

type Item = {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  badge?: "PRO" | "NEW" | number;
};

const operations: Item[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Appointments", url: "/appointments", icon: CalendarDays },
  { title: "Requests", url: "/requests", icon: Inbox },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "Staff", url: "/staff", icon: UserCog },
];

const growth: Item[] = [
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Memberships", url: "/memberships", icon: Repeat, badge: "PRO" },
  { title: "Marketing", url: "/marketing", icon: Megaphone },
  { title: "Reviews", url: "/reviews", icon: Star },
];

const commerce: Item[] = [
  { title: "Services", url: "/services", icon: Scissors },
  { title: "Inventory", url: "/inventory", icon: Boxes },
  { title: "Orders", url: "/orders", icon: ShoppingCart },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

const system: Item[] = [
  { title: "Pricing", url: "/pricing", icon: Sparkles },
  { title: "Billing", url: "/billing", icon: Star },
  { title: "Settings", url: "/settings", icon: Settings },
];

function NavItem({ item, isActive, collapsed }: { item: Item; isActive: boolean; collapsed: boolean }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title} className="group/nav h-10 rounded-xl">
        <NavLink to={item.url} end className="flex items-center gap-3 px-3 transition-all">
          <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
          {!collapsed && (
            <>
              <span className="flex-1 text-[13px] font-medium truncate">{item.title}</span>
              {item.badge === "PRO" && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[hsl(75_95%_62%)] text-[hsl(0_0%_8%)] tracking-wide">
                  PRO
                </span>
              )}
              {item.badge === "NEW" && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500 text-white tracking-wide">NEW</span>
              )}
              {typeof item.badge === "number" && (
                <span className="text-[10px] font-semibold min-w-[18px] h-[18px] px-1 rounded-full bg-sidebar-accent text-sidebar-accent-foreground flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </>
          )}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const renderGroup = (label: string, items: Item[]) => (
    <SidebarGroup className="px-2 pt-3">
      {!collapsed && (
        <SidebarGroupLabel className="text-sidebar-foreground/45 uppercase text-[10px] tracking-[0.16em] font-bold px-3 mb-1.5">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu className="gap-0.5">
          {items.map((item) => (
            <NavItem key={item.title} item={item} isActive={isActive(item.url)} collapsed={collapsed} />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/70">
      <SidebarContent className="gap-0 bg-sidebar">
        {/* Brand */}
        <div className={`h-16 flex items-center border-b border-sidebar-border/70 ${collapsed ? "justify-center px-2" : "px-4 gap-3"}`}>
          <div className="w-9 h-9 rounded-xl bg-[hsl(0_0%_8%)] flex items-center justify-center flex-shrink-0 relative shadow-sm">
            <span className="text-[hsl(75_95%_62%)] font-extrabold text-[11px] tracking-tight">PD</span>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[hsl(75_95%_62%)] ring-2 ring-sidebar" />
          </div>
          {!collapsed && (
            <>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-bold text-[14px] text-sidebar-accent-foreground tracking-tight leading-tight truncate">
                  PetDash Pro
                </span>
                <span className="text-[10px] text-sidebar-foreground/55 leading-tight font-medium">Business Suite</span>
              </div>
              <button
                onClick={toggleSidebar}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-sidebar-accent transition-colors"
                aria-label="Collapse sidebar"
              >
                <ChevronsLeft className="w-4 h-4 text-sidebar-foreground/60" />
              </button>
            </>
          )}
        </div>

        {/* Scrollable nav */}
        <div className="flex-1 overflow-y-auto pb-2">
          {renderGroup("Operations", operations)}
          {renderGroup("Growth", growth)}
          {renderGroup("Commerce", commerce)}
          {renderGroup("System", system)}
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/70 bg-sidebar p-0">
        {!collapsed ? (
          <div className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[hsl(75_95%_62%)] flex items-center justify-center text-[hsl(0_0%_8%)] text-xs font-bold flex-shrink-0">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-sidebar-accent-foreground truncate">Admin User</p>
              <p className="text-[10px] text-sidebar-foreground/55 truncate">admin@petdash.com</p>
            </div>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-sidebar-accent transition-colors flex-shrink-0" aria-label="Log out">
              <LogOut className="w-3.5 h-3.5 text-sidebar-foreground/60" />
            </button>
          </div>
        ) : (
          <div className="p-2 flex justify-center">
            <div className="w-9 h-9 rounded-xl bg-[hsl(75_95%_62%)] flex items-center justify-center text-[hsl(0_0%_8%)] text-xs font-bold">
              A
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

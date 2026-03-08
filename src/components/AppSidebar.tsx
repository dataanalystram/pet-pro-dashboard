import {
  LayoutDashboard, CalendarDays, Users, Inbox, Scissors,
  Megaphone, Boxes, BarChart3, MessageSquare, UserCog, Settings, LogOut, Star,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";

import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Appointments", url: "/appointments", icon: CalendarDays },
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Requests", url: "/requests", icon: Inbox },
  { title: "Services", url: "/services", icon: Scissors },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "Reviews", url: "/reviews", icon: Star },
];

const managementItems = [
  { title: "Marketing", url: "/marketing", icon: Megaphone },
  { title: "Inventory", url: "/inventory", icon: Boxes },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Staff", url: "/staff", icon: UserCog },
];

const secondaryItems = [
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="gap-0">
        {/* Logo */}
        <div className="h-14 flex items-center gap-3 px-4 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <span className="text-sidebar-primary-foreground font-bold text-xs">PD</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-sidebar-accent-foreground tracking-tight leading-tight">
                PetDash Pro
              </span>
              <span className="text-[10px] text-sidebar-foreground/50 leading-tight">Business Suite</span>
            </div>
          )}
        </div>

        {/* Main Nav */}
        <SidebarGroup className="pt-4">
          <SidebarGroupLabel className="text-sidebar-foreground/40 uppercase text-[10px] tracking-[0.1em] font-medium px-4 mb-1">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <NavLink to={item.url} end>
                      <item.icon className="h-[18px] w-[18px]" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Management */}
        <SidebarGroup className="pt-2">
          <SidebarGroupLabel className="text-sidebar-foreground/40 uppercase text-[10px] tracking-[0.1em] font-medium px-4 mb-1">
            Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <NavLink to={item.url} end>
                      <item.icon className="h-[18px] w-[18px]" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* System */}
        <SidebarGroup className="pt-2 mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <NavLink to={item.url} end>
                      <item.icon className="h-[18px] w-[18px]" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed ? (
          <div className="p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-accent-foreground text-xs font-semibold flex-shrink-0">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-accent-foreground truncate">Admin User</p>
              <p className="text-[10px] text-sidebar-foreground/50 truncate">admin@petdash.com</p>
            </div>
            <button className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-sidebar-accent transition-colors flex-shrink-0">
              <LogOut className="w-3.5 h-3.5 text-sidebar-foreground/50" />
            </button>
          </div>
        ) : (
          <div className="p-2 flex justify-center">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-accent-foreground text-xs font-semibold">
              A
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

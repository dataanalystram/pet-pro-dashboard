import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Search, ChevronRight } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "react-router-dom";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/appointments": "Appointments",
  "/customers": "Customers",
  "/requests": "Booking Requests",
  "/services": "Services",
  "/marketing": "Marketing",
  "/inventory": "Inventory",
  "/analytics": "Analytics",
  "/messages": "Messages",
  "/staff": "Staff",
  "/settings": "Settings",
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const location = useLocation();
  const pageTitle = pageTitles[location.pathname] || "Dashboard";
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="min-h-screen flex w-full premium-shell">
        {!isMobile && <AppSidebar />}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center gap-3 border-b border-border/60 px-4 lg:px-6 bg-surface-glass backdrop-blur-2xl sticky top-0 z-10">
            {!isMobile && <SidebarTrigger className="mr-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent" />}
            
            {isMobile ? (
              <span className="font-semibold text-sm tracking-normal">{pageTitle}</span>
            ) : (
              <>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mr-4">
                  <span className="hidden lg:inline">PetDash Pro</span>
                  <ChevronRight className="w-3.5 h-3.5 hidden lg:block" />
                  <span className="font-medium text-foreground">{pageTitle}</span>
                </div>
                <div className="hidden md:flex relative flex-1 max-w-xs ml-auto mr-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input placeholder="Search anything..." className="pl-9 h-9 text-sm bg-background/55 border-border/50 focus-visible:ring-1 rounded-2xl shadow-sm" />
                </div>
              </>
            )}

            <div className="ml-auto flex items-center gap-1.5">
              <NotificationBell />
              {!isMobile && (
                <div className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold shadow-sm shadow-primary/20">
                  A
                </div>
              )}
            </div>
          </header>
          <main className={`flex-1 p-4 lg:p-7 overflow-auto ${isMobile ? 'pb-24' : ''}`}>
            {children}
          </main>
        </div>
        {isMobile && <MobileBottomNav />}
      </div>
    </SidebarProvider>
  );
}

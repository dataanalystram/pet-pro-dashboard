import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Bell, Search, ChevronRight } from "lucide-react";
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
      <div className="min-h-screen flex w-full bg-background">
        {!isMobile && <AppSidebar />}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-3 border-b px-4 lg:px-6 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
            {!isMobile && <SidebarTrigger className="mr-1 text-muted-foreground hover:text-foreground" />}
            
            {isMobile ? (
              <span className="font-semibold text-sm tracking-tight">{pageTitle}</span>
            ) : (
              <>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mr-4">
                  <span className="hidden lg:inline">PetDash Pro</span>
                  <ChevronRight className="w-3.5 h-3.5 hidden lg:block" />
                  <span className="font-medium text-foreground">{pageTitle}</span>
                </div>
                <div className="hidden md:flex relative flex-1 max-w-xs ml-auto mr-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input placeholder="Search anything..." className="pl-9 h-8 text-sm bg-muted/60 border-0 focus-visible:ring-1 rounded-lg" />
                </div>
              </>
            )}

            <div className="ml-auto flex items-center gap-1.5">
              <button className="relative w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
                <Bell className="w-[18px] h-[18px] text-muted-foreground" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-destructive rounded-full" />
              </button>
              {!isMobile && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-xs font-semibold shadow-sm">
                  A
                </div>
              )}
            </div>
          </header>
          <main className={`flex-1 p-4 lg:p-6 overflow-auto ${isMobile ? 'pb-24' : ''}`}>
            {children}
          </main>
        </div>
        {isMobile && <MobileBottomNav />}
      </div>
    </SidebarProvider>
  );
}

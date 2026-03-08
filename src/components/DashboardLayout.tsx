import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {!isMobile && <AppSidebar />}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b px-4 bg-card sticky top-0 z-10">
            {!isMobile && <SidebarTrigger className="mr-3" />}
            {isMobile ? (
              <span className="font-semibold text-sm tracking-tight">PetDash Pro</span>
            ) : (
              <div className="hidden sm:flex relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-9 h-9 bg-muted/50 border-0 focus-visible:ring-1" />
              </div>
            )}
            <div className="ml-auto flex items-center gap-2">
              <button className="relative w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
              </button>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
                A
              </div>
            </div>
          </header>
          <main className={`flex-1 p-4 md:p-6 overflow-auto ${isMobile ? 'pb-24' : ''}`}>{children}</main>
        </div>
        {isMobile && <MobileBottomNav />}
      </div>
    </SidebarProvider>
  );
}

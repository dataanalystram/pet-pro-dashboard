import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, CalendarDays, Users, MessageSquare,
  BarChart3, MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Inbox, Scissors, Megaphone, Boxes, UserCog, Settings, Star, ShoppingCart,
} from "lucide-react";

const primaryTabs = [
  { title: "Home", url: "/", icon: LayoutDashboard },
  { title: "Bookings", url: "/appointments", icon: CalendarDays },
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "More", url: "__more__", icon: MoreHorizontal },
];

const moreItems = [
  { title: "Requests", url: "/requests", icon: Inbox },
  { title: "Reviews", url: "/reviews", icon: Star },
  { title: "Services", url: "/services", icon: Scissors },
  { title: "Marketing", url: "/marketing", icon: Megaphone },
  { title: "Inventory", url: "/inventory", icon: Boxes },
  { title: "Orders", url: "/orders", icon: ShoppingCart },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Staff", url: "/staff", icon: UserCog },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (url: string) => {
    if (url === "/") return location.pathname === "/";
    return location.pathname.startsWith(url);
  };

  const isMoreActive = moreItems.some((item) => isActive(item.url));

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none safe-area-bottom">
        <div className="mx-auto mb-3 flex max-w-[370px] items-center justify-between gap-1 rounded-[2rem] border border-border/60 bg-surface-glass p-1.5 shadow-lg backdrop-blur-2xl pointer-events-auto">
          {primaryTabs.map((tab) => {
            const active = tab.url === "__more__" ? isMoreActive || moreOpen : isActive(tab.url);
            return (
              <button
                key={tab.title}
                onClick={() => {
                  if (tab.url === "__more__") {
                    setMoreOpen(true);
                  } else {
                    navigate(tab.url);
                  }
                }}
                className={cn(
                  "relative flex min-h-[58px] flex-1 flex-col items-center justify-center gap-1 rounded-[1.5rem] px-1 transition-all duration-300 active:scale-95",
                  active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <span className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300",
                  active ? "bg-primary-foreground/15" : "bg-transparent"
                )}>
                  <tab.icon className="w-4.5 h-4.5" />
                </span>
                <span className="text-[10px] font-semibold leading-none tracking-normal">{tab.title}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-8 bg-surface-glass backdrop-blur-2xl border-border/60">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-base">More Options</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-4 gap-3 pt-2">
            {moreItems.map((item) => (
              <button
                key={item.title}
                onClick={() => {
                  navigate(item.url);
                  setMoreOpen(false);
                }}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-200 min-h-[72px]",
                  isActive(item.url) ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:bg-muted/70"
                )}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-[11px] font-medium">{item.title}</span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

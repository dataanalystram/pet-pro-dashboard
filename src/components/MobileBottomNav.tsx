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
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-surface-glass/85 backdrop-blur-2xl safe-area-bottom">
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-2">
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
                   "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[60px] transition-all duration-200 rounded-2xl",
                   active ? "text-primary bg-primary/10" : "text-muted-foreground"
                )}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{tab.title}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-8 bg-surface-glass/95 backdrop-blur-2xl border-border/60">
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

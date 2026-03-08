import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Calendar, Users, Inbox, Megaphone,
  Package, MessageSquare, BarChart3, UserCog, ChevronLeft,
  PawPrint, X, Boxes, Scissors, ArrowLeftRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', end: true },
  { icon: Calendar, label: 'Appointments', path: '/dashboard/appointments' },
  { icon: Users, label: 'Customers', path: '/dashboard/customers' },
  { icon: Inbox, label: 'Requests', path: '/dashboard/requests', badgeKey: 'pending_requests' },
  { icon: Scissors, label: 'Services', path: '/dashboard/services' },
  { icon: Megaphone, label: 'Marketing', path: '/dashboard/marketing' },
  { icon: Boxes, label: 'Inventory', path: '/dashboard/inventory' },
  { icon: BarChart3, label: 'Analytics', path: '/dashboard/analytics' },
  { icon: MessageSquare, label: 'Messages', path: '/dashboard/messages' },
  { icon: UserCog, label: 'Staff', path: '/dashboard/staff' },
];

export default function Sidebar({ isOpen, onToggle, mobileOpen, onMobileClose }) {
  const { provider } = useAuth();
  const location = useLocation();

  const content = (
    <div className={cn(
      "flex flex-col h-full bg-sidebar text-sidebar-text transition-all duration-300",
      isOpen ? "w-[260px]" : "w-[68px]"
    )}>
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-white/10">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-provider-primary flex items-center justify-center flex-shrink-0">
            <PawPrint className="w-5 h-5 text-white" />
          </div>
          {isOpen && (
            <span className="font-bold text-white text-lg truncate tracking-tight">
              Paw Paradise
            </span>
          )}
        </div>
        {/* Desktop collapse */}
        <button
          onClick={onToggle}
          className="ml-auto hidden lg:flex w-7 h-7 rounded-md items-center justify-center hover:bg-white/10 text-slate-400"
          data-testid="sidebar-toggle"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", !isOpen && "rotate-180")} />
        </button>
        {/* Mobile close */}
        <button
          onClick={onMobileClose}
          className="ml-auto lg:hidden w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/10 text-slate-400"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Provider info */}
      {isOpen && provider && (
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-sm font-semibold text-white truncate">{provider.business_name}</p>
          <p className="text-xs text-slate-400 capitalize">{provider.business_type}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto" data-testid="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onClick={onMobileClose}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group relative",
              isActive
                ? "bg-provider-primary text-white"
                : "text-slate-400 hover:text-white hover:bg-white/8"
            )}
            data-testid={`nav-${item.label.toLowerCase()}`}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span className="truncate">{item.label}</span>}
            {!isOpen && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                {item.label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Status + Settings + Product Switcher */}
      {isOpen && provider && (
        <div className="px-4 py-3 border-t border-white/10 space-y-2">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              provider.is_accepting_bookings ? "bg-emerald-400" : "bg-slate-500"
            )} />
            <span className="text-xs text-slate-400">
              {provider.is_accepting_bookings ? 'Accepting bookings' : 'Not accepting'}
            </span>
          </div>
        </div>
      )}
      {/* Product Switcher */}
      <div className="px-3 py-3 border-t border-white/10">
        <NavLink
          to="/select-product"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/8 transition-colors"
        >
          <ArrowLeftRight className="w-4 h-4" />
          {isOpen && <span>Switch Product</span>}
        </NavLink>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block flex-shrink-0" data-testid="desktop-sidebar">
        {content}
      </aside>
      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        data-testid="mobile-sidebar"
      >
        {content}
      </aside>
    </>
  );
}

import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Heart, FileCheck, Users, Stethoscope,
  ClipboardList, DollarSign, Activity, ChevronLeft, X,
  Home, ArrowLeftRight, Settings, UserCircle, Building2, BarChart3,
  Calendar, MapPin, Search, FileText, PieChart
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/shelter', end: true },
  { icon: Heart, label: 'Animals', path: '/shelter/animals' },
  { icon: FileCheck, label: 'Applications', path: '/shelter/applications' },
  { icon: Home, label: 'Fosters', path: '/shelter/fosters' },
  { icon: MapPin, label: 'Locations', path: '/shelter/locations' },
  { icon: Search, label: 'Lost & Found', path: '/shelter/lost-found' },
  { icon: UserCircle, label: 'People', path: '/shelter/people' },
  { icon: Building2, label: 'Partners', path: '/shelter/partners' },
  { icon: Users, label: 'Volunteers', path: '/shelter/volunteers' },
  { icon: Calendar, label: 'Shifts', path: '/shelter/shifts' },
  { icon: Stethoscope, label: 'Medical', path: '/shelter/medical' },
  { icon: ClipboardList, label: 'Daily Ops', path: '/shelter/daily-ops' },
  { icon: FileText, label: 'Contracts', path: '/shelter/contracts' },
  { icon: DollarSign, label: 'Donations', path: '/shelter/donations' },
  { icon: PieChart, label: 'Analytics', path: '/shelter/analytics' },
  { icon: BarChart3, label: 'Reports', path: '/shelter/reports' },
  { icon: Activity, label: 'Activity Log', path: '/shelter/activity' },
  { icon: Settings, label: 'Settings', path: '/shelter/settings' },
];

export default function ShelterSidebar({ isOpen, onToggle, mobileOpen, onMobileClose }) {
  const { shelter } = useAuth();

  const content = (
    <div className={cn(
      "flex flex-col h-full bg-shelter-sidebar text-sidebar-text transition-all duration-300",
      isOpen ? "w-[260px]" : "w-[68px]"
    )}>
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-white/10">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-shelter-primary flex items-center justify-center flex-shrink-0">
            <Home className="w-5 h-5 text-white" />
          </div>
          {isOpen && (
            <span className="font-bold text-white text-lg truncate tracking-tight">
              Shelter
            </span>
          )}
        </div>
        <button onClick={onToggle} className="ml-auto hidden lg:flex w-7 h-7 rounded-md items-center justify-center hover:bg-white/10 text-slate-400">
          <ChevronLeft className={cn("w-4 h-4 transition-transform", !isOpen && "rotate-180")} />
        </button>
        <button onClick={onMobileClose} className="ml-auto lg:hidden w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/10 text-slate-400">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Shelter info */}
      {isOpen && shelter && (
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-sm font-semibold text-white truncate">{shelter.name}</p>
          <p className="text-xs text-slate-400 capitalize">{shelter.organization_type?.replace(/_/g, ' ')}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onClick={onMobileClose}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group relative",
              isActive ? "bg-shelter-primary text-white" : "text-slate-400 hover:text-white hover:bg-white/8"
            )}
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
      <aside className="hidden lg:block flex-shrink-0">{content}</aside>
      <aside className={cn("fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
        {content}
      </aside>
    </>
  );
}

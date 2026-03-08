import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Calendar, Users, Stethoscope, FileText,
  Pill, Syringe, Package, Receipt, UserCog, ChevronLeft,
  X, ArrowLeftRight, Settings, Kanban
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/vet', end: true },
  { icon: Kanban, label: 'Flow Board', path: '/vet/flow-board' },
  { icon: Calendar, label: 'Appointments', path: '/vet/appointments' },
  { icon: Stethoscope, label: 'Patients', path: '/vet/patients' },
  { icon: Users, label: 'Clients', path: '/vet/clients' },
  { icon: FileText, label: 'Medical Records', path: '/vet/records' },
  { icon: Pill, label: 'Prescriptions', path: '/vet/prescriptions' },
  { icon: Syringe, label: 'Vaccinations', path: '/vet/vaccinations' },
  { icon: Package, label: 'Inventory', path: '/vet/inventory' },
  { icon: Receipt, label: 'Billing', path: '/vet/billing' },
  { icon: UserCog, label: 'Staff', path: '/vet/staff' },
  { icon: Settings, label: 'Settings', path: '/vet/settings' },
];

export default function VetSidebar({ isOpen, onToggle, mobileOpen, onMobileClose }) {
  const { vetClinic } = useAuth();

  const content = (
    <div className={cn(
      "flex flex-col h-full bg-vet-sidebar text-sidebar-text transition-all duration-300",
      isOpen ? "w-[260px]" : "w-[68px]"
    )}>
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-white/10">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-vet-primary flex items-center justify-center flex-shrink-0">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          {isOpen && (
            <span className="font-bold text-white text-lg truncate tracking-tight">
              Vet Clinic
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

      {/* Clinic info */}
      {isOpen && vetClinic && (
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-sm font-semibold text-white truncate">{vetClinic.name}</p>
          <p className="text-xs text-slate-400 capitalize">{vetClinic.clinic_type} practice</p>
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
              isActive ? "bg-vet-primary text-white" : "text-slate-400 hover:text-white hover:bg-white/8"
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

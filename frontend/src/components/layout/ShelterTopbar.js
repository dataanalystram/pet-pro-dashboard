import { useAuth } from '@/contexts/AuthContext';
import { Menu, Search, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { NotificationBell } from '@/components/shelter/NotificationCenter';

export default function ShelterTopbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-6 gap-4">
      <button onClick={onMenuClick} className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center hover:bg-slate-100">
        <Menu className="w-5 h-5 text-slate-600" />
      </button>

      <div className="flex-1 max-w-md hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search animals, applications..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-shelter-primary/20 focus:border-shelter-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <NotificationBell />

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100"
          >
            <div className="w-8 h-8 rounded-full bg-shelter-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-shelter-primary" />
            </div>
            <span className="hidden md:block text-sm font-medium text-slate-700 max-w-[140px] truncate">
              {user?.full_name || 'User'}
            </span>
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50">
              <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

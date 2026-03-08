import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { notificationsAPI } from '@/api';
import GlobalSearch from '@/components/GlobalSearch';
import { Bell, Search, Menu, LogOut, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const { data } = await notificationsAPI.list();
      setNotifications(data);
    } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === '/' && !e.target.closest('input, textarea')) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    await notificationsAPI.readAll();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 flex-shrink-0" data-testid="topbar">
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600" data-testid="mobile-menu-btn">
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 w-72 hover:bg-slate-200 transition-colors cursor-pointer"
            data-testid="global-search-trigger"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400 flex-1 text-left">Search bookings, customers...</span>
            <kbd className="text-xs text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">/</kbd>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Notifications */}
          <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" data-testid="notifications-btn">
                <Bell className="w-5 h-5 text-slate-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto" data-testid="notifications-panel">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
                <span className="text-sm font-semibold text-slate-900">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-provider-primary hover:underline" data-testid="mark-all-read">
                    Mark all read
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No notifications</div>
              ) : notifications.slice(0, 10).map((n) => (
                <div key={n.id} className={cn("px-3 py-2.5 border-b border-slate-50 hover:bg-slate-50", !n.is_read && "bg-blue-50/50")} data-testid={`notif-${n.id}`}>
                  <p className="text-xs font-medium text-slate-900">{n.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{n.message}</p>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors" data-testid="profile-menu-trigger">
                <div className="w-8 h-8 rounded-full bg-provider-primary flex items-center justify-center text-white text-sm font-semibold">
                  {user?.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-medium text-slate-700 hidden sm:block">{user?.full_name || 'User'}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate('/dashboard/settings')} data-testid="menu-profile">
                <User className="w-4 h-4 mr-2" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/dashboard/settings')} data-testid="menu-settings">
                <Settings className="w-4 h-4 mr-2" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600" data-testid="menu-logout">
                <LogOut className="w-4 h-4 mr-2" /> Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

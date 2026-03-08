import { useState, useEffect } from 'react';
import { shelterAPI } from '@/api';
import { Bell, Check, CheckCheck, AlertCircle, Info, Clock, FileText, Heart, User, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const TYPE_CONFIG = {
  info: { icon: Info, color: 'bg-blue-50 text-blue-600' },
  warning: { icon: AlertCircle, color: 'bg-amber-50 text-amber-600' },
  alert: { icon: Bell, color: 'bg-red-50 text-red-600' },
  reminder: { icon: Clock, color: 'bg-purple-50 text-purple-600' },
};

export default function NotificationCenter({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await shelterAPI.getNotifications({});
      setNotifications(res.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleMarkRead = async (id) => {
    try {
      await shelterAPI.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? {...n, read: true} : n));
    } catch (e) { console.error(e); }
  };

  const handleMarkAllRead = async () => {
    try {
      await shelterAPI.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({...n, read: true})));
    } catch (e) { console.error(e); }
  };

  const filtered = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;
  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="absolute right-4 top-16 w-96 max-h-[80vh] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-shelter-primary" />
            <h3 className="font-semibold text-slate-900">Notifications</h3>
            {unreadCount > 0 && <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded-full">{unreadCount}</span>}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-shelter-primary hover:underline flex items-center gap-1">
                <CheckCheck className="w-3 h-3" /> Mark all read
              </button>
            )}
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded"><X className="w-4 h-4 text-slate-400" /></button>
          </div>
        </div>

        <div className="flex gap-1 p-2 bg-slate-50">
          <button onClick={() => setFilter('all')} className={cn('flex-1 py-1.5 text-xs font-medium rounded', filter === 'all' ? 'bg-white shadow-sm' : 'text-slate-500')}>All</button>
          <button onClick={() => setFilter('unread')} className={cn('flex-1 py-1.5 text-xs font-medium rounded', filter === 'unread' ? 'bg-white shadow-sm' : 'text-slate-500')}>Unread</button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-shelter-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No notifications
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map(notif => {
                const typeCfg = TYPE_CONFIG[notif.notification_type] || TYPE_CONFIG.info;
                const Icon = typeCfg.icon;
                return (
                  <div key={notif.id} className={cn('p-4 hover:bg-slate-50 cursor-pointer transition-colors', !notif.read && 'bg-blue-50/30')} onClick={() => handleMarkRead(notif.id)}>
                    <div className="flex gap-3">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', typeCfg.color)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={cn('text-sm font-medium', notif.read ? 'text-slate-600' : 'text-slate-900')}>{notif.title}</h4>
                          {!notif.read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-xs text-slate-400 mt-1">{notif.created_at ? new Date(notif.created_at).toLocaleString() : ''}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Bell button component for header
export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchCount = async () => {
    try {
      const res = await shelterAPI.getNotificationCount();
      setCount(res.data?.count || 0);
    } catch (e) {}
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="relative p-2 hover:bg-slate-100 rounded-lg">
        <Bell className="w-5 h-5 text-slate-600" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>
      <NotificationCenter isOpen={isOpen} onClose={() => { setIsOpen(false); fetchCount(); }} />
    </>
  );
}

import { useState, useEffect } from 'react';
import { dashboardAPI, requestsAPI } from '@/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  DollarSign, Calendar, Star, Clock, TrendingUp,
  CheckCircle, ArrowRight, User, PawPrint, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-violet-100 text-violet-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-slate-200 text-slate-600',
};

export default function DashboardPage() {
  const { provider } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [todayBookings, setTodayBookings] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, todayRes, reqRes] = await Promise.all([
          dashboardAPI.stats(),
          dashboardAPI.todaySchedule(),
          requestsAPI.list({ status: 'pending' }),
        ]);
        setStats(statsRes.data);
        setTodayBookings(todayRes.data);
        setPendingRequests(reqRes.data.slice(0, 5));
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div className="space-y-6">
      <div><div className="h-8 w-64 bg-slate-200 rounded animate-pulse" /><div className="h-4 w-48 bg-slate-200 rounded animate-pulse mt-2" /></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-200 rounded-xl animate-pulse" />)}</div>
    </div>
  );

  const weekData = (stats?.week_revenue || []).map((d) => ({
    ...d,
    label: format(parseISO(d.date), 'EEE'),
  }));

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight" data-testid="dashboard-title">
            Good {getGreeting()}, {provider?.business_name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Here's what's happening with your business today</p>
        </div>
        <button onClick={() => navigate('/dashboard/appointments')} className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm">
          <Calendar className="w-4 h-4" /> View Calendar
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="metrics-grid">
        <MetricCard icon={DollarSign} label="Today's Revenue" value={`\u20AC${(stats?.today_revenue || 0).toFixed(2)}`} iconBg="bg-emerald-100 text-emerald-600" />
        <MetricCard icon={Calendar} label="Today's Bookings" value={`${stats?.today_completed || 0}/${stats?.today_bookings || 0}`} sub="completed" iconBg="bg-blue-100 text-blue-600" />
        <MetricCard icon={Star} label="Average Rating" value={(stats?.average_rating || 0).toFixed(1)} sub={`${stats?.total_reviews || 0} reviews`} iconBg="bg-amber-100 text-amber-600" />
        <MetricCard icon={Clock} label="Pending Requests" value={stats?.pending_requests || 0} sub="awaiting response" iconBg="bg-orange-100 text-orange-600" />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="text-base font-semibold text-slate-900">Today's Schedule</h2>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">{todayBookings.length} bookings</span>
          </div>
          {todayBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-500">No bookings today</p>
              <p className="text-xs text-slate-400 mt-1">Your schedule is clear</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {todayBookings.map((booking) => (
                <BookingRow key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="text-base font-semibold text-slate-900">Pending Requests</h2>
            <button onClick={() => navigate('/dashboard/requests')} className="text-xs font-medium text-provider-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {pendingRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-500">All caught up!</p>
              <p className="text-xs text-slate-400 mt-1">No pending requests</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingRequests.map((req) => (
                <RequestRow key={req.id} request={req} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 py-4 border-b"><h2 className="text-base font-semibold text-slate-900">This Week's Revenue</h2></div>
        <div className="p-5">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `\u20AC${v}`} />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (<div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs shadow-lg"><p className="font-semibold">\u20AC{d.revenue.toFixed(2)}</p><p className="text-slate-400">{d.bookings} bookings</p></div>);
                }} />
                <Bar dataKey="revenue" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, iconBg }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", iconBg)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

function BookingRow({ booking }) {
  const timeStr = booking.start_time ? format(parseISO(booking.start_time), 'HH:mm') : '--:--';
  return (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
      <div className="text-sm font-mono text-slate-500 w-12 flex-shrink-0">{timeStr}</div>
      <div className={cn("w-1 h-8 rounded-full flex-shrink-0", {
        'bg-blue-500': booking.status === 'confirmed',
        'bg-violet-500': booking.status === 'in_progress',
        'bg-emerald-500': booking.status === 'completed',
        'bg-amber-500': booking.status === 'pending',
        'bg-red-500': booking.status === 'cancelled',
      })} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{booking.service_name || 'Service'}</p>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <User className="w-3 h-3" /><span className="truncate">{booking.customer_name}</span>
          <span className="text-slate-300">|</span>
          <PawPrint className="w-3 h-3" /><span>{booking.pet_name}</span>
        </div>
      </div>
      <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", statusColors[booking.status] || 'bg-slate-100')}>
        {booking.status?.replace('_', ' ')}
      </span>
    </div>
  );
}

function RequestRow({ request }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
        <User className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{request.customer_name}</p>
        <p className="text-xs text-slate-500 truncate">{request.service_name || 'Service'} \u00b7 {request.preferred_date}</p>
      </div>
      {request.is_urgent && <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">Urgent</span>}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

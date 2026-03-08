import { useState } from 'react';
import {
  DollarSign, Calendar, Star, Clock, TrendingUp,
  CheckCircle, ArrowRight, User, PawPrint,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { mockStats, mockTodayBookings, mockPendingRequests } from '@/lib/mock-data';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-violet-100 text-violet-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-slate-200 text-slate-600',
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function MetricCard({ icon: Icon, label, value, sub, iconBg }: { icon: any; label: string; value: string | number; sub?: string; iconBg: string }) {
  return (
    <div className="bg-card rounded-xl border p-4">
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", iconBg)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="mt-3">
        <p className="text-2xl font-heading font-bold">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-foreground/70">{sub}</p>}
      </div>
    </div>
  );
}

function BookingRow({ booking }: { booking: any }) {
  const timeStr = booking.start_time ? new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
  return (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors">
      <div className="text-sm font-mono text-muted-foreground w-12 flex-shrink-0">{timeStr}</div>
      <div className={cn("w-1 h-8 rounded-full flex-shrink-0", {
        'bg-blue-500': booking.status === 'confirmed',
        'bg-violet-500': booking.status === 'in_progress',
        'bg-emerald-500': booking.status === 'completed',
        'bg-amber-500': booking.status === 'pending',
        'bg-red-500': booking.status === 'cancelled',
      })} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{booking.service_name || 'Service'}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <User className="w-3 h-3" /><span className="truncate">{booking.customer_name}</span>
          <span className="text-muted-foreground/40">|</span>
          <PawPrint className="w-3 h-3" /><span>{booking.pet_name}</span>
        </div>
      </div>
      <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", statusColors[booking.status] || 'bg-muted')}>
        {booking.status?.replace('_', ' ')}
      </span>
    </div>
  );
}

function RequestRow({ request }: { request: any }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors">
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0">
        <User className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{request.customer_name}</p>
        <p className="text-xs text-muted-foreground truncate">{request.service_name || 'Service'} · {request.preferred_date}</p>
      </div>
      {request.is_urgent && <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">Urgent</span>}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats] = useState(mockStats);
  const [todayBookings] = useState(mockTodayBookings);
  const [pendingRequests] = useState(mockPendingRequests);

  const weekData = stats.week_revenue;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">
            Good {getGreeting()}, there 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Here's what's happening with your business today</p>
        </div>
        <button onClick={() => navigate('/appointments')} className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-card border rounded-lg text-sm font-medium hover:bg-muted/50 shadow-sm">
          <Calendar className="w-4 h-4" /> View Calendar
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={DollarSign} label="Today's Revenue" value={`$${stats.today_revenue.toFixed(2)}`} iconBg="bg-emerald-100 text-emerald-600" />
        <MetricCard icon={Calendar} label="Today's Bookings" value={`${stats.today_completed}/${stats.today_bookings}`} sub="completed" iconBg="bg-blue-100 text-blue-600" />
        <MetricCard icon={Star} label="Average Rating" value={stats.average_rating.toFixed(1)} sub={`${stats.total_reviews} reviews`} iconBg="bg-amber-100 text-amber-600" />
        <MetricCard icon={Clock} label="Pending Requests" value={stats.pending_requests} sub="awaiting response" iconBg="bg-orange-100 text-orange-600" />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-card rounded-xl border">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="text-base font-heading font-semibold">Today's Schedule</h2>
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">{todayBookings.length} bookings</span>
          </div>
          {todayBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No bookings today</p>
            </div>
          ) : (
            <div className="divide-y">
              {todayBookings.map((booking) => (
                <BookingRow key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-card rounded-xl border">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="text-base font-heading font-semibold">Pending Requests</h2>
            <button onClick={() => navigate('/requests')} className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {pendingRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">All caught up!</p>
            </div>
          ) : (
            <div className="divide-y">
              {pendingRequests.map((req) => (
                <RequestRow key={req.id} request={req} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-card rounded-xl border">
        <div className="px-5 py-4 border-b"><h2 className="text-base font-heading font-semibold">This Week's Revenue</h2></div>
        <div className="p-5">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (<div className="bg-foreground text-background px-3 py-2 rounded-lg text-xs shadow-lg"><p className="font-semibold">${d.revenue.toFixed(2)}</p><p className="opacity-70">{d.bookings} bookings</p></div>);
                }} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

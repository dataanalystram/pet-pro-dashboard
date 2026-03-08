import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Calendar, Users, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { format, parseISO, subDays, eachDayOfInterval } from 'date-fns';
import { useBookings, useCustomers } from '@/hooks/use-supabase-data';

const COLORS = ['#2563EB', '#059669', '#EA580C', '#8B5CF6', '#F59E0B', '#EF4444'];

function KpiCard({ icon: Icon, label, value, bg }: { icon: any; label: string; value: string | number; bg: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", bg)}><Icon className="w-5 h-5" /></div>
        <div><p className="text-xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const { data: bookings = [], isLoading: loadingBookings } = useBookings();
  const { data: customers = [], isLoading: loadingCustomers } = useCustomers();

  const analytics = useMemo(() => {
    const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.total_price), 0);
    const totalBookings = bookings.length;
    const totalCustomers = customers.length;
    const avgBookingValue = totalBookings ? Math.round(totalRevenue / totalBookings) : 0;

    // Daily revenue (last 30 days)
    const now = new Date();
    const days30 = eachDayOfInterval({ start: subDays(now, 29), end: now });
    const dailyRevenue = days30.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayBookings = bookings.filter(b => b.booking_date === dateStr);
      return { date: dateStr, label: format(day, 'MMM d'), revenue: dayBookings.reduce((s, b) => s + Number(b.total_price), 0), bookings: dayBookings.length };
    });

    // Status distribution
    const statusDist: Record<string, number> = {};
    bookings.forEach(b => { statusDist[b.status] = (statusDist[b.status] || 0) + 1; });
    const statusData = Object.entries(statusDist).filter(([_, v]) => v > 0).map(([k, v]) => ({ name: k.replace('_', ' '), value: v }));

    // Day of week
    const dayOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
      const count = bookings.filter(b => { try { return new Date(b.booking_date).getDay() === (i === 6 ? 0 : i + 1); } catch { return false; } }).length;
      return { day, bookings: count };
    });

    // Top services
    const serviceMap: Record<string, { revenue: number; bookings: number }> = {};
    bookings.forEach(b => {
      if (!serviceMap[b.service_name]) serviceMap[b.service_name] = { revenue: 0, bookings: 0 };
      serviceMap[b.service_name].revenue += Number(b.total_price);
      serviceMap[b.service_name].bookings += 1;
    });
    const topServices = Object.entries(serviceMap).map(([name, d]) => ({ name, ...d })).sort((a, b) => b.revenue - a.revenue);

    // Top customers
    const custMap: Record<string, { name: string; email: string; revenue: number; bookings: number }> = {};
    bookings.forEach(b => {
      const key = b.customer_email || b.customer_name;
      if (!custMap[key]) custMap[key] = { name: b.customer_name, email: b.customer_email || '', revenue: 0, bookings: 0 };
      custMap[key].revenue += Number(b.total_price);
      custMap[key].bookings += 1;
    });
    const topCustomers = Object.values(custMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    return { totalRevenue, totalBookings, totalCustomers, avgBookingValue, dailyRevenue, statusData, dayOfWeek, topServices, topCustomers };
  }, [bookings, customers]);

  if (loadingBookings || loadingCustomers) return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading analytics...</div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-heading font-bold">Analytics</h1><p className="text-sm text-muted-foreground">Business performance overview</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={DollarSign} label="Total Revenue" value={`$${analytics.totalRevenue.toLocaleString()}`} bg="bg-emerald-100 text-emerald-600" />
        <KpiCard icon={Calendar} label="Total Bookings" value={analytics.totalBookings} bg="bg-blue-100 text-blue-600" />
        <KpiCard icon={Users} label="Unique Customers" value={analytics.totalCustomers} bg="bg-violet-100 text-violet-600" />
        <KpiCard icon={TrendingUp} label="Avg Booking Value" value={`$${analytics.avgBookingValue}`} bg="bg-amber-100 text-amber-600" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base font-heading">Revenue Over Time</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.dailyRevenue} barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip content={({ active, payload }) => active && payload?.length ? (
                    <div className="bg-foreground text-background px-3 py-2 rounded-lg text-xs shadow-lg"><p className="font-semibold">${payload[0].value}</p></div>
                  ) : null} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base font-heading">Booking Volume</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={({ active, payload }) => active && payload?.length ? (
                    <div className="bg-foreground text-background px-3 py-2 rounded-lg text-xs shadow-lg"><p className="font-semibold">{payload[0].value} bookings</p></div>
                  ) : null} />
                  <Line type="monotone" dataKey="bookings" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base font-heading">Booking Status</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={analytics.statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {analytics.statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base font-heading">Bookings by Day</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.dayOfWeek} barSize={30}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Bar dataKey="bookings" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base font-heading">Top Services</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topServices.slice(0, 6).map((s, i) => (
                <div key={s.name} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.name}</p>
                    <div className="h-1.5 bg-muted rounded-full mt-1">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (s.revenue / (analytics.topServices[0]?.revenue || 1)) * 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-medium">${s.revenue}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base font-heading">Top Customers by Revenue</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-2">#</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-2">Customer</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-2">Revenue</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-2">Bookings</th>
            </tr></thead>
            <tbody className="divide-y">
              {analytics.topCustomers.map((c, i) => (
                <tr key={c.email} className="hover:bg-muted/50">
                  <td className="px-5 py-2.5 text-sm text-muted-foreground">{i + 1}</td>
                  <td className="px-5 py-2.5"><p className="text-sm font-medium">{c.name}</p><p className="text-xs text-muted-foreground">{c.email}</p></td>
                  <td className="px-5 py-2.5 text-sm font-semibold">${c.revenue}</td>
                  <td className="px-5 py-2.5 text-sm">{c.bookings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

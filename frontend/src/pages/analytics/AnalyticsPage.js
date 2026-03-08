import { useState, useEffect } from 'react';
import { analyticsAPI } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, Calendar, Users, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';

const PERIODS = [
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
];

const COLORS = ['#2563EB', '#059669', '#EA580C', '#8B5CF6', '#F59E0B', '#EF4444'];

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    analyticsAPI.get(period).then(({ data: d }) => {
      setData(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [period]);

  if (loading) return (
    <div className="space-y-4" data-testid="analytics-skeleton">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );

  if (!data) return null;

  const revenueData = (data.daily_revenue || []).map((d) => ({
    ...d, label: format(parseISO(d.date), 'MMM d'),
  }));

  const bookingData = (data.daily_bookings || []).map((d) => ({
    ...d, label: format(parseISO(d.date), 'MMM d'),
  }));

  const statusData = Object.entries(data.status_distribution || {})
    .filter(([_, v]) => v > 0)
    .map(([k, v]) => ({ name: k.replace('_', ' '), value: v }));

  return (
    <div className="space-y-6" data-testid="analytics-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Analytics</h1>
          <p className="text-sm text-slate-500">Business performance overview</p>
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
          {PERIODS.map((p) => (
            <Button
              key={p.key}
              variant={period === p.key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriod(p.key)}
              className={cn(period === p.key && "bg-white shadow-sm text-slate-900")}
              data-testid={`period-${p.key}`}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="analytics-kpis">
        <KpiCard icon={DollarSign} label="Total Revenue" value={`€${(data.total_revenue || 0).toFixed(0)}`} bg="bg-emerald-100 text-emerald-600" />
        <KpiCard icon={Calendar} label="Total Bookings" value={data.total_bookings || 0} bg="bg-blue-100 text-blue-600" />
        <KpiCard icon={Users} label="Unique Customers" value={data.total_customers || 0} bg="bg-violet-100 text-violet-600" />
        <KpiCard icon={TrendingUp} label="Avg Booking Value" value={`€${(data.avg_booking_value || 0).toFixed(0)}`} bg="bg-amber-100 text-amber-600" />
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue chart */}
        <Card className="border-slate-200" data-testid="revenue-chart">
          <CardHeader className="pb-2"><CardTitle className="text-base">Revenue Over Time</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} barSize={period === '7d' ? 40 : 12}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={period === '7d' ? 0 : 'preserveStartEnd'} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${v}`} />
                  <Tooltip content={({ active, payload }) => active && payload?.length ? (
                    <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs shadow-lg">
                      <p className="font-semibold">€{payload[0].value.toFixed(2)}</p>
                      <p className="text-slate-400">{payload[0].payload.date}</p>
                    </div>
                  ) : null} />
                  <Bar dataKey="revenue" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bookings chart */}
        <Card className="border-slate-200" data-testid="bookings-chart">
          <CardHeader className="pb-2"><CardTitle className="text-base">Booking Volume</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bookingData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={({ active, payload }) => active && payload?.length ? (
                    <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs shadow-lg">
                      <p className="font-semibold">{payload[0].value} bookings</p>
                    </div>
                  ) : null} />
                  <Line type="monotone" dataKey="bookings" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Status distribution */}
        <Card className="border-slate-200" data-testid="status-chart">
          <CardHeader className="pb-2"><CardTitle className="text-base">Booking Status</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Day of week */}
        <Card className="border-slate-200" data-testid="dow-chart">
          <CardHeader className="pb-2"><CardTitle className="text-base">Bookings by Day</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.day_of_week || []} barSize={30}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Bar dataKey="bookings" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top services */}
        <Card className="border-slate-200" data-testid="top-services">
          <CardHeader className="pb-2"><CardTitle className="text-base">Top Services</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data.top_services || []).slice(0, 6).map((s, i) => (
                <div key={s.name} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{s.name}</p>
                    <div className="h-1.5 bg-slate-100 rounded-full mt-1">
                      <div className="h-full bg-provider-primary rounded-full" style={{ width: `${Math.min(100, (s.revenue / (data.top_services[0]?.revenue || 1)) * 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-600">€{s.revenue.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top customers */}
      <Card className="border-slate-200" data-testid="top-customers">
        <CardHeader className="pb-2"><CardTitle className="text-base">Top Customers by Revenue</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-2">#</th>
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-2">Customer</th>
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-2">Revenue</th>
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-2">Bookings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data.top_customers || []).map((c, i) => (
                <tr key={c.email} className="hover:bg-slate-50">
                  <td className="px-5 py-2.5 text-sm text-slate-400">{i + 1}</td>
                  <td className="px-5 py-2.5">
                    <p className="text-sm font-medium text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.email}</p>
                  </td>
                  <td className="px-5 py-2.5 text-sm font-semibold text-slate-900">€{c.revenue.toFixed(0)}</td>
                  <td className="px-5 py-2.5 text-sm text-slate-600">{c.bookings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, bg }) {
  return (
    <Card className="border-slate-200">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", bg)}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xl font-bold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

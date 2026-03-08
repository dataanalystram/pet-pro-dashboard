import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Calendar, Users, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { mockAnalytics } from '@/lib/mock-data';

const COLORS = ['#2563EB', '#059669', '#EA580C', '#8B5CF6', '#F59E0B', '#EF4444'];

function KpiCard({ icon: Icon, label, value, bg }: { icon: any; label: string; value: string | number; bg: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", bg)}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [data] = useState(mockAnalytics);
  const [period, setPeriod] = useState('30d');

  const PERIODS = [
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: '90d', label: '90 Days' },
  ];

  const revenueData = data.daily_revenue.map((d) => ({
    ...d, label: format(parseISO(d.date), 'MMM d'),
  }));

  const bookingData = data.daily_bookings.map((d) => ({
    ...d, label: format(parseISO(d.date), 'MMM d'),
  }));

  const statusData = Object.entries(data.status_distribution)
    .filter(([_, v]) => v > 0)
    .map(([k, v]) => ({ name: k.replace('_', ' '), value: v }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">Business performance overview</p>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-0.5">
          {PERIODS.map((p) => (
            <Button key={p.key} variant={period === p.key ? 'default' : 'ghost'} size="sm" onClick={() => setPeriod(p.key)}
              className={cn(period === p.key && "bg-card shadow-sm")}>{p.label}</Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={DollarSign} label="Total Revenue" value={`$${data.total_revenue.toLocaleString()}`} bg="bg-emerald-100 text-emerald-600" />
        <KpiCard icon={Calendar} label="Total Bookings" value={data.total_bookings} bg="bg-blue-100 text-blue-600" />
        <KpiCard icon={Users} label="Unique Customers" value={data.total_customers} bg="bg-violet-100 text-violet-600" />
        <KpiCard icon={TrendingUp} label="Avg Booking Value" value={`$${data.avg_booking_value}`} bg="bg-amber-100 text-amber-600" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base font-heading">Revenue Over Time</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip content={({ active, payload }) => active && payload?.length ? (
                    <div className="bg-foreground text-background px-3 py-2 rounded-lg text-xs shadow-lg">
                      <p className="font-semibold">${payload[0].value}</p>
                    </div>
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
                <LineChart data={bookingData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={({ active, payload }) => active && payload?.length ? (
                    <div className="bg-foreground text-background px-3 py-2 rounded-lg text-xs shadow-lg">
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

      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base font-heading">Booking Status</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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
                <BarChart data={data.day_of_week} barSize={30}>
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
              {data.top_services.slice(0, 6).map((s, i) => (
                <div key={s.name} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.name}</p>
                    <div className="h-1.5 bg-muted rounded-full mt-1">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (s.revenue / (data.top_services[0]?.revenue || 1)) * 100)}%` }} />
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
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-2">#</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-2">Customer</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-2">Revenue</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-2">Bookings</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.top_customers.map((c, i) => (
                <tr key={c.email} className="hover:bg-muted/50">
                  <td className="px-5 py-2.5 text-sm text-muted-foreground">{i + 1}</td>
                  <td className="px-5 py-2.5">
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.email}</p>
                  </td>
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

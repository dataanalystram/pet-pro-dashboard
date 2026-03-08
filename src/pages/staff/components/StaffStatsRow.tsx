import { Card, CardContent } from '@/components/ui/card';
import { Users, UserCheck, Star, Activity } from 'lucide-react';

interface Props {
  staff: any[];
  bookings: any[];
}

export default function StaffStatsRow({ staff, bookings }: Props) {
  const activeStaff = staff.filter(s => s.status === 'active');
  const avgRating = staff.length > 0
    ? (staff.reduce((sum, s) => sum + Number(s.average_rating), 0) / staff.length).toFixed(1)
    : '0.0';

  const today = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter(b => b.booking_date === today && b.status !== 'cancelled').length;
  const totalCapacity = activeStaff.reduce((sum, s) => sum + s.max_daily_bookings, 0);
  const utilization = totalCapacity > 0 ? Math.round((todayBookings / totalCapacity) * 100) : 0;

  const stats = [
    { label: 'Total Staff', value: staff.length, icon: Users, color: 'text-primary' },
    { label: 'Active', value: activeStaff.length, icon: UserCheck, color: 'text-emerald-500' },
    { label: 'Team Rating', value: avgRating, icon: Star, color: 'text-amber-500' },
    { label: "Today's Load", value: `${utilization}%`, icon: Activity, color: utilization >= 80 ? 'text-destructive' : utilization >= 50 ? 'text-amber-500' : 'text-emerald-500' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map(s => (
        <Card key={s.label}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

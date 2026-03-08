import { Card, CardContent } from '@/components/ui/card';
import { Calendar, CheckCircle, Clock, DollarSign, XCircle, Footprints } from 'lucide-react';

interface StatsProps {
  todayBookings: any[];
}

export default function AppointmentStatsRow({ todayBookings }: StatsProps) {
  const total = todayBookings.length;
  const completed = todayBookings.filter(b => b.status === 'completed').length;
  const inProgress = todayBookings.filter(b => b.status === 'in_progress').length;
  const noShows = todayBookings.filter(b => b.no_show).length;
  const walkIns = todayBookings.filter(b => b.source === 'walk_in').length;
  const revenue = todayBookings
    .filter(b => ['completed', 'in_progress'].includes(b.status))
    .reduce((sum: number, b: any) => sum + Number(b.total_price || 0), 0);

  const stats = [
    { label: "Today's Bookings", value: total, icon: Calendar, color: 'text-primary' },
    { label: 'Completed', value: completed, icon: CheckCircle, color: 'text-emerald-600' },
    { label: 'In Progress', value: inProgress, icon: Clock, color: 'text-violet-600' },
    { label: 'Revenue', value: `$${revenue.toFixed(0)}`, icon: DollarSign, color: 'text-amber-600' },
    { label: 'No-Shows', value: noShows, icon: XCircle, color: 'text-red-600' },
    { label: 'Walk-ins', value: walkIns, icon: Footprints, color: 'text-blue-600' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map(s => (
        <Card key={s.label}>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div>
              <p className="text-lg font-bold leading-none">{s.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

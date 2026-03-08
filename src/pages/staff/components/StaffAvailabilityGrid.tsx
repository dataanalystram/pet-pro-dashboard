import { cn } from '@/lib/utils';
import { parseISO, isWithinInterval } from 'date-fns';

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

interface Props {
  staff: any[];
  bookings: any[];
  timeOff?: any[];
}

function getWeekDates() {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

export default function StaffAvailabilityGrid({ staff, bookings, timeOff = [] }: Props) {
  const weekDates = getWeekDates();

  const isOnLeave = (staffId: string, dateStr: string) => {
    return timeOff.some((t: any) => {
      if (t.staff_id !== staffId || t.status !== 'approved') return false;
      try {
        return isWithinInterval(parseISO(dateStr), { start: parseISO(t.start_date), end: parseISO(t.end_date) });
      } catch { return false; }
    });
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Header */}
        <div className="grid gap-1" style={{ gridTemplateColumns: `160px repeat(7, 1fr)` }}>
          <div className="p-2 text-xs font-medium text-muted-foreground">Staff</div>
          {dayLabels.map((d, i) => (
            <div key={d} className="p-2 text-center">
              <p className="text-xs font-medium">{d}</p>
              <p className="text-[10px] text-muted-foreground">{weekDates[i]?.slice(5)}</p>
            </div>
          ))}
        </div>

        {/* Rows */}
        {staff.map(s => {
          const wh = s.working_hours || {};
          return (
            <div key={s.id} className="grid gap-1 mb-1" style={{ gridTemplateColumns: `160px repeat(7, 1fr)` }}>
              <div className="p-2 flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full flex-shrink-0",
                  s.status === 'active' ? 'bg-emerald-500' : s.status === 'on_leave' ? 'bg-amber-500' : 'bg-muted-foreground'
                )} />
                <span className="text-sm font-medium truncate">{s.full_name}</span>
              </div>
              {dayKeys.map((day, i) => {
                const dayData = wh[day];
                const isOff = dayData?.off !== false || !dayData;
                const onLeave = isOnLeave(s.id, weekDates[i]);
                const dayBookings = bookings.filter(b => b.booking_date === weekDates[i] && b.status !== 'cancelled').length;
                const load = isOff ? -1 : dayBookings / s.max_daily_bookings;

                return (
                  <div
                    key={day}
                    className={cn(
                      "rounded-lg p-2 text-center text-xs transition-colors relative",
                      onLeave ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' :
                      isOff ? 'bg-muted/50 text-muted-foreground' :
                      load >= 0.8 ? 'bg-destructive/15 text-destructive' :
                      load >= 0.5 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    )}
                  >
                    {onLeave ? '🏖️' : isOff ? 'Off' : `${dayBookings}/${s.max_daily_bookings}`}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Legend */}
        <div className="flex gap-4 mt-3 pt-3 border-t flex-wrap">
          {[
            { label: 'Available', cls: 'bg-emerald-500' },
            { label: 'Moderate', cls: 'bg-amber-500' },
            { label: 'Busy', cls: 'bg-destructive' },
            { label: 'Off', cls: 'bg-muted-foreground' },
            { label: 'On Leave', cls: 'bg-violet-500' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className={cn("w-2.5 h-2.5 rounded-sm", l.cls)} />
              <span className="text-[10px] text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

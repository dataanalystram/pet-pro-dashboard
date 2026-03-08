import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Calendar, Briefcase, Clock, Pencil, UserX, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUpdate } from '@/hooks/use-supabase-data';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500', on_leave: 'bg-amber-500', inactive: 'bg-muted-foreground',
};

const dayLabels = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const dayShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface Props {
  staff: any;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  bookings: any[];
}

export default function StaffDetailPanel({ staff: s, open, onClose, onEdit, bookings }: Props) {
  const updateStaff = useUpdate('staff');

  if (!s) return null;

  const today = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter(b => b.booking_date === today && b.status !== 'cancelled');
  const workingHours = s.working_hours || {};

  const toggleStatus = () => {
    const newStatus = s.status === 'active' ? 'on_leave' : 'active';
    updateStaff.mutate({ id: s.id, status: newStatus }, {
      onSuccess: () => toast.success(`Status changed to ${newStatus.replace('_', ' ')}`),
    });
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-3">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center font-bold text-lg">
                {s.avatar_url ? <img src={s.avatar_url} className="w-full h-full rounded-full object-cover" /> : s.full_name?.[0]?.toUpperCase()}
              </div>
              <div className={cn("absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-background", statusColors[s.status] || statusColors.active)} />
            </div>
            <div>
              <p className="text-base font-semibold">{s.full_name}</p>
              <p className="text-xs text-muted-foreground font-normal">{s.title || s.role}</p>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5">
          {/* Quick actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}><Pencil className="w-3.5 h-3.5 mr-1" />Edit</Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={toggleStatus}>
              {s.status === 'active'
                ? <><UserX className="w-3.5 h-3.5 mr-1" />Set On Leave</>
                : <><UserCheck className="w-3.5 h-3.5 mr-1" />Set Active</>
              }
            </Button>
          </div>

          {/* Performance */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Performance</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center bg-muted rounded-xl p-3">
                <Star className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                <p className="text-lg font-bold">{Number(s.average_rating).toFixed(1)}</p>
                <p className="text-[10px] text-muted-foreground">Rating</p>
              </div>
              <div className="text-center bg-muted rounded-xl p-3">
                <Calendar className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold">{s.total_services_completed}</p>
                <p className="text-[10px] text-muted-foreground">Services</p>
              </div>
              <div className="text-center bg-muted rounded-xl p-3">
                <Briefcase className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                <p className="text-lg font-bold">{s.hourly_rate ? `$${Number(s.hourly_rate)}` : '-'}</p>
                <p className="text-[10px] text-muted-foreground">/hour</p>
              </div>
            </div>
          </div>

          {/* Today's load */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Today's Schedule</p>
            <div className="bg-muted rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{todayBookings.length} / {s.max_daily_bookings} bookings</span>
                <Badge variant="secondary" className="text-[10px]">
                  {Math.round((todayBookings.length / s.max_daily_bookings) * 100)}% capacity
                </Badge>
              </div>
              <div className="w-full bg-background rounded-full h-2">
                <div
                  className={cn("h-2 rounded-full transition-all",
                    todayBookings.length / s.max_daily_bookings >= 0.8 ? 'bg-destructive'
                    : todayBookings.length / s.max_daily_bookings >= 0.5 ? 'bg-amber-500'
                    : 'bg-emerald-500'
                  )}
                  style={{ width: `${Math.min((todayBookings.length / s.max_daily_bookings) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          {s.bio && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">About</p>
              <p className="text-sm text-foreground">{s.bio}</p>
            </div>
          )}

          {/* Specializations */}
          {s.specializations?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Specializations</p>
              <div className="flex flex-wrap gap-1.5">
                {s.specializations.map((sp: string) => (
                  <Badge key={sp} variant="secondary" className="text-xs capitalize">{sp}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Working Hours */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Working Hours</p>
            <div className="space-y-1.5">
              {dayLabels.map((day, i) => {
                const d = workingHours[day];
                const isOff = d?.off !== false;
                return (
                  <div key={day} className="flex items-center justify-between text-sm">
                    <span className="font-medium w-10">{dayShort[i]}</span>
                    {isOff || !d ? (
                      <span className="text-muted-foreground text-xs">Off</span>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {d.start} – {d.end}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Contact</p>
            <div className="space-y-1 text-sm">
              <p>{s.email}</p>
              {s.phone && <p className="text-muted-foreground">{s.phone}</p>}
              {s.hire_date && <p className="text-xs text-muted-foreground">Hired: {new Date(s.hire_date).toLocaleDateString()}</p>}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

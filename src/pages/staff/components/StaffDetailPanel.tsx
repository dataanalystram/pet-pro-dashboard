import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Star, Calendar, Briefcase, Clock, Pencil, UserX, UserCheck, CalendarOff, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUpdate, useServices } from '@/hooks/use-supabase-data';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

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
  serviceStaff?: any[];
  timeOff?: any[];
}

export default function StaffDetailPanel({ staff: s, open, onClose, onEdit, bookings, serviceStaff = [], timeOff = [] }: Props) {
  const updateStaff = useUpdate('staff');
  const { data: services = [] } = useServices();
  const [editingRoster, setEditingRoster] = useState(false);
  const [roster, setRoster] = useState<any>({});

  useEffect(() => {
    if (s?.working_hours) {
      setRoster(JSON.parse(JSON.stringify(s.working_hours)));
    }
  }, [s?.working_hours, s?.id]);

  if (!s) return null;

  const today = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter(b => b.booking_date === today && b.status !== 'cancelled');
  const assignedBookings = bookings.filter(b => b.assigned_staff_id === s.id && b.booking_date >= today && b.status !== 'cancelled');
  const workingHours = s.working_hours || {};

  // Assigned services
  const assignedServiceIds = serviceStaff.filter((ss: any) => ss.staff_id === s.id).map((ss: any) => ss.service_id);
  const assignedServices = services.filter((svc: any) => assignedServiceIds.includes(svc.id));

  // Upcoming time off
  const staffTimeOff = timeOff.filter((t: any) => t.staff_id === s.id && t.end_date >= today);

  const toggleStatus = () => {
    const newStatus = s.status === 'active' ? 'on_leave' : 'active';
    updateStaff.mutate({ id: s.id, status: newStatus }, {
      onSuccess: () => toast.success(`Status changed to ${newStatus.replace('_', ' ')}`),
    });
  };

  const updateRosterDay = (day: string, field: string, value: any) => {
    setRoster((prev: any) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const saveRoster = () => {
    updateStaff.mutate({ id: s.id, working_hours: roster }, {
      onSuccess: () => {
        toast.success('Working hours updated');
        setEditingRoster(false);
      },
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
                <p className="text-[10px] text-muted-foreground">Completed</p>
              </div>
              <div className="text-center bg-muted rounded-xl p-3">
                <Briefcase className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                <p className="text-lg font-bold">{assignedServices.length}</p>
                <p className="text-[10px] text-muted-foreground">Services</p>
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

          <Separator />

          {/* Assigned Services */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Assigned Services ({assignedServices.length})</p>
            {assignedServices.length > 0 ? (
              <div className="space-y-1.5">
                {assignedServices.map((svc: any) => (
                  <div key={svc.id} className="flex items-center justify-between bg-muted rounded-lg px-3 py-2">
                    <span className="text-sm font-medium">{svc.name}</span>
                    <Badge variant="secondary" className="text-[10px] capitalize">{svc.category}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not assigned to any services yet</p>
            )}
          </div>

          {/* Upcoming Bookings */}
          {assignedBookings.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Upcoming Bookings ({assignedBookings.length})</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {assignedBookings.slice(0, 5).map((b: any) => (
                  <div key={b.id} className="flex items-center justify-between bg-muted rounded-lg px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium">{b.service_name}</p>
                      <p className="text-xs text-muted-foreground">{b.customer_name}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{b.booking_date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Time Off */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
              <CalendarOff className="w-3 h-3 inline mr-1" />Time Off
            </p>
            {staffTimeOff.length > 0 ? (
              <div className="space-y-1.5">
                {staffTimeOff.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between bg-muted rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-medium capitalize">{t.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(t.start_date), 'MMM d')} — {format(parseISO(t.end_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge variant="secondary" className={cn("text-[10px]",
                      t.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : t.status === 'pending' ? 'bg-amber-100 text-amber-700' : ''
                    )}>{t.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming time off</p>
            )}
          </div>

          <Separator />

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

          {/* Working Hours - Editable */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Working Hours</p>
              {editingRoster ? (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => { setRoster(workingHours); setEditingRoster(false); }}>Cancel</Button>
                  <Button size="sm" className="h-6 text-xs" onClick={saveRoster}><Save className="w-3 h-3 mr-1" />Save</Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setEditingRoster(true)}><Pencil className="w-3 h-3 mr-1" />Edit</Button>
              )}
            </div>
            <div className="space-y-2">
              {dayLabels.map((day, i) => {
                const d = editingRoster ? roster[day] : workingHours[day];
                const isOff = !d || d.off !== false;
                return (
                  <div key={day} className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium w-10">{dayShort[i]}</span>
                    {editingRoster ? (
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <Label className="text-xs text-muted-foreground">Off</Label>
                        <Switch
                          checked={isOff}
                          onCheckedChange={(v) => updateRosterDay(day, 'off', v)}
                          className="scale-75"
                        />
                        {!isOff && (
                          <>
                            <Input
                              type="time"
                              value={d?.start || '09:00'}
                              onChange={(e) => updateRosterDay(day, 'start', e.target.value)}
                              className="h-7 w-20 text-xs"
                            />
                            <span className="text-muted-foreground">–</span>
                            <Input
                              type="time"
                              value={d?.end || '17:00'}
                              onChange={(e) => updateRosterDay(day, 'end', e.target.value)}
                              className="h-7 w-20 text-xs"
                            />
                          </>
                        )}
                      </div>
                    ) : (
                      isOff ? (
                        <span className="text-muted-foreground text-xs">Off</span>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {d?.start || '09:00'} – {d?.end || '17:00'}
                        </div>
                      )
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

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
  User, PawPrint, Calendar as CalIcon, Clock, DollarSign,
  Users, LogIn, LogOut, FileText, CreditCard, CalendarIcon, CheckCircle,
  Repeat, Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-violet-100 text-violet-700 border-violet-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

const sourceLabels: Record<string, { label: string; class: string }> = {
  online: { label: 'Online', class: 'bg-blue-50 text-blue-600' },
  walk_in: { label: 'Walk-in', class: 'bg-orange-50 text-orange-600' },
  phone: { label: 'Phone', class: 'bg-purple-50 text-purple-600' },
};

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

interface BookingDetailPanelProps {
  booking: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: any[];
  onUpdate: (id: string, data: Record<string, any>) => void;
  onUpdateStatus: (id: string, status: string, extras?: Record<string, any>) => void;
}

export default function BookingDetailPanel({ booking, open, onOpenChange, staff, onUpdate, onUpdateStatus }: BookingDetailPanelProps) {
  const [notes, setNotes] = useState(booking?.notes || '');
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>();
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [showReschedule, setShowReschedule] = useState(false);
  const [notificationLog, setNotificationLog] = useState<any[]>([]);

  useEffect(() => {
    if (booking?.id) {
      setNotes(booking.notes || '');
      // Fetch notification log
      supabase.from('booking_notifications').select('*').eq('booking_id', booking.id).order('created_at', { ascending: false })
        .then(({ data }) => setNotificationLog(data || []));
    }
  }, [booking?.id, booking?.notes]);

  if (!booking) return null;

  const b = booking;
  const source = sourceLabels[b.source] || sourceLabels.online;
  const pets: any[] = Array.isArray(b.pets) && b.pets.length > 0 ? b.pets : [];
  const formatTime = (t: string | null) => {
    if (!t) return '—';
    try { return format(new Date(t), 'HH:mm'); } catch { return '—'; }
  };

  const handleSaveNotes = () => onUpdate(b.id, { notes });

  const handleReschedule = () => {
    if (!rescheduleDate || !rescheduleTime) return;
    const dateStr = format(rescheduleDate, 'yyyy-MM-dd');
    const timeISO = new Date(`${dateStr}T${rescheduleTime}:00`).toISOString();
    onUpdate(b.id, { booking_date: dateStr, start_time: timeISO });
    setShowReschedule(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <SheetTitle className="text-lg">{b.service_name}</SheetTitle>
            <Badge className={cn('text-xs', statusColors[b.status])}>{b.no_show ? 'No-Show' : b.status?.replace('_', ' ')}</Badge>
            <Badge className={cn('text-[10px]', source.class)}>{source.label}</Badge>
            {b.recurring_group_id && (
              <Badge variant="outline" className="text-[10px]"><Repeat className="w-2.5 h-2.5 mr-0.5" />{b.recurring_pattern || 'Recurring'}</Badge>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Info */}
          <div className="space-y-3">
            <InfoRow icon={User} label="Customer" value={`${b.customer_name}${b.customer_phone ? ` · ${b.customer_phone}` : ''}`} />
            <InfoRow icon={CalIcon} label="Date" value={b.booking_date} />
            <InfoRow icon={Clock} label="Time" value={formatTime(b.start_time)} />
            {b.estimated_duration_minutes && <InfoRow icon={Clock} label="Duration" value={`${b.estimated_duration_minutes} min`} />}
            <InfoRow icon={DollarSign} label="Price" value={`$${Number(b.total_price).toFixed(2)}`} />
          </div>

          {/* Pets */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><PawPrint className="w-3 h-3" /> Pets</p>
            {pets.length > 0 ? (
              <div className="space-y-1.5">
                {pets.map((p: any, i: number) => (
                  <div key={i} className="rounded-lg bg-muted p-2 text-sm flex items-center gap-2">
                    <PawPrint className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="font-medium">{p.name}</span>
                    {p.species && <span className="text-xs text-muted-foreground">({p.species})</span>}
                    {p.breed && <span className="text-xs text-muted-foreground">· {p.breed}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-muted p-2 text-sm">
                <span className="font-medium">{b.pet_name}</span>
                {b.pet_species && <span className="text-xs text-muted-foreground"> ({b.pet_species})</span>}
                {b.pet_breed && <span className="text-xs text-muted-foreground"> · {b.pet_breed}</span>}
              </div>
            )}
          </div>

          {/* Staff */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" /> Assigned Staff</p>
            <Select
              value={b.assigned_staff_id || 'unassigned'}
              onValueChange={(v) => onUpdate(b.id, { assigned_staff_id: v === 'unassigned' ? null : v })}
            >
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Payment */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><CreditCard className="w-3 h-3" /> Payment Status</p>
            <Select value={b.payment_status || 'unpaid'} onValueChange={(v) => onUpdate(b.id, { payment_status: v })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Timeline</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-muted p-2.5">
                <p className="text-muted-foreground flex items-center gap-1"><LogIn className="w-3 h-3" /> Check-in</p>
                <p className="font-medium mt-0.5">{formatTime(b.check_in_time)}</p>
              </div>
              <div className="rounded-lg bg-muted p-2.5">
                <p className="text-muted-foreground flex items-center gap-1"><LogOut className="w-3 h-3" /> Check-out</p>
                <p className="font-medium mt-0.5">{formatTime(b.check_out_time)}</p>
              </div>
            </div>
          </div>

          {/* Notification Log */}
          {notificationLog.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Bell className="w-3 h-3" /> Notification History</p>
              <div className="space-y-1">
                {notificationLog.map((n: any) => (
                  <div key={n.id} className="flex items-center justify-between text-xs rounded bg-muted px-2.5 py-1.5">
                    <span className="capitalize">{n.event_type?.replace('_', ' ')}</span>
                    <span className="text-muted-foreground">{(() => { try { return format(new Date(n.created_at), 'MMM d, HH:mm'); } catch { return ''; } })()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><FileText className="w-3 h-3" /> Notes</p>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Add notes about this appointment..." />
            {notes !== (b.notes || '') && (
              <Button size="sm" onClick={handleSaveNotes}>Save Notes</Button>
            )}
          </div>

          {/* Reschedule */}
          {!['completed', 'cancelled'].includes(b.status) && (
            <div className="space-y-2">
              {!showReschedule ? (
                <Button variant="outline" size="sm" className="w-full" onClick={() => setShowReschedule(true)}>
                  <CalendarIcon className="w-3.5 h-3.5 mr-1.5" /> Reschedule
                </Button>
              ) : (
                <div className="rounded-lg border p-3 space-y-3">
                  <p className="text-xs font-medium">Reschedule to:</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-9 text-sm", !rescheduleDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                        {rescheduleDate ? format(rescheduleDate, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={rescheduleDate} onSelect={setRescheduleDate} className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  <Input type="time" value={rescheduleTime} onChange={e => setRescheduleTime(e.target.value)} className="h-9" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleReschedule} disabled={!rescheduleDate || !rescheduleTime}>Confirm</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowReschedule(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status Actions */}
          <div className="flex flex-col gap-2 pt-2 border-t">
            {b.status === 'pending' && (
              <Button onClick={() => onUpdateStatus(b.id, 'confirmed')} className="w-full">Confirm Appointment</Button>
            )}
            {b.status === 'confirmed' && !b.check_in_time && (
              <Button onClick={() => onUpdateStatus(b.id, 'confirmed', { check_in_time: new Date().toISOString() })} className="w-full">
                <LogIn className="w-4 h-4 mr-1.5" /> Check In
              </Button>
            )}
            {b.status === 'confirmed' && b.check_in_time && (
              <Button onClick={() => onUpdateStatus(b.id, 'in_progress')} className="w-full">
                Start Service
              </Button>
            )}
            {b.status === 'in_progress' && (
              <Button onClick={() => onUpdateStatus(b.id, 'completed', { check_out_time: new Date().toISOString() })} className="w-full bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle className="w-4 h-4 mr-1.5" /> Complete
              </Button>
            )}
            {['pending', 'confirmed'].includes(b.status) && !b.no_show && (
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 text-red-600" onClick={() => onUpdateStatus(b.id, b.status, { no_show: true })}>
                  Mark No-Show
                </Button>
                <Button variant="destructive" className="flex-1" onClick={() => onUpdateStatus(b.id, 'cancelled')}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

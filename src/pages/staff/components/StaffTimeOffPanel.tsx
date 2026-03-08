import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Calendar, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useStaffTimeOff, useInsert, useUpdate, useDelete } from '@/hooks/use-supabase-data';
import { format, isWithinInterval, parseISO } from 'date-fns';

const typeColors: Record<string, string> = {
  holiday: 'bg-blue-100 text-blue-700',
  sick: 'bg-red-100 text-red-700',
  personal: 'bg-violet-100 text-violet-700',
  training: 'bg-amber-100 text-amber-700',
};

const statusColors: Record<string, string> = {
  approved: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
};

interface Props {
  staff: any[];
  bookings: any[];
}

export default function StaffTimeOffPanel({ staff, bookings }: Props) {
  const { data: timeOff = [] } = useStaffTimeOff();
  const insertTimeOff = useInsert('staff_time_off');
  const updateTimeOff = useUpdate('staff_time_off');
  const deleteTimeOff = useDelete('staff_time_off');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    staff_id: '', start_date: '', end_date: '', type: 'holiday', reason: '', status: 'approved',
  });

  const handleSave = () => {
    if (!form.staff_id || !form.start_date || !form.end_date) return;
    insertTimeOff.mutate({
      staff_id: form.staff_id, start_date: form.start_date, end_date: form.end_date,
      type: form.type, reason: form.reason || null, status: form.status,
    }, {
      onSuccess: () => { toast.success('Time off added'); setDialogOpen(false); setForm({ staff_id: '', start_date: '', end_date: '', type: 'holiday', reason: '', status: 'approved' }); },
    });
  };

  const getConflicts = (staffId: string, startDate: string, endDate: string) => {
    return bookings.filter(b => {
      if (b.status === 'cancelled') return false;
      try {
        return b.assigned_staff_id === staffId &&
          isWithinInterval(parseISO(b.booking_date), { start: parseISO(startDate), end: parseISO(endDate) });
      } catch { return false; }
    });
  };

  const toggleStatus = (id: string, current: string) => {
    const next = current === 'approved' ? 'rejected' : 'approved';
    updateTimeOff.mutate({ id, status: next }, {
      onSuccess: () => toast.success(`Status changed to ${next}`),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">Manage holidays, sick days, and time off</p>
        <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-1" /> Add Time Off</Button>
      </div>

      {timeOff.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No time off scheduled</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {timeOff.map((t: any) => {
            const member = staff.find(s => s.id === t.staff_id);
            const conflicts = getConflicts(t.staff_id, t.start_date, t.end_date);
            return (
              <Card key={t.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-semibold">{member?.full_name || 'Unknown'}</p>
                        <Badge className={cn("text-[10px]", typeColors[t.type])}>{t.type}</Badge>
                        <Badge className={cn("text-[10px]", statusColors[t.status])}>{t.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(t.start_date), 'MMM d, yyyy')} — {format(parseISO(t.end_date), 'MMM d, yyyy')}
                      </p>
                      {t.reason && <p className="text-xs text-muted-foreground mt-1">{t.reason}</p>}
                      {conflicts.length > 0 && (
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-destructive">
                          <AlertTriangle className="w-3 h-3" />
                          {conflicts.length} booking conflict{conflicts.length > 1 ? 's' : ''} during this period
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleStatus(t.id, t.status)}>
                        {t.status === 'approved' ? <XCircle className="w-3.5 h-3.5 text-destructive" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => {
                        if (window.confirm('Remove this time off entry?')) deleteTimeOff.mutate(t.id, { onSuccess: () => toast.success('Removed') });
                      }}>
                        <XCircle className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Time Off</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Staff Member *</Label>
              <Select value={form.staff_id} onValueChange={v => setForm(f => ({ ...f, staff_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                <SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Start Date *</Label><Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>End Date *</Label><Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Reason</Label><Textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={2} placeholder="Optional reason..." /></div>
            {form.staff_id && form.start_date && form.end_date && getConflicts(form.staff_id, form.start_date, form.end_date).length > 0 && (
              <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-lg p-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{getConflicts(form.staff_id, form.start_date, form.end_date).length} existing booking(s) conflict with this period</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.staff_id || !form.start_date || !form.end_date}>Add Time Off</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

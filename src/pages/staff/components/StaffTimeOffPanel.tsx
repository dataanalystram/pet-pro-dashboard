import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Calendar, CheckCircle, XCircle, AlertTriangle, Search, Filter, ChevronsUpDown, Check, Pencil } from 'lucide-react';
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [staffSearchOpen, setStaffSearchOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [form, setForm] = useState({
    staff_id: '', start_date: '', end_date: '', type: 'holiday', reason: '', status: 'approved',
  });

  const resetForm = () => {
    setForm({ staff_id: '', start_date: '', end_date: '', type: 'holiday', reason: '', status: 'approved' });
    setEditingId(null);
  };

  const openAdd = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (t: any) => {
    setEditingId(t.id);
    setForm({
      staff_id: t.staff_id, start_date: t.start_date, end_date: t.end_date,
      type: t.type, reason: t.reason || '', status: t.status,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.staff_id || !form.start_date || !form.end_date) return;
    const payload = {
      staff_id: form.staff_id, start_date: form.start_date, end_date: form.end_date,
      type: form.type, reason: form.reason || null, status: form.status,
    };

    if (editingId) {
      updateTimeOff.mutate({ id: editingId, ...payload }, {
        onSuccess: () => { toast.success('Time off updated'); setDialogOpen(false); resetForm(); },
      });
    } else {
      insertTimeOff.mutate(payload, {
        onSuccess: () => { toast.success('Time off added'); setDialogOpen(false); resetForm(); },
      });
    }
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

  const bulkUpdateStatus = (status: string) => {
    selectedIds.forEach(id => {
      updateTimeOff.mutate({ id, status }, {
        onSuccess: () => {},
      });
    });
    toast.success(`${selectedIds.size} entries updated to ${status}`);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectedStaffName = staff.find(s => s.id === form.staff_id)?.full_name || '';

  // Filtered time off
  const filtered = useMemo(() => {
    return timeOff.filter((t: any) => {
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (searchQuery) {
        const member = staff.find(s => s.id === t.staff_id);
        const name = member?.full_name?.toLowerCase() || '';
        if (!name.includes(searchQuery.toLowerCase())) return false;
      }
      return true;
    });
  }, [timeOff, filterStatus, filterType, searchQuery, staff]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-medium text-muted-foreground">Manage holidays, sick days, and time off</p>
        <Button size="sm" onClick={openAdd}><Plus className="w-4 h-4 mr-1" /> Add Time Off</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by staff name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-xs"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[120px] h-8 text-xs"><Filter className="w-3 h-3 mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="holiday">Holiday</SelectItem>
            <SelectItem value="sick">Sick Leave</SelectItem>
            <SelectItem value="personal">Personal</SelectItem>
            <SelectItem value="training">Training</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
          <span className="text-xs font-medium">{selectedIds.size} selected</span>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => bulkUpdateStatus('approved')}>
            <CheckCircle className="w-3 h-3 mr-1" />Approve All
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => bulkUpdateStatus('rejected')}>
            <XCircle className="w-3 h-3 mr-1" />Reject All
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedIds(new Set())}>Clear</Button>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {timeOff.length === 0 ? 'No time off scheduled' : 'No results match your filters'}
          </p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((t: any) => {
            const member = staff.find(s => s.id === t.staff_id);
            const conflicts = getConflicts(t.staff_id, t.start_date, t.end_date);
            return (
              <Card key={t.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedIds.has(t.id)}
                      onCheckedChange={() => toggleSelect(t.id)}
                      className="mt-1"
                    />
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
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                        const next = t.status === 'approved' ? 'rejected' : 'approved';
                        updateTimeOff.mutate({ id: t.id, status: next }, {
                          onSuccess: () => toast.success(`Status changed to ${next}`),
                        });
                      }}>
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingId ? 'Edit Time Off' : 'Add Time Off'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {/* Searchable staff combobox */}
            <div className="space-y-1.5">
              <Label>Staff Member *</Label>
              <Popover open={staffSearchOpen} onOpenChange={setStaffSearchOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal h-10">
                    {selectedStaffName || 'Select staff...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search staff..." />
                    <CommandList>
                      <CommandEmpty>No staff found.</CommandEmpty>
                      <CommandGroup>
                        {staff.map(s => (
                          <CommandItem
                            key={s.id}
                            value={s.full_name}
                            onSelect={() => {
                              setForm(f => ({ ...f, staff_id: s.id }));
                              setStaffSearchOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", form.staff_id === s.id ? "opacity-100" : "opacity-0")} />
                            <span>{s.full_name}</span>
                            <Badge variant="secondary" className="ml-auto text-[10px] capitalize">{s.role}</Badge>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.staff_id || !form.start_date || !form.end_date}>
              {editingId ? 'Save Changes' : 'Add Time Off'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

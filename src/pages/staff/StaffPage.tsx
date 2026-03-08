import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Star, Calendar, Briefcase, Trash2, Pencil, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useStaff, useBookings, useInsert, useUpdate, useDelete } from '@/hooks/use-supabase-data';
import StaffStatsRow from './components/StaffStatsRow';
import StaffDetailPanel from './components/StaffDetailPanel';
import StaffAvailabilityGrid from './components/StaffAvailabilityGrid';

const roleColors: Record<string, string> = {
  owner: 'bg-amber-100 text-amber-700', manager: 'bg-violet-100 text-violet-700',
  staff: 'bg-blue-100 text-blue-700', part_time: 'bg-secondary text-secondary-foreground',
  contractor: 'bg-orange-100 text-orange-700',
};

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500', on_leave: 'bg-amber-500', inactive: 'bg-muted-foreground',
};

export default function StaffPage() {
  const { data: staff = [], isLoading } = useStaff();
  const { data: bookings = [] } = useBookings();
  const insertStaff = useInsert('staff');
  const updateStaff = useUpdate('staff');
  const deleteStaff = useDelete('staff');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', role: 'staff', title: '',
    hourly_rate: '', max_daily_bookings: '8', status: 'active',
    hire_date: '', bio: '', specializations: '',
  });

  const openAdd = () => {
    setEditingStaff(null);
    setForm({ full_name: '', email: '', phone: '', role: 'staff', title: '', hourly_rate: '', max_daily_bookings: '8', status: 'active', hire_date: '', bio: '', specializations: '' });
    setDialogOpen(true);
  };

  const openEdit = (s: any) => {
    setEditingStaff(s);
    setForm({
      full_name: s.full_name || '', email: s.email || '', phone: s.phone || '',
      role: s.role || 'staff', title: s.title || '',
      hourly_rate: s.hourly_rate?.toString() || '', max_daily_bookings: (s.max_daily_bookings || 8).toString(),
      status: s.status || 'active', hire_date: s.hire_date || '', bio: s.bio || '',
      specializations: (s.specializations || []).join(', '),
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const payload: any = {
      full_name: form.full_name, email: form.email, phone: form.phone || null,
      role: form.role, title: form.title || null,
      hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : null,
      max_daily_bookings: parseInt(form.max_daily_bookings) || 8,
      status: form.status, hire_date: form.hire_date || null, bio: form.bio || null,
      specializations: form.specializations ? form.specializations.split(',').map(s => s.trim()).filter(Boolean) : [],
    };
    if (editingStaff) {
      updateStaff.mutate({ id: editingStaff.id, ...payload }, { onSuccess: () => { toast.success('Staff updated'); setDialogOpen(false); } });
    } else {
      insertStaff.mutate(payload, { onSuccess: () => { toast.success('Staff added'); setDialogOpen(false); } });
    }
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Remove this staff member?')) return;
    deleteStaff.mutate(id, { onSuccess: () => toast.success('Staff removed') });
  };

  const today = new Date().toISOString().split('T')[0];
  const filtered = staff.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading staff...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Staff</h1>
          <p className="text-sm text-muted-foreground">{staff.length} team members</p>
        </div>
        <Button onClick={openAdd}><UserPlus className="w-4 h-4 mr-2" /> Add Staff</Button>
      </div>

      <StaffStatsRow staff={staff} bookings={bookings} />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Tabs defaultValue="team">
        <TabsList>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="mt-4">
          {filtered.length === 0 ? (
            <Card><CardContent className="py-16 text-center">
              <UserPlus className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No staff members found</p>
              <Button onClick={openAdd} className="mt-4" size="sm">Add Your First Staff</Button>
            </CardContent></Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((s) => {
                const todayBookingCount = bookings.filter(b => b.booking_date === today && b.status !== 'cancelled').length;
                const loadPct = Math.round((todayBookingCount / s.max_daily_bookings) * 100);

                return (
                  <Card
                    key={s.id}
                    className="hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => setSelectedStaff(s)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
                              {s.avatar_url
                                ? <img src={s.avatar_url} className="w-full h-full rounded-full object-cover" />
                                : s.full_name?.[0]?.toUpperCase()
                              }
                            </div>
                            <div className={cn("absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card", statusColors[s.status] || statusColors.active)} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{s.full_name}</p>
                            <p className="text-xs text-muted-foreground">{s.title || s.role}</p>
                          </div>
                        </div>
                        <Badge className={cn("text-[10px]", roleColors[s.role] || roleColors.staff)}>{s.role?.replace('_', ' ')}</Badge>
                      </div>

                      {/* Stats grid */}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="text-center bg-muted rounded-lg p-2">
                          <Star className="w-3.5 h-3.5 text-amber-500 mx-auto mb-0.5" />
                          <p className="text-sm font-bold">{Number(s.average_rating).toFixed(1)}</p>
                          <p className="text-[10px] text-muted-foreground">Rating</p>
                        </div>
                        <div className="text-center bg-muted rounded-lg p-2">
                          <Calendar className="w-3.5 h-3.5 text-primary mx-auto mb-0.5" />
                          <p className="text-sm font-bold">{s.total_services_completed}</p>
                          <p className="text-[10px] text-muted-foreground">Services</p>
                        </div>
                        <div className="text-center bg-muted rounded-lg p-2">
                          <Briefcase className="w-3.5 h-3.5 text-emerald-500 mx-auto mb-0.5" />
                          <p className="text-sm font-bold">{s.hourly_rate ? `$${Number(s.hourly_rate)}` : '-'}</p>
                          <p className="text-[10px] text-muted-foreground">/hr</p>
                        </div>
                      </div>

                      {/* Today's capacity bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Today's load</span>
                          <span className="font-medium">{todayBookingCount}/{s.max_daily_bookings}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className={cn("h-1.5 rounded-full transition-all",
                              loadPct >= 80 ? 'bg-destructive' : loadPct >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                            )}
                            style={{ width: `${Math.min(loadPct, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Specializations */}
                      {s.specializations?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {s.specializations.slice(0, 3).map((sp: string) => (
                            <Badge key={sp} variant="secondary" className="text-[10px] capitalize">{sp}</Badge>
                          ))}
                          {s.specializations.length > 3 && <span className="text-[10px] text-muted-foreground">+{s.specializations.length - 3}</span>}
                        </div>
                      )}

                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={(e) => { e.stopPropagation(); openEdit(s); }}>
                          <Pencil className="w-3 h-3 mr-1" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" className="h-8" onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}>
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="availability" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <StaffAvailabilityGrid staff={staff} bookings={bookings} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Panel */}
      <StaffDetailPanel
        staff={selectedStaff}
        open={!!selectedStaff}
        onClose={() => setSelectedStaff(null)}
        onEdit={() => { if (selectedStaff) { openEdit(selectedStaff); setSelectedStaff(null); } }}
        bookings={bookings}
      />

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingStaff ? 'Edit Staff' : 'Add Staff Member'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Full Name *</Label><Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Email *</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Role</Label>
                <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="owner">Owner</SelectItem><SelectItem value="manager">Manager</SelectItem><SelectItem value="staff">Staff</SelectItem><SelectItem value="part_time">Part Time</SelectItem><SelectItem value="contractor">Contractor</SelectItem></SelectContent>
                </Select></div>
              <div className="space-y-1.5"><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="on_leave">On Leave</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
                </Select></div>
              <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Senior Groomer" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Hourly Rate ($)</Label><Input type="number" value={form.hourly_rate} onChange={e => setForm(f => ({ ...f, hourly_rate: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Max Daily Bookings</Label><Input type="number" value={form.max_daily_bookings} onChange={e => setForm(f => ({ ...f, max_daily_bookings: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Hire Date</Label><Input type="date" value={form.hire_date} onChange={e => setForm(f => ({ ...f, hire_date: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Specializations</Label><Input value={form.specializations} onChange={e => setForm(f => ({ ...f, specializations: e.target.value }))} placeholder="grooming, dental, training (comma-separated)" /></div>
            <div className="space-y-1.5"><Label>Bio</Label><Textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Short bio or notes about this team member..." rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.full_name || !form.email}>{editingStaff ? 'Save Changes' : 'Add Staff'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

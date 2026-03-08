import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { UserPlus, Star, Calendar, Briefcase, Trash2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useStaff, useInsert, useUpdate, useDelete } from '@/hooks/use-supabase-data';

const roleColors: Record<string, string> = {
  owner: 'bg-amber-100 text-amber-700', manager: 'bg-violet-100 text-violet-700',
  staff: 'bg-blue-100 text-blue-700', part_time: 'bg-slate-100 text-slate-600',
  contractor: 'bg-orange-100 text-orange-700',
};

export default function StaffPage() {
  const { data: staff = [], isLoading } = useStaff();
  const insertStaff = useInsert('staff');
  const updateStaff = useUpdate('staff');
  const deleteStaff = useDelete('staff');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', role: 'staff', title: '', hourly_rate: '', max_daily_bookings: '8' });

  const openAdd = () => { setEditingStaff(null); setForm({ full_name: '', email: '', phone: '', role: 'staff', title: '', hourly_rate: '', max_daily_bookings: '8' }); setDialogOpen(true); };
  const openEdit = (s: any) => { setEditingStaff(s); setForm({ full_name: s.full_name || '', email: s.email || '', phone: s.phone || '', role: s.role || 'staff', title: s.title || '', hourly_rate: s.hourly_rate?.toString() || '', max_daily_bookings: (s.max_daily_bookings || 8).toString() }); setDialogOpen(true); };

  const handleSave = () => {
    const payload = { full_name: form.full_name, email: form.email, phone: form.phone || null, role: form.role, title: form.title || null, hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : null, max_daily_bookings: parseInt(form.max_daily_bookings) || 8 };
    if (editingStaff) {
      updateStaff.mutate({ id: editingStaff.id, ...payload }, { onSuccess: () => { toast.success('Staff updated'); setDialogOpen(false); } });
    } else {
      insertStaff.mutate(payload, { onSuccess: () => { toast.success('Staff added'); setDialogOpen(false); } });
    }
  };

  const handleDelete = (id: string) => { if (!window.confirm('Remove this staff member?')) return; deleteStaff.mutate(id, { onSuccess: () => toast.success('Staff removed') }); };

  if (isLoading) return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading staff...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-heading font-bold">Staff</h1><p className="text-sm text-muted-foreground">{staff.length} team members</p></div>
        <Button onClick={openAdd}><UserPlus className="w-4 h-4 mr-2" /> Add Staff</Button>
      </div>

      {staff.length === 0 ? (
        <Card><CardContent className="py-16 text-center"><UserPlus className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" /><p className="text-sm text-muted-foreground">No staff members yet</p><Button onClick={openAdd} className="mt-4" size="sm">Add Your First Staff</Button></CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((s) => (
            <Card key={s.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center font-bold">{s.full_name?.[0]?.toUpperCase()}</div>
                    <div><p className="text-sm font-semibold">{s.full_name}</p><p className="text-xs text-muted-foreground">{s.title || s.role}</p></div>
                  </div>
                  <Badge className={cn("text-[10px]", roleColors[s.role] || roleColors.staff)}>{s.role?.replace('_', ' ')}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center bg-muted rounded-lg p-2"><Star className="w-3.5 h-3.5 text-amber-500 mx-auto mb-0.5" /><p className="text-sm font-bold">{Number(s.average_rating).toFixed(1)}</p><p className="text-[10px] text-muted-foreground">Rating</p></div>
                  <div className="text-center bg-muted rounded-lg p-2"><Calendar className="w-3.5 h-3.5 text-blue-500 mx-auto mb-0.5" /><p className="text-sm font-bold">{s.total_services_completed}</p><p className="text-[10px] text-muted-foreground">Services</p></div>
                  <div className="text-center bg-muted rounded-lg p-2"><Briefcase className="w-3.5 h-3.5 text-emerald-500 mx-auto mb-0.5" /><p className="text-sm font-bold">{s.hourly_rate ? `$${Number(s.hourly_rate)}` : '-'}</p><p className="text-[10px] text-muted-foreground">/hr</p></div>
                </div>
                {s.specializations?.length > 0 && <div className="flex flex-wrap gap-1 mb-3">{s.specializations.map((sp) => <Badge key={sp} variant="secondary" className="text-[10px] capitalize">{sp}</Badge>)}</div>}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(s)}><Pencil className="w-3 h-3 mr-1" /> Edit</Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(s.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-3 h-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingStaff ? 'Edit Staff' : 'Add Staff Member'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Full Name *</Label><Input value={form.full_name} onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Email</Label><Input value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm(f => ({ ...f, role: v }))}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="owner">Owner</SelectItem><SelectItem value="manager">Manager</SelectItem><SelectItem value="staff">Staff</SelectItem><SelectItem value="part_time">Part Time</SelectItem><SelectItem value="contractor">Contractor</SelectItem></SelectContent>
                </Select></div>
              <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Senior Groomer" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Hourly Rate ($)</Label><Input type="number" value={form.hourly_rate} onChange={(e) => setForm(f => ({ ...f, hourly_rate: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Max Daily Bookings</Label><Input type="number" value={form.max_daily_bookings} onChange={(e) => setForm(f => ({ ...f, max_daily_bookings: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.full_name}>{editingStaff ? 'Save Changes' : 'Add Staff'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

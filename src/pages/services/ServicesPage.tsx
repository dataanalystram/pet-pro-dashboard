import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Clock, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useServices, useInsert, useUpdate, useDelete } from '@/hooks/use-supabase-data';

const categoryColors: Record<string, string> = {
  grooming: 'bg-blue-100 text-blue-700', dental: 'bg-emerald-100 text-emerald-700',
  medical: 'bg-red-100 text-red-700', walking: 'bg-amber-100 text-amber-700',
  boarding: 'bg-violet-100 text-violet-700', training: 'bg-orange-100 text-orange-700',
  sitting: 'bg-pink-100 text-pink-700', other: 'bg-slate-100 text-slate-600',
};

const CATEGORIES = [
  { value: 'grooming', label: 'Grooming' }, { value: 'dental', label: 'Dental' },
  { value: 'medical', label: 'Medical' }, { value: 'walking', label: 'Walking' },
  { value: 'boarding', label: 'Boarding' }, { value: 'training', label: 'Training' },
  { value: 'sitting', label: 'Pet Sitting' }, { value: 'other', label: 'Other' },
];

export default function ServicesPage() {
  const { data: services = [], isLoading } = useServices();
  const insertService = useInsert('services');
  const updateService = useUpdate('services');
  const deleteService = useDelete('services');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', category: 'grooming', base_price: '', duration_minutes: '', is_active: true });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '', category: 'grooming', base_price: '', duration_minutes: '', is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (s: any) => {
    setEditing(s);
    setForm({ name: s.name, description: s.description || '', category: s.category, base_price: s.base_price.toString(), duration_minutes: s.duration_minutes.toString(), is_active: s.is_active });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const payload = { name: form.name, description: form.description || null, category: form.category, base_price: parseFloat(form.base_price), duration_minutes: parseInt(form.duration_minutes), is_active: form.is_active };
    if (editing) {
      updateService.mutate({ id: editing.id, ...payload }, { onSuccess: () => { toast.success('Service updated'); setDialogOpen(false); } });
    } else {
      insertService.mutate({ ...payload, price_type: 'fixed', buffer_minutes: 15, pet_types_accepted: ['dog', 'cat'] }, { onSuccess: () => { toast.success('Service created'); setDialogOpen(false); } });
    }
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this service?')) return;
    deleteService.mutate(id, { onSuccess: () => toast.success('Service deleted') });
  };

  if (isLoading) return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading services...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Services</h1>
          <p className="text-sm text-muted-foreground">{services.length} services</p>
        </div>
        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" /> Add Service</Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((s) => (
          <Card key={s.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold">{s.name}</p>
                  <Badge className={cn("text-[10px] mt-1", categoryColors[s.category] || categoryColors.other)}>{s.category}</Badge>
                </div>
                {!s.is_active && <Badge variant="secondary" className="text-[10px]">Inactive</Badge>}
              </div>
              {s.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{s.description}</p>}
              <div className="flex items-center gap-4 mt-3 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground"><DollarSign className="w-3.5 h-3.5" /><span className="font-semibold text-foreground">${Number(s.base_price)}</span></div>
                <div className="flex items-center gap-1 text-muted-foreground"><Clock className="w-3.5 h-3.5" /><span>{s.duration_minutes}min</span></div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(s)}><Pencil className="w-3 h-3 mr-1" /> Edit</Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(s.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-3 h-3" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit Service' : 'Add Service'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Price ($) *</Label><Input type="number" value={form.base_price} onChange={(e) => setForm(f => ({ ...f, base_price: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Duration (min) *</Label><Input type="number" value={form.duration_minutes} onChange={(e) => setForm(f => ({ ...f, duration_minutes: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.base_price}>{editing ? 'Save Changes' : 'Add Service'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

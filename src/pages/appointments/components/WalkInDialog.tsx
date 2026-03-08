import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

interface WalkInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: any[];
  staff: any[];
  customers: any[];
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export default function WalkInDialog({ open, onOpenChange, services, staff, customers, onSubmit, isLoading }: WalkInDialogProps) {
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    service_id: '',
    pet_name: '',
    pet_species: '',
    assigned_staff_id: '',
    notes: '',
  });

  const selectedService = services.find(s => s.id === form.service_id);

  const handleSubmit = () => {
    if (!form.customer_name || !form.service_id || !form.pet_name) return;
    const now = new Date();
    onSubmit({
      customer_name: form.customer_name,
      customer_email: form.customer_email || null,
      service_name: selectedService?.name || 'Walk-in Service',
      pet_name: form.pet_name,
      pet_species: form.pet_species || null,
      assigned_staff_id: form.assigned_staff_id || null,
      notes: form.notes || null,
      booking_date: format(now, 'yyyy-MM-dd'),
      start_time: now.toISOString(),
      total_price: selectedService?.base_price || 0,
      estimated_duration_minutes: selectedService?.duration_minutes || null,
      source: 'walk_in',
      status: 'in_progress',
      check_in_time: now.toISOString(),
      payment_status: 'unpaid',
    });
    setForm({ customer_name: '', customer_email: '', service_id: '', pet_name: '', pet_species: '', assigned_staff_id: '', notes: '' });
  };

  const matchedCustomer = customers.find(c =>
    form.customer_name.length > 2 && c.customer_name.toLowerCase().includes(form.customer_name.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Walk-in Appointment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Customer Name *</Label>
            <Input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} placeholder="Customer name" />
            {matchedCustomer && form.customer_name !== matchedCustomer.customer_name && (
              <button
                className="text-xs text-primary hover:underline"
                onClick={() => setForm(f => ({ ...f, customer_name: matchedCustomer.customer_name, customer_email: matchedCustomer.customer_email }))}
              >
                Did you mean {matchedCustomer.customer_name}?
              </button>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Email (optional)</Label>
            <Input value={form.customer_email} onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))} placeholder="email@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label>Service *</Label>
            <Select value={form.service_id} onValueChange={v => setForm(f => ({ ...f, service_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
              <SelectContent>
                {services.filter(s => s.is_active).map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name} — ${Number(s.base_price).toFixed(0)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Pet Name *</Label>
              <Input value={form.pet_name} onChange={e => setForm(f => ({ ...f, pet_name: e.target.value }))} placeholder="Pet name" />
            </div>
            <div className="space-y-1.5">
              <Label>Species</Label>
              <Select value={form.pet_species} onValueChange={v => setForm(f => ({ ...f, pet_species: v }))}>
                <SelectTrigger><SelectValue placeholder="Species" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dog">Dog</SelectItem>
                  <SelectItem value="cat">Cat</SelectItem>
                  <SelectItem value="bird">Bird</SelectItem>
                  <SelectItem value="rabbit">Rabbit</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Assign Staff</Label>
            <Select value={form.assigned_staff_id} onValueChange={v => setForm(f => ({ ...f, assigned_staff_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
              <SelectContent>
                {staff.filter(s => s.status === 'active').map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any special instructions..." rows={2} />
          </div>
          {selectedService && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <span className="font-medium">{selectedService.name}</span>
              <span className="text-muted-foreground"> · {selectedService.duration_minutes}min · ${Number(selectedService.base_price).toFixed(2)}</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!form.customer_name || !form.service_id || !form.pet_name || isLoading}>
            Start Walk-in
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface Pet {
  name: string;
  species: string;
  breed: string;
}

interface WalkInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: any[];
  staff: any[];
  customers: any[];
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

const emptyPet = (): Pet => ({ name: '', species: '', breed: '' });

export default function WalkInDialog({ open, onOpenChange, services, staff, customers, onSubmit, isLoading }: WalkInDialogProps) {
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    service_id: '',
    assigned_staff_id: '',
    notes: '',
  });
  const [pets, setPets] = useState<Pet[]>([emptyPet()]);

  const selectedService = services.find(s => s.id === form.service_id);

  const addPet = () => setPets(p => [...p, emptyPet()]);
  const removePet = (i: number) => setPets(p => p.filter((_, idx) => idx !== i));
  const updatePet = (i: number, field: keyof Pet, value: string) => {
    setPets(p => p.map((pet, idx) => idx === i ? { ...pet, [field]: value } : pet));
  };

  const validPets = pets.filter(p => p.name.trim());
  const canSubmit = form.customer_name && form.service_id && validPets.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const now = new Date();
    const petNames = validPets.map(p => p.name).join(', ');
    onSubmit({
      customer_name: form.customer_name,
      customer_email: form.customer_email || null,
      customer_phone: form.customer_phone || null,
      service_name: selectedService?.name || 'Walk-in Service',
      pet_name: petNames,
      pet_species: validPets[0]?.species || null,
      pet_breed: validPets[0]?.breed || null,
      pets: validPets,
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
    setForm({ customer_name: '', customer_email: '', customer_phone: '', service_id: '', assigned_staff_id: '', notes: '' });
    setPets([emptyPet()]);
  };

  const matchedCustomer = customers.find(c =>
    form.customer_name.length > 2 && c.customer_name.toLowerCase().includes(form.customer_name.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Walk-in Appointment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Customer */}
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={form.customer_email} onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))} placeholder="email@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} placeholder="+1 234 567 890" />
            </div>
          </div>

          {/* Service */}
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

          {/* Multi-Pet Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Pets *</Label>
              <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={addPet}>
                <Plus className="w-3 h-3 mr-1" /> Add Pet
              </Button>
            </div>
            {pets.map((pet, i) => (
              <div key={i} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Pet {i + 1}</span>
                  {pets.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => removePet(i)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <Input value={pet.name} onChange={e => updatePet(i, 'name', e.target.value)} placeholder="Pet name *" className="h-8 text-sm" />
                <div className="grid grid-cols-2 gap-2">
                  <Select value={pet.species === 'dog' || pet.species === 'cat' || pet.species === 'bird' || pet.species === 'rabbit' || pet.species === '' ? pet.species : 'other'} onValueChange={v => updatePet(i, 'species', v === 'other' ? '' : v)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Species" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dog">Dog</SelectItem>
                      <SelectItem value="cat">Cat</SelectItem>
                      <SelectItem value="bird">Bird</SelectItem>
                      <SelectItem value="rabbit">Rabbit</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input value={pet.breed} onChange={e => updatePet(i, 'breed', e.target.value)} placeholder="Breed" className="h-8 text-sm" />
                </div>
                {pet.species !== 'dog' && pet.species !== 'cat' && pet.species !== 'bird' && pet.species !== 'rabbit' && pet.species !== '' && (
                  <Input value={pet.species} onChange={e => updatePet(i, 'species', e.target.value)} placeholder="Enter pet type (e.g. hamster, turtle...)" className="h-8 text-sm" />
                )}
                {(pet.species === '' && pets.some((_, idx) => idx === i)) && (() => {
                  // Check if "other" was just selected by looking at select value
                  const selectVal = pet.species === 'dog' || pet.species === 'cat' || pet.species === 'bird' || pet.species === 'rabbit' || pet.species === '' ? pet.species : 'other';
                  return null;
                })()}
              </div>
            ))}
          </div>

          {/* Staff */}
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

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any special instructions..." rows={2} />
          </div>

          {/* Service Summary */}
          {selectedService && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <span className="font-medium">{selectedService.name}</span>
              <span className="text-muted-foreground"> · {selectedService.duration_minutes}min · ${Number(selectedService.base_price).toFixed(2)}</span>
              {validPets.length > 1 && (
                <span className="text-muted-foreground"> · {validPets.length} pets</span>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isLoading}>
            Start Walk-in
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Plus, Trash2, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays, addWeeks, addMonths } from 'date-fns';

interface Pet {
  name: string;
  species: string;
  breed: string;
}

interface CreateAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: any[];
  staff: any[];
  customers: any[];
  onSubmit: (bookings: any[]) => void;
  isLoading?: boolean;
}

const emptyPet = (): Pet => ({ name: '', species: '', breed: '' });

export default function CreateAppointmentDialog({ open, onOpenChange, services, staff, customers, onSubmit, isLoading }: CreateAppointmentDialogProps) {
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    service_id: '',
    assigned_staff_id: '',
    notes: '',
    time: '',
    source: 'phone' as string,
  });
  const [pets, setPets] = useState<Pet[]>([emptyPet()]);
  const [date, setDate] = useState<Date | undefined>();
  const [recurring, setRecurring] = useState(false);
  const [pattern, setPattern] = useState('weekly');
  const [occurrences, setOccurrences] = useState(4);

  const selectedService = services.find(s => s.id === form.service_id);
  const validPets = pets.filter(p => p.name.trim());
  const canSubmit = form.customer_name && form.service_id && validPets.length > 0 && date && form.time;

  const addPet = () => setPets(p => [...p, emptyPet()]);
  const removePet = (i: number) => setPets(p => p.filter((_, idx) => idx !== i));
  const updatePet = (i: number, field: keyof Pet, value: string) => {
    setPets(p => p.map((pet, idx) => idx === i ? { ...pet, [field]: value } : pet));
  };

  const matchedCustomer = customers.find(c =>
    form.customer_name.length > 2 && c.customer_name.toLowerCase().includes(form.customer_name.toLowerCase())
  );

  const handleSubmit = () => {
    if (!canSubmit || !date) return;

    const recurringGroupId = recurring ? crypto.randomUUID() : null;
    const dates: Date[] = [date];

    if (recurring) {
      for (let i = 1; i < occurrences; i++) {
        const prev = dates[0];
        if (pattern === 'weekly') dates.push(addWeeks(prev, i));
        else if (pattern === 'biweekly') dates.push(addWeeks(prev, i * 2));
        else if (pattern === 'monthly') dates.push(addMonths(prev, i));
      }
    }

    const petNames = validPets.map(p => p.name).join(', ');
    const bookings = dates.map(d => {
      const dateStr = format(d, 'yyyy-MM-dd');
      const timeISO = new Date(`${dateStr}T${form.time}:00`).toISOString();
      return {
        customer_name: form.customer_name,
        customer_email: form.customer_email || null,
        customer_phone: form.customer_phone || null,
        service_name: selectedService?.name || 'Service',
        pet_name: petNames,
        pet_species: validPets[0]?.species || null,
        pet_breed: validPets[0]?.breed || null,
        pets: validPets,
        assigned_staff_id: form.assigned_staff_id || null,
        notes: form.notes || null,
        booking_date: dateStr,
        start_time: timeISO,
        total_price: selectedService?.base_price || 0,
        estimated_duration_minutes: selectedService?.duration_minutes || null,
        source: form.source,
        status: 'pending',
        payment_status: 'unpaid',
        recurring_group_id: recurringGroupId,
        recurring_pattern: recurring ? pattern : null,
      };
    });

    onSubmit(bookings);
    setForm({ customer_name: '', customer_email: '', customer_phone: '', service_id: '', assigned_staff_id: '', notes: '', time: '', source: 'phone' });
    setPets([emptyPet()]);
    setDate(undefined);
    setRecurring(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Appointment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Customer */}
          <div className="space-y-1.5">
            <Label>Customer Name *</Label>
            <Input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} placeholder="Customer name" />
            {matchedCustomer && form.customer_name !== matchedCustomer.customer_name && (
              <button className="text-xs text-primary hover:underline"
                onClick={() => setForm(f => ({ ...f, customer_name: matchedCustomer.customer_name, customer_email: matchedCustomer.customer_email }))}>
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

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-9 text-sm", !date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {date ? format(date, 'PPP') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label>Time *</Label>
              <Input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="h-9" />
            </div>
          </div>

          {/* Source */}
          <div className="space-y-1.5">
            <Label>Source</Label>
            <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v }))}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="walk_in">Walk-in</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Multi-Pet */}
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
                {(() => {
                  const knownSpecies = ['dog', 'cat', 'bird', 'rabbit'];
                  const isKnown = knownSpecies.includes(pet.species);
                  const selectVal = isKnown ? pet.species : (pet.species ? 'other' : '');
                  return (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <Select value={selectVal} onValueChange={v => updatePet(i, 'species', v === 'other' ? 'other' : v)}>
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
                      {selectVal === 'other' && (
                        <Input
                          value={pet.species === 'other' ? '' : pet.species}
                          onChange={e => updatePet(i, 'species', e.target.value || 'other')}
                          placeholder="Enter pet type (e.g. hamster, turtle...)"
                          className="h-8 text-sm"
                        />
                      )}
                    </>
                  );
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

          {/* Recurring */}
          <div className="rounded-lg border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm">Recurring Appointment</Label>
              </div>
              <Switch checked={recurring} onCheckedChange={setRecurring} />
            </div>
            {recurring && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Pattern</Label>
                  <Select value={pattern} onValueChange={setPattern}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Occurrences</Label>
                  <Input type="number" min={2} max={52} value={occurrences} onChange={e => setOccurrences(Number(e.target.value))} className="h-8 text-sm" />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any special instructions..." rows={2} />
          </div>

          {/* Summary */}
          {selectedService && date && form.time && (
            <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
              <div>
                <span className="font-medium">{selectedService.name}</span>
                <span className="text-muted-foreground"> · {selectedService.duration_minutes}min · ${Number(selectedService.base_price).toFixed(2)}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {format(date, 'PPP')} at {form.time}
                {validPets.length > 1 && ` · ${validPets.length} pets`}
                {recurring && ` · ${occurrences}× ${pattern}`}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isLoading}>
            {recurring ? `Create ${occurrences} Appointments` : 'Create Appointment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

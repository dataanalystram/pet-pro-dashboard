import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, PawPrint, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

const petSchema = z.object({
  name: z.string().trim().min(1, 'Pet name required').max(50),
  species: z.string().trim().min(1, 'Species required').max(30),
  breed: z.string().trim().max(50).optional().or(z.literal('')),
  weight_kg: z.string().optional().or(z.literal('')),
  age: z.string().trim().max(20).optional().or(z.literal('')),
  notes: z.string().trim().max(300).optional().or(z.literal('')),
});

const bookingSchema = z.object({
  customer_name: z.string().trim().min(1, 'Name required').max(100),
  customer_email: z.string().trim().email('Valid email required').max(255),
  customer_phone: z.string().trim().max(30).optional().or(z.literal('')),
  preferred_date: z.date({ required_error: 'Please pick a date' }),
  preferred_time: z.string().trim().optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
  is_urgent: z.boolean().default(false),
  pets: z.array(petSchema).min(1, 'Add at least one pet'),
});

type BookingFormData = z.infer<typeof bookingSchema>;

const speciesOptions = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Hamster', 'Fish', 'Reptile', 'Other'];

export default function PublicBookingPage() {
  const { serviceId } = useParams();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: service } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: async () => {
      if (!serviceId) return null;
      const { data, error } = await supabase.from('services').select('*').eq('id', serviceId).single();
      if (error) return null;
      return data;
    },
    enabled: !!serviceId,
  });

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      preferred_time: '',
      notes: '',
      is_urgent: false,
      pets: [{ name: '', species: '', breed: '', weight_kg: '', age: '', notes: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'pets' });

  const onSubmit = async (values: BookingFormData) => {
    setSubmitting(true);
    try {
      const petsData = values.pets.map(p => ({
        name: p.name,
        species: p.species,
        breed: p.breed || null,
        weight_kg: p.weight_kg ? parseFloat(p.weight_kg) : null,
        age: p.age || null,
        notes: p.notes || null,
      }));

      const petName = petsData.map(p => p.name).join(', ');
      const petSpecies = petsData[0]?.species || null;

      const { error } = await supabase.from('booking_requests').insert({
        customer_name: values.customer_name,
        customer_email: values.customer_email,
        customer_phone: values.customer_phone || null,
        service_name: service?.name || 'Unknown Service',
        service_id: serviceId || null,
        pet_name: petName,
        pet_species: petSpecies,
        pets: petsData as any,
        preferred_date: format(values.preferred_date, 'yyyy-MM-dd'),
        preferred_time: values.preferred_time || null,
        notes: values.notes || null,
        is_urgent: values.is_urgent,
        estimated_price: service?.base_price || null,
        source: 'public_form',
        status: 'pending',
      });

      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold">Request Submitted!</h2>
            <p className="text-sm text-muted-foreground">We've received your booking request{service ? ` for ${service.name}` : ''}. You'll hear back from us shortly.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">Book an Appointment</h1>
          {service && (
            <div className="space-y-1">
              <p className="text-primary font-medium">{service.name}</p>
              <p className="text-sm text-muted-foreground">{service.duration_minutes} min • From €{service.base_price}</p>
            </div>
          )}
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Your Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Name *</Label>
                <Input {...form.register('customer_name')} placeholder="Your full name" />
                {form.formState.errors.customer_name && <p className="text-xs text-destructive mt-1">{form.formState.errors.customer_name.message}</p>}
              </div>
              <div>
                <Label>Email *</Label>
                <Input type="email" {...form.register('customer_email')} placeholder="you@example.com" />
                {form.formState.errors.customer_email && <p className="text-xs text-destructive mt-1">{form.formState.errors.customer_email.message}</p>}
              </div>
              <div>
                <Label>Phone</Label>
                <Input {...form.register('customer_phone')} placeholder="+1 234 567 890" />
              </div>
            </CardContent>
          </Card>

          {/* Pets */}
          <Card>
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <CardTitle className="text-base">Your Pets</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ name: '', species: '', breed: '', weight_kg: '', age: '', notes: '' })}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />Add Pet
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.formState.errors.pets?.root && <p className="text-xs text-destructive">{form.formState.errors.pets.root.message}</p>}
              {fields.map((field, index) => (
                <div key={field.id} className="p-3 rounded-lg border bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-1.5"><PawPrint className="w-3.5 h-3.5" />Pet {index + 1}</span>
                    {fields.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} className="h-7 text-destructive hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Name *</Label>
                      <Input {...form.register(`pets.${index}.name`)} placeholder="Pet name" className="h-9" />
                      {form.formState.errors.pets?.[index]?.name && <p className="text-xs text-destructive mt-0.5">{form.formState.errors.pets[index]?.name?.message}</p>}
                    </div>
                    <div>
                      <Label className="text-xs">Species *</Label>
                      <Select value={form.watch(`pets.${index}.species`)} onValueChange={(v) => form.setValue(`pets.${index}.species`, v)}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {speciesOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.pets?.[index]?.species && <p className="text-xs text-destructive mt-0.5">{form.formState.errors.pets[index]?.species?.message}</p>}
                    </div>
                    <div>
                      <Label className="text-xs">Breed</Label>
                      <Input {...form.register(`pets.${index}.breed`)} placeholder="e.g. Golden Retriever" className="h-9" />
                    </div>
                    <div>
                      <Label className="text-xs">Weight (kg)</Label>
                      <Input type="number" step="0.1" {...form.register(`pets.${index}.weight_kg`)} placeholder="0" className="h-9" />
                    </div>
                    <div>
                      <Label className="text-xs">Age</Label>
                      <Input {...form.register(`pets.${index}.age`)} placeholder="e.g. 3 years" className="h-9" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Special Notes</Label>
                    <Textarea {...form.register(`pets.${index}.notes`)} placeholder="Any allergies, behavior notes..." rows={2} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Preferred Schedule</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start", !form.watch('preferred_date') && "text-muted-foreground")}>
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {form.watch('preferred_date') ? format(form.watch('preferred_date'), 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.watch('preferred_date')}
                      onSelect={(d) => d && form.setValue('preferred_date', d, { shouldValidate: true })}
                      disabled={(d) => d < new Date()}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {form.formState.errors.preferred_date && <p className="text-xs text-destructive mt-1">{form.formState.errors.preferred_date.message}</p>}
              </div>
              <div>
                <Label>Preferred Time</Label>
                <Input type="time" {...form.register('preferred_time')} />
              </div>
            </CardContent>
          </Card>

          {/* Notes & Urgent */}
          <Card>
            <CardContent className="pt-5 space-y-3">
              <div>
                <Label>Additional Notes</Label>
                <Textarea {...form.register('notes')} placeholder="Any special requirements..." rows={3} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">Mark as Urgent</p>
                  <p className="text-xs text-muted-foreground">Request priority handling</p>
                </div>
                <Switch checked={form.watch('is_urgent')} onCheckedChange={(v) => form.setValue('is_urgent', v)} />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full h-12 text-base" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Booking Request'}
          </Button>
        </form>
      </div>
    </div>
  );
}

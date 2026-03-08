import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, CalendarIcon, MessageSquare, PawPrint, User, Mail, Phone, Clock, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useStaff, useBookings, useServiceStaff, useInsert, useUpdate } from '@/hooks/use-supabase-data';
import { toast } from 'sonner';

interface Pet {
  name: string;
  species: string;
  breed?: string;
  weight_kg?: number;
  age?: string;
  notes?: string;
}

interface Props {
  request: any;
  open: boolean;
  onClose: () => void;
}

export default function RequestDetailPanel({ request, open, onClose }: Props) {
  const navigate = useNavigate();
  const { data: staff = [] } = useStaff();
  const { data: bookings = [] } = useBookings();
  const { data: serviceStaff = [] } = useServiceStaff();
  const updateRequest = useUpdate('booking_requests');
  const insertBooking = useInsert('bookings');

  const [action, setAction] = useState<'none' | 'accept' | 'decline' | 'reschedule'>('none');
  const [staffId, setStaffId] = useState(request?.assigned_staff_id || '');
  const [price, setPrice] = useState(request?.estimated_price?.toString() || '');
  const [declineReason, setDeclineReason] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState<Date>();
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [responseMsg, setResponseMsg] = useState('');

  if (!request) return null;

  const pets: Pet[] = Array.isArray(request.pets) ? request.pets : [];
  const requestDate = request.preferred_date;

  // Filter staff to those assigned to this service (if any assignments exist)
  const assignedStaffIds = serviceStaff
    .filter((ss: any) => ss.service_id === request.service_id)
    .map((ss: any) => ss.staff_id);

  const qualifiedStaff = assignedStaffIds.length > 0
    ? staff.filter(s => assignedStaffIds.includes(s.id))
    : staff;

  // Staff availability for the requested date
  const staffWithAvailability = qualifiedStaff.map(s => {
    const dayBookings = bookings.filter(b =>
      b.booking_date === requestDate && b.status !== 'cancelled'
    ).length;
    const capacity = s.max_daily_bookings;
    const load = capacity > 0 ? dayBookings / capacity : 0;
    return { ...s, dayBookings, load };
  });

  const handleAccept = () => {
    const selectedStaff = staff.find(s => s.id === staffId);
    const finalPrice = parseFloat(price) || request.estimated_price || 0;

    updateRequest.mutate(
      { id: request.id, status: 'accepted', assigned_staff_id: staffId || null, estimated_price: finalPrice, response_message: responseMsg || null },
      {
        onSuccess: () => {
          // Auto-create booking
          const petName = pets.length > 0 ? pets.map(p => p.name).join(', ') : request.pet_name || 'Unknown';
          const petSpecies = pets.length > 0 ? pets[0].species : request.pet_species || null;
          insertBooking.mutate({
            customer_name: request.customer_name,
            customer_email: request.customer_email,
            pet_name: petName,
            pet_species: petSpecies,
            service_name: request.service_name,
            booking_date: request.preferred_date || new Date().toISOString().split('T')[0],
            start_time: request.preferred_time ? `${request.preferred_date}T${request.preferred_time}` : new Date().toISOString(),
            total_price: finalPrice,
            status: 'confirmed',
            assigned_staff_id: staffId || null,
          });
          toast.success('Request accepted & booking created');
          onClose();
        },
      }
    );
  };

  const handleDecline = () => {
    updateRequest.mutate(
      { id: request.id, status: 'declined', decline_reason: declineReason, response_message: responseMsg || null },
      { onSuccess: () => { toast.success('Request declined'); onClose(); } }
    );
  };

  const handleReschedule = () => {
    const suggestedSlot = rescheduleDate ? `${format(rescheduleDate, 'yyyy-MM-dd')} at ${rescheduleTime || 'TBD'}` : '';
    updateRequest.mutate(
      { id: request.id, status: 'rescheduling', response_message: `Suggested: ${suggestedSlot}. ${responseMsg}`.trim() },
      { onSuccess: () => { toast.success('Reschedule suggestion sent'); onClose(); } }
    );
  };

  const handleChat = () => {
    navigate(`/messages?customer=${encodeURIComponent(request.customer_email || request.customer_name)}`);
    onClose();
  };

  const getLoadColor = (load: number) => load >= 0.8 ? 'text-destructive' : load >= 0.5 ? 'text-warning' : 'text-success';

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left">Request Details</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 mt-4">
          {/* Customer Info */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Customer</h3>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm"><User className="w-4 h-4 text-muted-foreground" />{request.customer_name}</div>
              {request.customer_email && <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-muted-foreground" />{request.customer_email}</div>}
              {request.customer_phone && <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-muted-foreground" />{request.customer_phone}</div>}
            </div>
          </div>

          <Separator />

          {/* Service & Schedule */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Service</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{request.service_name}</Badge>
              {request.preferred_date && <Badge variant="outline"><CalendarIcon className="w-3 h-3 mr-1" />{request.preferred_date}</Badge>}
              {request.preferred_time && <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />{request.preferred_time}</Badge>}
              {request.is_urgent && <Badge className="bg-destructive/10 text-destructive">Urgent</Badge>}
              {request.source && request.source !== 'manual' && <Badge variant="outline" className="capitalize">{request.source.replace('_', ' ')}</Badge>}
            </div>
            {request.estimated_price && (
              <div className="flex items-center gap-2 text-sm"><DollarSign className="w-4 h-4 text-muted-foreground" />Estimated: €{Number(request.estimated_price).toFixed(2)}</div>
            )}
          </div>

          <Separator />

          {/* Pets */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pets ({pets.length > 0 ? pets.length : request.pet_name ? 1 : 0})</h3>
            {pets.length > 0 ? (
              <div className="space-y-2">
                {pets.map((pet, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                    <div className="flex items-center gap-2 font-medium"><PawPrint className="w-3.5 h-3.5" />{pet.name} <span className="text-muted-foreground">({pet.species})</span></div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {pet.breed && <span>Breed: {pet.breed}</span>}
                      {pet.weight_kg && <span>Weight: {pet.weight_kg}kg</span>}
                      {pet.age && <span>Age: {pet.age}</span>}
                    </div>
                    {pet.notes && <p className="text-xs text-muted-foreground italic">{pet.notes}</p>}
                  </div>
                ))}
              </div>
            ) : request.pet_name ? (
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <div className="flex items-center gap-2"><PawPrint className="w-3.5 h-3.5" />{request.pet_name} {request.pet_species && `(${request.pet_species})`}</div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No pet info provided</p>
            )}
          </div>

          {request.notes && (
            <>
              <Separator />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Notes</h3>
                <p className="text-sm">{request.notes}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Actions */}
          {request.status === 'pending' || request.status === 'rescheduling' ? (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Actions</h3>

              {action === 'none' && (
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => setAction('accept')} className="h-10"><CheckCircle className="w-4 h-4 mr-1.5" />Accept</Button>
                  <Button variant="destructive" onClick={() => setAction('decline')} className="h-10"><XCircle className="w-4 h-4 mr-1.5" />Decline</Button>
                  <Button variant="outline" onClick={() => setAction('reschedule')} className="h-10 col-span-2"><CalendarIcon className="w-4 h-4 mr-1.5" />Suggest New Time</Button>
                  <Button variant="secondary" onClick={handleChat} className="h-10 col-span-2"><MessageSquare className="w-4 h-4 mr-1.5" />Chat with Customer</Button>
                </div>
              )}

              {action === 'accept' && (
                <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
                  <h4 className="text-sm font-medium">Confirm Acceptance</h4>
                  <div>
                    <label className="text-xs text-muted-foreground">Assign Staff</label>
                    <Select value={staffId} onValueChange={setStaffId}>
                      <SelectTrigger><SelectValue placeholder="Select staff member" /></SelectTrigger>
                      <SelectContent>
                        {staffWithAvailability.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            <span className="flex items-center gap-2">
                              {s.full_name}
                              <span className={cn("text-xs", getLoadColor(s.load))}>
                                ({s.dayBookings}/{s.max_daily_bookings})
                              </span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Price (€)</label>
                    <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" />
                  </div>
                  <Textarea placeholder="Optional message to customer..." value={responseMsg} onChange={e => setResponseMsg(e.target.value)} rows={2} />
                  <div className="flex gap-2">
                    <Button onClick={handleAccept} disabled={updateRequest.isPending} className="flex-1">Confirm & Create Booking</Button>
                    <Button variant="outline" onClick={() => setAction('none')}>Back</Button>
                  </div>
                </div>
              )}

              {action === 'decline' && (
                <div className="space-y-3 p-3 rounded-lg border bg-destructive/5">
                  <h4 className="text-sm font-medium">Decline Request</h4>
                  <Textarea placeholder="Reason for declining..." value={declineReason} onChange={e => setDeclineReason(e.target.value)} rows={2} />
                  <Textarea placeholder="Optional message to customer..." value={responseMsg} onChange={e => setResponseMsg(e.target.value)} rows={2} />
                  <div className="flex gap-2">
                    <Button variant="destructive" onClick={handleDecline} disabled={updateRequest.isPending} className="flex-1">Confirm Decline</Button>
                    <Button variant="outline" onClick={() => setAction('none')}>Back</Button>
                  </div>
                </div>
              )}

              {action === 'reschedule' && (
                <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
                  <h4 className="text-sm font-medium">Suggest Alternative Time</h4>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start", !rescheduleDate && "text-muted-foreground")}>
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {rescheduleDate ? format(rescheduleDate, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={rescheduleDate} onSelect={setRescheduleDate} className="p-3 pointer-events-auto" disabled={(d) => d < new Date()} />
                    </PopoverContent>
                  </Popover>
                  <Input type="time" value={rescheduleTime} onChange={e => setRescheduleTime(e.target.value)} />
                  <Textarea placeholder="Message to customer..." value={responseMsg} onChange={e => setResponseMsg(e.target.value)} rows={2} />
                  <div className="flex gap-2">
                    <Button onClick={handleReschedule} disabled={updateRequest.isPending || !rescheduleDate} className="flex-1">Send Suggestion</Button>
                    <Button variant="outline" onClick={() => setAction('none')}>Back</Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Status</h3>
              <Badge className={request.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : request.status === 'declined' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </Badge>
              {request.decline_reason && <p className="text-sm text-muted-foreground">Reason: {request.decline_reason}</p>}
              {request.response_message && <p className="text-sm text-muted-foreground">Response: {request.response_message}</p>}
              <Button variant="secondary" onClick={handleChat} className="w-full mt-2"><MessageSquare className="w-4 h-4 mr-1.5" />Chat with Customer</Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { User, PawPrint, Calendar, Clock, MessageSquare, CheckCircle, XCircle, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBookingRequests, useUpdate } from '@/hooks/use-supabase-data';
import { toast } from 'sonner';

const statusStyles: Record<string, { bg: string; badge: string; label: string }> = {
  pending: { bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700', label: 'Pending' },
  accepted: { bg: 'bg-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', label: 'Accepted' },
  declined: { bg: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-700', label: 'Declined' },
};

export default function BookingRequestsPage() {
  const { data: requests = [], isLoading } = useBookingRequests();
  const updateRequest = useUpdate('booking_requests');
  const [tabFilter, setTabFilter] = useState('pending');
  const [actionModal, setActionModal] = useState<{ open: boolean; request: any; action: string }>({ open: false, request: null, action: '' });
  const [responseMsg, setResponseMsg] = useState('');

  const handleAction = (action: string) => {
    const req = actionModal.request;
    if (!req) return;
    const newStatus = action === 'accept' ? 'accepted' : 'declined';
    updateRequest.mutate({ id: req.id, status: newStatus }, {
      onSuccess: () => {
        toast.success(action === 'accept' ? 'Request accepted' : 'Request declined');
        setActionModal({ open: false, request: null, action: '' });
        setResponseMsg('');
      },
    });
  };

  const filtered = requests.filter(r => tabFilter === 'all' || r.status === tabFilter);

  if (isLoading) return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading requests...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Booking Requests</h1>
        <p className="text-sm text-muted-foreground">{requests.filter(r => r.status === 'pending').length} pending requests</p>
      </div>

      <div className="flex gap-2">
        {[{ key: 'pending', label: 'Pending' }, { key: 'accepted', label: 'Accepted' }, { key: 'declined', label: 'Declined' }, { key: 'all', label: 'All' }].map(t => (
          <Button key={t.key} variant={tabFilter === t.key ? 'default' : 'outline'} size="sm" onClick={() => setTabFilter(t.key)}>{t.label}</Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-16 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No {tabFilter} requests</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const style = statusStyles[req.status] || statusStyles.pending;
            return (
              <Card key={req.id} className={cn("border", style.bg)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-semibold">{req.customer_name[0]}</div>
                      <div><p className="text-sm font-semibold">{req.customer_name}</p><p className="text-xs text-muted-foreground">{req.customer_email}</p></div>
                    </div>
                    <div className="flex items-center gap-2">
                      {req.is_urgent && <Badge className="bg-red-100 text-red-700 text-[10px]">Urgent</Badge>}
                      <Badge className={cn("text-[10px]", style.badge)}>{style.label}</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                    <div className="flex items-center gap-2 text-muted-foreground"><PawPrint className="w-4 h-4" /><span>{req.pet_name} ({req.pet_species})</span></div>
                    <div className="flex items-center gap-2 text-muted-foreground"><Clock className="w-4 h-4" /><span>{req.service_name}</span></div>
                    <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="w-4 h-4" /><span>{req.preferred_date}</span></div>
                    {req.notes && <div className="flex items-center gap-2 text-muted-foreground"><MessageSquare className="w-4 h-4" /><span className="truncate">{req.notes}</span></div>}
                  </div>
                  {req.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setActionModal({ open: true, request: req, action: 'accept' })}><CheckCircle className="w-4 h-4 mr-1" /> Accept</Button>
                      <Button size="sm" variant="destructive" onClick={() => setActionModal({ open: true, request: req, action: 'decline' })}><XCircle className="w-4 h-4 mr-1" /> Decline</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={actionModal.open} onOpenChange={(open) => setActionModal(m => ({ ...m, open }))}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{actionModal.action === 'accept' ? 'Accept Request' : 'Decline Request'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">{actionModal.action === 'accept' ? 'Confirm this booking request?' : 'Are you sure you want to decline?'}</p>
            <Textarea placeholder="Optional response message..." value={responseMsg} onChange={(e) => setResponseMsg(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionModal({ open: false, request: null, action: '' })}>Cancel</Button>
            <Button onClick={() => handleAction(actionModal.action)} variant={actionModal.action === 'decline' ? 'destructive' : 'default'}>{actionModal.action === 'accept' ? 'Accept' : 'Decline'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

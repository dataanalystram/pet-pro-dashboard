import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, PawPrint, Calendar, Clock, MessageSquare, Inbox, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBookingRequests, useStaff, useBookings } from '@/hooks/use-supabase-data';
import { formatDistanceToNow } from 'date-fns';
import RequestStatsRow from './components/RequestStatsRow';
import RequestDetailPanel from './components/RequestDetailPanel';

const statusStyles: Record<string, { bg: string; badge: string; label: string }> = {
  pending: { bg: 'border-amber-200/60 bg-card', badge: 'bg-amber-100 text-amber-700', label: 'Pending' },
  accepted: { bg: 'border-emerald-200/60 bg-card', badge: 'bg-emerald-100 text-emerald-700', label: 'Accepted' },
  declined: { bg: 'border-red-200/60 bg-card', badge: 'bg-red-100 text-red-700', label: 'Declined' },
  rescheduling: { bg: 'border-blue-200/60 bg-card', badge: 'bg-blue-100 text-blue-700', label: 'Rescheduling' },
};

export default function BookingRequestsPage() {
  const { data: requests = [], isLoading } = useBookingRequests();
  const { data: staff = [] } = useStaff();
  const { data: bookings = [] } = useBookings();
  const [tabFilter, setTabFilter] = useState('pending');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week'>('all');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const now = new Date();
  const filtered = requests.filter(r => {
    if (tabFilter !== 'all' && r.status !== tabFilter) return false;
    if (timeFilter === 'today') {
      return new Date(r.created_at).toDateString() === now.toDateString();
    }
    if (timeFilter === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(r.created_at) >= weekAgo;
    }
    return true;
  });

  // Staff availability helper
  const getStaffLoad = (date: string | null) => {
    if (!date) return null;
    const dayBookings = bookings.filter(b => b.booking_date === date && b.status !== 'cancelled').length;
    const totalCapacity = staff.reduce((sum, s) => sum + s.max_daily_bookings, 0);
    if (totalCapacity === 0) return null;
    return dayBookings / totalCapacity;
  };

  if (isLoading) return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading requests...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Booking Requests</h1>
          <p className="text-sm text-muted-foreground">{requests.filter(r => r.status === 'pending').length} pending requests</p>
        </div>
      </div>

      <RequestStatsRow requests={requests} />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[{ key: 'pending', label: 'Pending' }, { key: 'accepted', label: 'Accepted' }, { key: 'declined', label: 'Declined' }, { key: 'rescheduling', label: 'Rescheduling' }, { key: 'all', label: 'All' }].map(t => (
          <Button key={t.key} variant={tabFilter === t.key ? 'default' : 'outline'} size="sm" onClick={() => setTabFilter(t.key)} className="flex-shrink-0">{t.label}</Button>
        ))}
        <div className="w-px bg-border mx-1 hidden sm:block" />
        {[{ key: 'all' as const, label: 'All Time' }, { key: 'today' as const, label: 'Today' }, { key: 'week' as const, label: 'This Week' }].map(t => (
          <Button key={t.key} variant={timeFilter === t.key ? 'secondary' : 'ghost'} size="sm" onClick={() => setTimeFilter(t.key)} className="flex-shrink-0 text-xs">{t.label}</Button>
        ))}
      </div>

      {/* Request List */}
      {filtered.length === 0 ? (
        <Card><CardContent className="py-16 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No {tabFilter !== 'all' ? tabFilter : ''} requests {timeFilter !== 'all' ? `(${timeFilter})` : ''}</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const style = statusStyles[req.status] || statusStyles.pending;
            const pets: any[] = Array.isArray(req.pets) ? req.pets : [];
            const petCount = pets.length || (req.pet_name ? 1 : 0);
            const load = getStaffLoad(req.preferred_date);
            const age = formatDistanceToNow(new Date(req.created_at), { addSuffix: true });
            const isOld = Date.now() - new Date(req.created_at).getTime() > 24 * 60 * 60 * 1000;

            return (
              <Card
                key={req.id}
                className={cn("border cursor-pointer transition-shadow hover:shadow-md", style.bg)}
                onClick={() => setSelectedRequest(req)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {req.customer_name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{req.customer_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{req.customer_email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                      {req.is_urgent && <Badge className="bg-destructive/10 text-destructive text-[10px]">Urgent</Badge>}
                      <Badge className={cn("text-[10px]", style.badge)}>{style.label}</Badge>
                      {req.source && req.source !== 'manual' && (
                        <Badge variant="outline" className="text-[10px] capitalize"><ExternalLink className="w-2.5 h-2.5 mr-0.5" />{req.source.replace('_', ' ')}</Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm mb-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <PawPrint className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">
                        {petCount > 1
                          ? `${petCount} pets`
                          : pets.length === 1
                            ? `${pets[0].name} (${pets[0].species})`
                            : req.pet_name
                              ? `${req.pet_name} (${req.pet_species || ''})`
                              : 'No pet info'
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{req.service_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{req.preferred_date || 'No date'}{req.preferred_time ? ` @ ${req.preferred_time}` : ''}</span>
                    </div>
                    {/* Staff capacity indicator */}
                    {load !== null && req.status === 'pending' && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className={cn("w-2 h-2 rounded-full flex-shrink-0",
                          load >= 0.8 ? 'bg-destructive' : load >= 0.5 ? 'bg-warning' : 'bg-success'
                        )} />
                        <span className="text-muted-foreground text-xs">{load >= 0.8 ? 'Busy' : load >= 0.5 ? 'Moderate' : 'Available'}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={cn("text-xs", isOld && req.status === 'pending' ? 'text-destructive font-medium' : 'text-muted-foreground')}>
                      {age}
                    </span>
                    {req.estimated_price && (
                      <span className="text-xs font-medium text-foreground">€{Number(req.estimated_price).toFixed(2)}</span>
                    )}
                    {req.notes && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MessageSquare className="w-3 h-3" />
                        <span className="text-xs truncate max-w-[120px]">{req.notes}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <RequestDetailPanel
        request={selectedRequest}
        open={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
      />
    </div>
  );
}

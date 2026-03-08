import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, LogIn, Play, CheckCircle, XCircle, Ban, Users, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-violet-100 text-violet-700 border-violet-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

const borderColors: Record<string, string> = {
  pending: 'border-l-amber-500',
  confirmed: 'border-l-blue-500',
  in_progress: 'border-l-violet-500',
  completed: 'border-l-emerald-500',
  cancelled: 'border-l-red-500',
};

const sourceLabels: Record<string, string> = {
  online: 'Online',
  walk_in: 'Walk-in',
  phone: 'Phone',
};

interface TodayQueueProps {
  bookings: any[];
  staff: any[];
  onSelect: (booking: any) => void;
  onUpdateStatus: (id: string, status: string, extras?: Record<string, any>) => void;
}

export default function TodayQueue({ bookings, staff, onSelect, onUpdateStatus }: TodayQueueProps) {
  const sorted = [...bookings].sort((a, b) => a.start_time.localeCompare(b.start_time));

  if (sorted.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-16 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No appointments today</p>
          <p className="text-xs text-muted-foreground mt-1">Add a walk-in or wait for online bookings</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map((b) => {
        const staffName = b.assigned_staff_id ? staff.find((s: any) => s.id === b.assigned_staff_id)?.full_name : null;
        const isNoShow = b.no_show;

        return (
          <Card
            key={b.id}
            className={cn(
              'border-l-4 cursor-pointer hover:shadow-md transition-shadow',
              isNoShow ? 'border-l-red-500 opacity-60' : borderColors[b.status] || 'border-l-muted'
            )}
            onClick={() => onSelect(b)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-mono text-muted-foreground">
                      {(() => { try { return format(new Date(b.start_time), 'HH:mm'); } catch { return '--:--'; } })()}
                    </span>
                    <span className="text-sm font-semibold truncate">{b.service_name}</span>
                    <Badge className={cn('text-[10px]', statusColors[b.status])}>
                      {isNoShow ? 'No-Show' : b.status?.replace('_', ' ')}
                    </Badge>
                    {b.source && b.source !== 'online' && (
                      <Badge variant="outline" className="text-[10px]">{sourceLabels[b.source] || b.source}</Badge>
                    )}
                    {b.payment_status === 'paid' && (
                      <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200">
                        <CreditCard className="w-2.5 h-2.5 mr-0.5" />Paid
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {b.customer_name} · {b.pet_name}
                    {b.pet_species && ` (${b.pet_species})`}
                    {staffName && (
                      <span className="text-primary ml-1">
                        <Users className="w-2.5 h-2.5 inline" /> {staffName}
                      </span>
                    )}
                  </p>
                  {b.notes && <p className="text-xs text-muted-foreground mt-1 italic truncate">"{b.notes}"</p>}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  {b.status === 'pending' && (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onUpdateStatus(b.id, 'confirmed')}>
                      Confirm
                    </Button>
                  )}
                  {b.status === 'confirmed' && !b.check_in_time && (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onUpdateStatus(b.id, 'confirmed', { check_in_time: new Date().toISOString() })}>
                      <LogIn className="w-3 h-3 mr-1" />Check In
                    </Button>
                  )}
                  {(b.status === 'confirmed' && b.check_in_time) && (
                    <Button size="sm" className="h-7 text-xs" onClick={() => onUpdateStatus(b.id, 'in_progress')}>
                      <Play className="w-3 h-3 mr-1" />Start
                    </Button>
                  )}
                  {b.status === 'in_progress' && (
                    <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => onUpdateStatus(b.id, 'completed', { check_out_time: new Date().toISOString() })}>
                      <CheckCircle className="w-3 h-3 mr-1" />Complete
                    </Button>
                  )}
                  {['pending', 'confirmed'].includes(b.status) && !isNoShow && (
                    <>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600" onClick={() => onUpdateStatus(b.id, b.status, { no_show: true })}>
                        <XCircle className="w-3 h-3 mr-1" />No-Show
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => onUpdateStatus(b.id, 'cancelled')}>
                        <Ban className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

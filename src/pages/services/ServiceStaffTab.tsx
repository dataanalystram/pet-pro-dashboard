import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Star, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StaffAssignment {
  staff_id: string;
  is_primary: boolean;
  price_override: string;
}

interface Props {
  staff: any[];
  bookings: any[];
  assignments: StaffAssignment[];
  serviceDays: string[];
  onAssignmentsChange: (assignments: StaffAssignment[]) => void;
}

export default function ServiceStaffTab({ staff, bookings, assignments, serviceDays, onAssignmentsChange }: Props) {
  const today = new Date().toISOString().split('T')[0];

  const toggleStaff = (staffId: string) => {
    const existing = assignments.find(a => a.staff_id === staffId);
    if (existing) {
      onAssignmentsChange(assignments.filter(a => a.staff_id !== staffId));
    } else {
      onAssignmentsChange([...assignments, { staff_id: staffId, is_primary: assignments.length === 0, price_override: '' }]);
    }
  };

  const setPrimary = (staffId: string) => {
    onAssignmentsChange(assignments.map(a => ({ ...a, is_primary: a.staff_id === staffId })));
  };

  const setPriceOverride = (staffId: string, price: string) => {
    onAssignmentsChange(assignments.map(a => a.staff_id === staffId ? { ...a, price_override: price } : a));
  };

  const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="space-y-4">
      <div>
        <Label>Assign Staff Members</Label>
        <p className="text-xs text-muted-foreground mt-0.5">Select which team members can perform this service</p>
      </div>

      {staff.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">No staff members found. Add staff first.</p>
      ) : (
        <div className="space-y-2">
          {staff.map(s => {
            const assignment = assignments.find(a => a.staff_id === s.id);
            const isAssigned = !!assignment;
            const todayBookings = bookings.filter(b => b.booking_date === today && b.status !== 'cancelled').length;
            const loadPct = Math.round((todayBookings / s.max_daily_bookings) * 100);
            const wh = s.working_hours || {};

            // Check overlap with service available days
            const staffDays = dayKeys.filter(d => wh[d] && !wh[d].off);
            const overlap = serviceDays.filter(d => staffDays.includes(d));
            const overlapPct = serviceDays.length > 0 ? Math.round((overlap.length / serviceDays.length) * 100) : 0;

            return (
              <div
                key={s.id}
                className={cn(
                  "rounded-lg border p-3 transition-colors cursor-pointer",
                  isAssigned ? "border-primary bg-primary/5" : "hover:border-muted-foreground/30"
                )}
                onClick={() => toggleStaff(s.id)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox checked={isAssigned} className="mt-0.5" onCheckedChange={() => toggleStaff(s.id)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{s.full_name}</span>
                        {s.status !== 'active' && (
                          <Badge variant="secondary" className="text-[10px]">{s.status?.replace('_', ' ')}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-amber-500" />
                          <span className="text-xs">{Number(s.average_rating).toFixed(1)}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className={cn("text-xs", loadPct >= 80 ? 'text-destructive' : loadPct >= 50 ? 'text-amber-600' : 'text-emerald-600')}>
                            {todayBookings}/{s.max_daily_bookings}
                          </span>
                        </div>
                      </div>
                    </div>

                    {s.specializations?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {s.specializations.slice(0, 4).map((sp: string) => (
                          <span key={sp} className="text-[10px] bg-secondary text-secondary-foreground rounded-full px-1.5 py-0.5 capitalize">{sp}</span>
                        ))}
                      </div>
                    )}

                    {/* Availability overlap indicator */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 bg-muted rounded-full h-1">
                        <div
                          className={cn("h-1 rounded-full", overlapPct >= 80 ? 'bg-emerald-500' : overlapPct >= 50 ? 'bg-amber-500' : 'bg-destructive')}
                          style={{ width: `${overlapPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{overlapPct}% schedule overlap</span>
                    </div>

                    {isAssigned && (
                      <div className="flex items-center gap-3 mt-2 pt-2 border-t" onClick={e => e.stopPropagation()}>
                        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                          <Checkbox
                            checked={assignment?.is_primary || false}
                            onCheckedChange={() => setPrimary(s.id)}
                          />
                          <span>Primary</span>
                        </label>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">Price override:</span>
                          <Input
                            type="number"
                            value={assignment?.price_override || ''}
                            onChange={e => setPriceOverride(s.id, e.target.value)}
                            placeholder="Default"
                            className="h-7 w-24 text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {assignments.length > 0 && (
        <div className="rounded-lg bg-accent/50 p-3 text-xs text-muted-foreground">
          {assignments.length} staff assigned · {assignments.find(a => a.is_primary)
            ? `Primary: ${staff.find(s => s.id === assignments.find(a => a.is_primary)?.staff_id)?.full_name || 'Unknown'}`
            : 'No primary set'}
        </div>
      )}
    </div>
  );
}

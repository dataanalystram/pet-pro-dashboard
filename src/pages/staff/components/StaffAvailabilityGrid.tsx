import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { parseISO, isWithinInterval, addDays, format, startOfWeek, startOfMonth, getDaysInMonth, addMonths, getDay } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useUpdate } from '@/hooks/use-supabase-data';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Search, CalendarDays, CalendarRange } from 'lucide-react';

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const roleOptions = [
  { value: 'all', label: 'All Roles' },
  { value: 'owner', label: 'Owner' },
  { value: 'manager', label: 'Manager' },
  { value: 'staff', label: 'Staff' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contractor', label: 'Contractor' },
];

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'inactive', label: 'Inactive' },
];

interface Props {
  staff: any[];
  bookings: any[];
  timeOff?: any[];
}

interface CellEditState {
  staffId: string;
  dayKey: string;
  off: boolean;
  start: string;
  end: string;
}

function getWeekDates(offset: number) {
  const now = new Date();
  const monday = startOfWeek(now, { weekStartsOn: 1 });
  const shifted = addDays(monday, offset * 7);
  return Array.from({ length: 7 }, (_, i) => format(addDays(shifted, i), 'yyyy-MM-dd'));
}

function getMonthData(monthOffset: number) {
  const now = new Date();
  const monthStart = startOfMonth(addMonths(now, monthOffset));
  const daysInMonth = getDaysInMonth(monthStart);
  const startDayOfWeek = getDay(monthStart); // 0 = Sunday
  const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Convert to Monday-based
  
  const dates: string[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    dates.push(format(new Date(monthStart.getFullYear(), monthStart.getMonth(), i), 'yyyy-MM-dd'));
  }
  
  return {
    dates,
    monthLabel: format(monthStart, 'MMMM yyyy'),
    daysInMonth,
    startPadding: adjustedStartDay,
  };
}

export default function StaffAvailabilityGrid({ staff, bookings, timeOff = [] }: Props) {
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editCell, setEditCell] = useState<CellEditState | null>(null);
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  // Drag-to-assign state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStaffId, setDragStaffId] = useState<string | null>(null);
  const [dragStartIdx, setDragStartIdx] = useState<number>(-1);
  const [dragEndIdx, setDragEndIdx] = useState<number>(-1);
  const [dragMode, setDragMode] = useState<'off' | 'on'>('off'); // toggle direction
  
  const updateStaff = useUpdate('staff');

  const weekDates = getWeekDates(weekOffset);
  const monthData = getMonthData(monthOffset);
  const weekLabel = `${format(parseISO(weekDates[0]), 'MMM d')} – ${format(parseISO(weekDates[6]), 'MMM d, yyyy')}`;

  // Filter staff based on role, status, and search
  const filteredStaff = useMemo(() => {
    return staff.filter(s => {
      const matchesRole = roleFilter === 'all' || s.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchesSearch = !searchQuery || 
        s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesRole && matchesStatus && matchesSearch;
    });
  }, [staff, roleFilter, statusFilter, searchQuery]);

  const isOnLeave = (staffId: string, dateStr: string) => {
    return timeOff.some((t: any) => {
      if (t.staff_id !== staffId || t.status !== 'approved') return false;
      try {
        return isWithinInterval(parseISO(dateStr), { start: parseISO(t.start_date), end: parseISO(t.end_date) });
      } catch { return false; }
    });
  };

  const getBookingCount = (staffId: string, dateStr: string) => {
    return bookings.filter(b => 
      b.assigned_staff_id === staffId && 
      b.booking_date === dateStr && 
      b.status !== 'cancelled'
    ).length;
  };

  const openEditor = (s: any, dayKey: string) => {
    const wh = s.working_hours || {};
    const dayData = wh[dayKey];
    const isOff = !dayData || dayData.off !== false;
    setEditCell({
      staffId: s.id,
      dayKey,
      off: isOff,
      start: dayData?.start || '09:00',
      end: dayData?.end || '17:00',
    });
    setOpenPopover(`${s.id}-${dayKey}`);
  };

  const saveCell = (s: any) => {
    if (!editCell) return;
    const wh = { ...(s.working_hours || {}) };
    wh[editCell.dayKey] = {
      off: editCell.off,
      start: editCell.off ? '' : editCell.start,
      end: editCell.off ? '' : editCell.end,
    };
    updateStaff.mutate({ id: s.id, working_hours: wh }, {
      onSuccess: () => {
        toast.success(`Updated ${s.full_name}'s ${editCell.dayKey} schedule`);
        setOpenPopover(null);
        setEditCell(null);
      },
    });
  };

  const getCellStatus = (s: any, dateStr: string, dayKey: string) => {
    const wh = s.working_hours || {};
    const dayData = wh[dayKey];
    const isOff = dayData?.off !== false || !dayData;
    const onLeave = isOnLeave(s.id, dateStr);
    const dayBookings = getBookingCount(s.id, dateStr);
    const load = isOff ? -1 : dayBookings / s.max_daily_bookings;
    
    return { isOff, onLeave, dayBookings, load };
  };

  // Drag handlers for weekly view
  const handleDragStart = (staffId: string, dayIdx: number, isCurrentlyOff: boolean) => {
    setIsDragging(true);
    setDragStaffId(staffId);
    setDragStartIdx(dayIdx);
    setDragEndIdx(dayIdx);
    setDragMode(isCurrentlyOff ? 'on' : 'off'); // if currently off, drag will turn on, vice versa
  };

  const handleDragEnter = (dayIdx: number) => {
    if (isDragging) setDragEndIdx(dayIdx);
  };

  const handleDragEnd = () => {
    if (!isDragging || !dragStaffId) { resetDrag(); return; }
    const s = staff.find((st: any) => st.id === dragStaffId);
    if (!s) { resetDrag(); return; }

    const minIdx = Math.min(dragStartIdx, dragEndIdx);
    const maxIdx = Math.max(dragStartIdx, dragEndIdx);
    const wh = { ...(s.working_hours || {}) };

    for (let i = minIdx; i <= maxIdx; i++) {
      const dk = dayKeys[i];
      if (dragMode === 'off') {
        wh[dk] = { off: true, start: '', end: '' };
      } else {
        wh[dk] = { off: false, start: wh[dk]?.start || '09:00', end: wh[dk]?.end || '17:00' };
      }
    }

    updateStaff.mutate({ id: s.id, working_hours: wh }, {
      onSuccess: () => {
        const count = maxIdx - minIdx + 1;
        toast.success(`${dragMode === 'off' ? 'Set off' : 'Set working'}: ${count} day${count > 1 ? 's' : ''} for ${s.full_name}`);
      },
    });
    resetDrag();
  };

  const resetDrag = () => {
    setIsDragging(false);
    setDragStaffId(null);
    setDragStartIdx(-1);
    setDragEndIdx(-1);
  };

  const isDayInDragRange = (staffId: string, dayIdx: number) => {
    if (!isDragging || dragStaffId !== staffId) return false;
    const minIdx = Math.min(dragStartIdx, dragEndIdx);
    const maxIdx = Math.max(dragStartIdx, dragEndIdx);
    return dayIdx >= minIdx && dayIdx <= maxIdx;
  };

  const renderWeeklyView = () => (
    <div className="min-w-[600px]" onMouseUp={handleDragEnd} onMouseLeave={handleDragEnd}>
      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-3">
        <Button variant="outline" size="sm" onClick={() => setWeekOffset(o => o - 1)}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Prev
        </Button>
        <div className="text-center">
          <p className="text-sm font-semibold">{weekLabel}</p>
          {weekOffset !== 0 && (
            <button className="text-xs text-primary hover:underline" onClick={() => setWeekOffset(0)}>Today</button>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => setWeekOffset(o => o + 1)}>
          Next <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Header */}
      <div className="grid gap-1" style={{ gridTemplateColumns: `160px repeat(7, 1fr)` }}>
        <div className="p-2 text-xs font-medium text-muted-foreground">Staff ({filteredStaff.length})</div>
        {dayLabels.map((d, i) => (
          <div key={d} className="p-2 text-center">
            <p className="text-xs font-medium">{d}</p>
            <p className="text-[10px] text-muted-foreground">{weekDates[i]?.slice(5)}</p>
          </div>
        ))}
      </div>

      {/* Rows */}
      {filteredStaff.map(s => {
        const wh = s.working_hours || {};
        return (
          <div key={s.id} className="grid gap-1 mb-1" style={{ gridTemplateColumns: `160px repeat(7, 1fr)` }}>
            <div className="p-2 flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full flex-shrink-0",
                s.status === 'active' ? 'bg-emerald-500' : s.status === 'on_leave' ? 'bg-amber-500' : 'bg-muted-foreground'
              )} />
              <span className="text-sm font-medium truncate">{s.full_name}</span>
            </div>
            {dayKeys.map((day, i) => {
              const { isOff, onLeave, dayBookings, load } = getCellStatus(s, weekDates[i], day);
              const dayData = wh[day];
              const cellKey = `${s.id}-${day}`;

              return (
                <Popover
                  key={day}
                  open={openPopover === cellKey}
                  onOpenChange={(open) => {
                    if (!open) { setOpenPopover(null); setEditCell(null); }
                  }}
                >
                  <PopoverTrigger asChild>
                    <button
                      onClick={() => openEditor(s, day)}
                      className={cn(
                        "rounded-lg p-2 text-center text-xs transition-colors relative cursor-pointer hover:ring-2 hover:ring-primary/30",
                        onLeave ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' :
                        isOff ? 'bg-muted/50 text-muted-foreground' :
                        load >= 0.8 ? 'bg-destructive/15 text-destructive' :
                        load >= 0.5 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      )}
                    >
                      {onLeave ? '🏖️' : isOff ? 'Off' : `${dayBookings}/${s.max_daily_bookings}`}
                      {!onLeave && !isOff && dayData && (
                        <p className="text-[9px] opacity-70 mt-0.5">{dayData.start}–{dayData.end}</p>
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-3" align="center">
                    {editCell && editCell.staffId === s.id && editCell.dayKey === day && (
                      <div className="space-y-3">
                        <p className="text-xs font-semibold">{s.full_name} — {dayLabels[i]}</p>
                        {onLeave && (
                          <p className="text-[10px] text-violet-600 bg-violet-50 dark:bg-violet-900/20 rounded px-2 py-1">🏖️ On approved leave</p>
                        )}
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Day Off</Label>
                          <Switch
                            checked={editCell.off}
                            onCheckedChange={(v) => setEditCell(prev => prev ? { ...prev, off: v } : null)}
                          />
                        </div>
                        {!editCell.off && (
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-[10px]">Start</Label>
                              <Input
                                type="time"
                                value={editCell.start}
                                onChange={(e) => setEditCell(prev => prev ? { ...prev, start: e.target.value } : null)}
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px]">End</Label>
                              <Input
                                type="time"
                                value={editCell.end}
                                onChange={(e) => setEditCell(prev => prev ? { ...prev, end: e.target.value } : null)}
                                className="h-8 text-xs"
                              />
                            </div>
                          </div>
                        )}
                        <Button size="sm" className="w-full h-7 text-xs" onClick={() => saveCell(s)}>
                          Save
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              );
            })}
          </div>
        );
      })}
    </div>
  );

  const renderMonthlyView = () => (
    <div className="min-w-[800px]">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-3">
        <Button variant="outline" size="sm" onClick={() => setMonthOffset(o => o - 1)}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Prev
        </Button>
        <div className="text-center">
          <p className="text-sm font-semibold">{monthData.monthLabel}</p>
          {monthOffset !== 0 && (
            <button className="text-xs text-primary hover:underline" onClick={() => setMonthOffset(0)}>This Month</button>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => setMonthOffset(o => o + 1)}>
          Next <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Header - Day numbers */}
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `140px repeat(${monthData.daysInMonth}, 1fr)` }}>
        <div className="p-1 text-xs font-medium text-muted-foreground">Staff ({filteredStaff.length})</div>
        {monthData.dates.map((date, i) => {
          const dayOfWeek = (monthData.startPadding + i) % 7;
          const isWeekend = dayOfWeek >= 5;
          return (
            <div key={date} className={cn(
              "p-0.5 text-center text-[10px] font-medium",
              isWeekend ? 'text-muted-foreground' : ''
            )}>
              {i + 1}
            </div>
          );
        })}
      </div>

      {/* Day labels row */}
      <div className="grid gap-0.5 mb-1" style={{ gridTemplateColumns: `140px repeat(${monthData.daysInMonth}, 1fr)` }}>
        <div />
        {monthData.dates.map((date, i) => {
          const dayOfWeek = (monthData.startPadding + i) % 7;
          return (
            <div key={`label-${date}`} className="text-center text-[8px] text-muted-foreground">
              {dayLabels[dayOfWeek]?.[0]}
            </div>
          );
        })}
      </div>

      {/* Staff rows */}
      {filteredStaff.map(s => (
        <div key={s.id} className="grid gap-0.5 mb-0.5" style={{ gridTemplateColumns: `140px repeat(${monthData.daysInMonth}, 1fr)` }}>
          <div className="p-1 flex items-center gap-1.5 truncate">
            <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0",
              s.status === 'active' ? 'bg-emerald-500' : s.status === 'on_leave' ? 'bg-amber-500' : 'bg-muted-foreground'
            )} />
            <span className="text-[11px] font-medium truncate">{s.full_name}</span>
          </div>
          {monthData.dates.map((date, i) => {
            const dayOfWeek = (monthData.startPadding + i) % 7;
            const dayKey = dayKeys[dayOfWeek];
            const { isOff, onLeave, load } = getCellStatus(s, date, dayKey);
            const cellKey = `${s.id}-${dayKey}-${date}`;

            return (
              <Popover
                key={cellKey}
                open={openPopover === cellKey}
                onOpenChange={(open) => {
                  if (!open) { setOpenPopover(null); setEditCell(null); }
                }}
              >
                <PopoverTrigger asChild>
                  <button
                    onClick={() => {
                      openEditor(s, dayKey);
                      setOpenPopover(cellKey);
                    }}
                    className={cn(
                      "w-full h-5 rounded-sm transition-colors cursor-pointer hover:ring-1 hover:ring-primary/50",
                      onLeave ? 'bg-violet-400 dark:bg-violet-600' :
                      isOff ? 'bg-muted' :
                      load >= 0.8 ? 'bg-destructive' :
                      load >= 0.5 ? 'bg-amber-400 dark:bg-amber-600' :
                      'bg-emerald-400 dark:bg-emerald-600'
                    )}
                    title={`${s.full_name} - ${format(parseISO(date), 'EEE, MMM d')}`}
                  />
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3" align="center">
                  {editCell && editCell.staffId === s.id && editCell.dayKey === dayKey && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold">{s.full_name} — {format(parseISO(date), 'EEE, MMM d')}</p>
                      {onLeave && (
                        <p className="text-[10px] text-violet-600 bg-violet-50 dark:bg-violet-900/20 rounded px-2 py-1">🏖️ On approved leave</p>
                      )}
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Day Off</Label>
                        <Switch
                          checked={editCell.off}
                          onCheckedChange={(v) => setEditCell(prev => prev ? { ...prev, off: v } : null)}
                        />
                      </div>
                      {!editCell.off && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[10px]">Start</Label>
                            <Input
                              type="time"
                              value={editCell.start}
                              onChange={(e) => setEditCell(prev => prev ? { ...prev, start: e.target.value } : null)}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px]">End</Label>
                            <Input
                              type="time"
                              value={editCell.end}
                              onChange={(e) => setEditCell(prev => prev ? { ...prev, end: e.target.value } : null)}
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                      )}
                      <Button size="sm" className="w-full h-7 text-xs" onClick={() => saveCell(s)}>
                        Save
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            );
          })}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Toolbar: View Toggle + Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as 'weekly' | 'monthly')}>
          <ToggleGroupItem value="weekly" className="text-xs gap-1">
            <CalendarRange className="w-3.5 h-3.5" /> Weekly
          </ToggleGroupItem>
          <ToggleGroupItem value="monthly" className="text-xs gap-1">
            <CalendarDays className="w-3.5 h-3.5" /> Monthly
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="flex items-center gap-2 flex-1 flex-wrap">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1 min-w-[150px] max-w-[250px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search staff..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        {filteredStaff.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No staff match the current filters</p>
            <Button variant="link" size="sm" onClick={() => { setRoleFilter('all'); setStatusFilter('all'); setSearchQuery(''); }}>
              Clear filters
            </Button>
          </div>
        ) : viewMode === 'weekly' ? renderWeeklyView() : renderMonthlyView()}
      </div>

      {/* Legend */}
      <div className="flex gap-4 pt-3 border-t flex-wrap">
        {[
          { label: 'Available', cls: 'bg-emerald-500' },
          { label: 'Moderate', cls: 'bg-amber-500' },
          { label: 'Busy', cls: 'bg-destructive' },
          { label: 'Off', cls: 'bg-muted-foreground' },
          { label: 'On Leave', cls: 'bg-violet-500' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={cn("w-2.5 h-2.5 rounded-sm", l.cls)} />
            <span className="text-[10px] text-muted-foreground">{l.label}</span>
          </div>
        ))}
        <span className="text-[10px] text-muted-foreground ml-auto">Click any cell to edit</span>
      </div>
    </div>
  );
}

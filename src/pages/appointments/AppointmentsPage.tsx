import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Calendar as CalIcon, List, ChevronLeft, ChevronRight,
  User, PawPrint, Clock, DollarSign, Filter, Search, Users, Plus, Footprints, Repeat,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  addMonths, subMonths, isSameDay, isToday, startOfWeek, endOfWeek,
  addDays,
} from 'date-fns';
import { useBookings, useStaff, useServices, useCustomers, useUpdate, useInsert } from '@/hooks/use-supabase-data';
import { toast } from 'sonner';
import AppointmentStatsRow from './components/AppointmentStatsRow';
import TodayQueue from './components/TodayQueue';
import WalkInDialog from './components/WalkInDialog';
import CreateAppointmentDialog from './components/CreateAppointmentDialog';
import BookingDetailPanel from './components/BookingDetailPanel';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-violet-100 text-violet-700 border-violet-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

const statusDots: Record<string, string> = {
  pending: 'bg-amber-500', confirmed: 'bg-blue-500', in_progress: 'bg-violet-500',
  completed: 'bg-emerald-500', cancelled: 'bg-red-500',
};

export default function AppointmentsPage() {
  const { data: bookings = [], isLoading } = useBookings();
  const { data: staff = [] } = useStaff();
  const { data: services = [] } = useServices();
  const { data: customers = [] } = useCustomers();
  const updateBooking = useUpdate('bookings');
  const insertBooking = useInsert('bookings');

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const handleUpdateStatus = (id: string, status: string, extras?: Record<string, any>) => {
    updateBooking.mutate({ id, status, ...extras }, {
      onSuccess: () => { toast.success('Updated'); setDetailOpen(false); },
    });
  };

  const handleUpdate = (id: string, data: Record<string, any>) => {
    updateBooking.mutate({ id, ...data }, {
      onSuccess: () => toast.success('Updated'),
    });
  };

  const handleWalkIn = (data: any) => {
    insertBooking.mutate(data, {
      onSuccess: () => { toast.success('Walk-in created'); setWalkInOpen(false); },
    });
  };

  const handleCreateAppointments = (bookingsData: any[]) => {
    // Insert all bookings sequentially (for recurring)
    const insertAll = async () => {
      for (const b of bookingsData) {
        await new Promise<void>((resolve, reject) => {
          insertBooking.mutate(b, {
            onSuccess: () => resolve(),
            onError: (e) => reject(e),
          });
        });
      }
      toast.success(`Created ${bookingsData.length} appointment${bookingsData.length > 1 ? 's' : ''}`);
      setCreateOpen(false);
    };
    insertAll().catch(() => toast.error('Failed to create some appointments'));
  };

  // Today's bookings
  const todayBookings = useMemo(() =>
    bookings.filter(b => b.booking_date === todayStr).sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [bookings, todayStr]
  );

  // Calendar data
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const bookingsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    bookings.forEach((b) => { const d = b.booking_date; if (!map[d]) map[d] = []; map[d].push(b); });
    return map;
  }, [bookings]);

  // Week view
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  // Filtered list
  const filteredBookings = useMemo(() => {
    let list = [...bookings];
    if (statusFilter !== 'all') list = list.filter((b) => b.status === statusFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((b) => b.customer_name?.toLowerCase().includes(q) || b.pet_name?.toLowerCase().includes(q) || b.service_name?.toLowerCase().includes(q));
    }
    return list.sort((a, b) => (b.booking_date + b.start_time).localeCompare(a.booking_date + a.start_time));
  }, [bookings, statusFilter, searchQuery]);

  const selectedDayBookings = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return (bookingsByDate[dateStr] || []).sort((a: any, b: any) => a.start_time.localeCompare(b.start_time));
  }, [selectedDate, bookingsByDate]);

  if (isLoading) return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading appointments...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Appointments</h1>
          <p className="text-sm text-muted-foreground">Manage bookings, walk-ins, and today's queue</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Appointment
          </Button>
          <Button onClick={() => setWalkInOpen(true)}>
            <Footprints className="w-4 h-4 mr-1.5" /> Walk-in
          </Button>
        </div>
      </div>

      <AppointmentStatsRow todayBookings={todayBookings} />

      <Tabs defaultValue="today">
        <TabsList className="bg-muted overflow-x-auto w-full justify-start">
          <TabsTrigger value="today"><Clock className="w-4 h-4 mr-1.5" /> Today</TabsTrigger>
          <TabsTrigger value="calendar"><CalIcon className="w-4 h-4 mr-1.5" /> Calendar</TabsTrigger>
          <TabsTrigger value="week" className="hidden sm:flex"><CalIcon className="w-4 h-4 mr-1.5" /> Week</TabsTrigger>
          <TabsTrigger value="list"><List className="w-4 h-4 mr-1.5" /> List</TabsTrigger>
        </TabsList>

        {/* TODAY TAB */}
        <TabsContent value="today" className="mt-4">
          <TodayQueue
            bookings={todayBookings}
            staff={staff}
            onSelect={(b) => { setSelectedBooking(b); setDetailOpen(true); }}
            onUpdateStatus={handleUpdateStatus}
          />
        </TabsContent>

        {/* CALENDAR TAB */}
        <TabsContent value="calendar" className="mt-4">
          <div className="grid lg:grid-cols-5 gap-4">
            <Card className="lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold">{format(currentMonth, 'MMMM yyyy')}</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" className="h-8" onClick={() => { setCurrentMonth(new Date()); setSelectedDate(new Date()); }}>Today</Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="w-4 h-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="p-2 md:p-4">
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                    <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const dayBookings = bookingsByDate[dateStr] || [];
                    const isSelected = isSameDay(day, selectedDate);
                    const inMonth = day.getMonth() === currentMonth.getMonth();
                    const hasRecurring = dayBookings.some((b: any) => b.recurring_group_id);
                    return (
                      <button key={dateStr} onClick={() => setSelectedDate(day)}
                        className={cn("relative h-12 md:h-16 rounded-md p-1 text-left transition-all border",
                          isSelected ? "border-primary bg-accent" : "border-transparent hover:bg-muted/50", !inMonth && "opacity-40")}>
                        <span className={cn("text-xs font-medium", isToday(day) ? "bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center" : "")}>
                          {format(day, 'd')}
                        </span>
                        {dayBookings.length > 0 && (
                          <div className="mt-0.5 flex flex-wrap gap-0.5 items-center">
                            {dayBookings.slice(0, 3).map((b: any) => (
                              <div key={b.id} className={cn("w-1.5 h-1.5 rounded-full", statusDots[b.status] || 'bg-muted-foreground')} />
                            ))}
                            {dayBookings.length > 3 && <span className="text-[9px] text-muted-foreground ml-0.5">+{dayBookings.length - 3}</span>}
                            {hasRecurring && <Repeat className="w-2.5 h-2.5 text-indigo-500 ml-0.5" />}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">{isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE, MMM d')}</CardTitle>
                <p className="text-xs text-muted-foreground">{selectedDayBookings.length} bookings</p>
              </CardHeader>
              <CardContent className="p-0">
                {selectedDayBookings.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center px-4">
                    <CalIcon className="w-10 h-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">No bookings on this day</p>
                  </div>
                ) : (
                  <div className="divide-y max-h-[500px] overflow-y-auto">
                    {selectedDayBookings.map((b: any) => (
                      <button key={b.id} onClick={() => { setSelectedBooking(b); setDetailOpen(true); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left">
                        <div className="text-xs font-mono text-muted-foreground w-10 flex-shrink-0">
                          {(() => { try { return format(new Date(b.start_time), 'HH:mm'); } catch { return '--:--'; } })()}
                        </div>
                        <div className={cn("w-1 h-10 rounded-full flex-shrink-0", statusDots[b.status] || 'bg-muted')} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {b.service_name}
                            {b.recurring_group_id && <Repeat className="w-3 h-3 inline ml-1 text-indigo-500" />}
                          </p>
                          <p className="text-xs text-muted-foreground">{b.customer_name} · {b.pet_name}</p>
                          {b.assigned_staff_id && (
                            <p className="text-[10px] text-primary flex items-center gap-0.5 mt-0.5">
                              <Users className="w-2.5 h-2.5" />{staff.find(s => s.id === b.assigned_staff_id)?.full_name || 'Staff'}
                            </p>
                          )}
                        </div>
                        <Badge className={cn("text-[10px] hidden sm:inline-flex", statusColors[b.status])}>{b.status?.replace('_', ' ')}</Badge>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* WEEK TAB */}
        <TabsContent value="week" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold">
                {format(weekStart, 'MMM d')} — {format(addDays(weekStart, 6), 'MMM d, yyyy')}
              </CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" className="h-8" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>This Week</Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="p-2 md:p-4">
              <div className="grid grid-cols-7 gap-2 overflow-x-auto min-w-[700px]">
                {weekDays.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const dayBookings = (bookingsByDate[dateStr] || []).sort((a: any, b: any) => a.start_time.localeCompare(b.start_time));
                  return (
                    <div key={dateStr} className={cn("min-h-[200px] rounded-lg border p-2", isToday(day) && "border-primary bg-accent/30")}>
                      <p className={cn("text-xs font-semibold mb-2", isToday(day) ? "text-primary" : "text-muted-foreground")}>
                        {format(day, 'EEE d')}
                      </p>
                      <div className="space-y-1">
                        {dayBookings.map((b: any) => (
                          <button key={b.id} onClick={() => { setSelectedBooking(b); setDetailOpen(true); }}
                            className={cn("w-full text-left rounded p-1.5 text-[10px] leading-tight hover:opacity-80 transition-opacity border-l-2",
                              b.status === 'completed' ? 'bg-emerald-50 border-l-emerald-500' :
                              b.status === 'in_progress' ? 'bg-violet-50 border-l-violet-500' :
                              b.status === 'confirmed' ? 'bg-blue-50 border-l-blue-500' :
                              b.status === 'cancelled' ? 'bg-red-50 border-l-red-500' :
                              'bg-amber-50 border-l-amber-500'
                            )}>
                            <p className="font-medium truncate">
                              {(() => { try { return format(new Date(b.start_time), 'HH:mm'); } catch { return ''; } })()} {b.service_name}
                              {b.recurring_group_id && ' 🔄'}
                            </p>
                            <p className="text-muted-foreground truncate">{b.customer_name}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LIST TAB */}
        <TabsContent value="list" className="mt-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-0 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search bookings..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40"><Filter className="w-4 h-4 mr-2 text-muted-foreground" /><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mobile card list */}
          <div className="space-y-3 md:hidden">
            {filteredBookings.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No bookings found</CardContent></Card>
            ) : filteredBookings.map((b) => (
              <Card key={b.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedBooking(b); setDetailOpen(true); }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold">
                      {b.service_name}
                      {b.recurring_group_id && <Repeat className="w-3 h-3 inline ml-1 text-indigo-500" />}
                    </p>
                    <Badge className={cn("text-[10px]", statusColors[b.status])}>{b.status?.replace('_', ' ')}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{b.booking_date}</span>
                    <span>{(() => { try { return format(new Date(b.start_time), 'HH:mm'); } catch { return ''; } })()}</span>
                    <span className="font-medium text-foreground">${Number(b.total_price).toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {b.customer_name} · {b.pet_name}
                    {b.assigned_staff_id && <span className="text-primary ml-1">· {staff.find(s => s.id === b.assigned_staff_id)?.full_name}</span>}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop table */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Date & Time</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Service</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Customer</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Pets</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Staff</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Price</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Source</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredBookings.length === 0 ? (
                      <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">No bookings found</td></tr>
                    ) : filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => { setSelectedBooking(b); setDetailOpen(true); }}>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium">{b.booking_date}</p>
                          <p className="text-xs text-muted-foreground">{(() => { try { return format(new Date(b.start_time), 'HH:mm'); } catch { return ''; } })()}</p>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {b.service_name}
                          {b.recurring_group_id && <Repeat className="w-3 h-3 inline ml-1 text-indigo-500" />}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm">{b.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{b.customer_email}</p>
                        </td>
                        <td className="px-4 py-3 text-sm">{b.pet_name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {b.assigned_staff_id ? staff.find(s => s.id === b.assigned_staff_id)?.full_name || '—' : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">${Number(b.total_price).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-[10px]">{(b as any).source || 'online'}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={cn("text-xs", statusColors[b.status])}>{b.status?.replace('_', ' ')}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Walk-in Dialog */}
      <WalkInDialog
        open={walkInOpen}
        onOpenChange={setWalkInOpen}
        services={services}
        staff={staff}
        customers={customers}
        onSubmit={handleWalkIn}
        isLoading={insertBooking.isPending}
      />

      {/* Create Appointment Dialog */}
      <CreateAppointmentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        services={services}
        staff={staff}
        customers={customers}
        onSubmit={handleCreateAppointments}
        isLoading={insertBooking.isPending}
      />

      {/* Booking Detail Sheet */}
      <BookingDetailPanel
        booking={selectedBooking}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        staff={staff}
        onUpdate={handleUpdate}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}

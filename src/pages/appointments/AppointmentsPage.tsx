import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Calendar as CalIcon, List, ChevronLeft, ChevronRight,
  User, PawPrint, Clock, DollarSign, Filter, Search, Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  addMonths, subMonths, isSameDay, isToday, startOfWeek, endOfWeek,
} from 'date-fns';
import { useBookings, useStaff, useServiceStaff, useUpdate } from '@/hooks/use-supabase-data';
import { toast } from 'sonner';

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

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export default function AppointmentsPage() {
  const { data: bookings = [], isLoading } = useBookings();
  const updateBooking = useUpdate('bookings');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const updateStatus = (bookingId: string, newStatus: string) => {
    updateBooking.mutate({ id: bookingId, status: newStatus }, {
      onSuccess: () => { toast.success(`Status updated to ${newStatus}`); setDetailOpen(false); },
    });
  };

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
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold">Appointments</h1>
        <p className="text-sm text-muted-foreground">Manage all your bookings</p>
      </div>

      <Tabs defaultValue="calendar">
        <TabsList className="bg-muted">
          <TabsTrigger value="calendar"><CalIcon className="w-4 h-4 mr-1.5" /> Calendar</TabsTrigger>
          <TabsTrigger value="list"><List className="w-4 h-4 mr-1.5" /> List</TabsTrigger>
        </TabsList>

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
                    return (
                      <button key={dateStr} onClick={() => setSelectedDate(day)}
                        className={cn("relative h-12 md:h-16 rounded-md p-1 text-left transition-all border",
                          isSelected ? "border-primary bg-accent" : "border-transparent hover:bg-muted/50", !inMonth && "opacity-40")}>
                        <span className={cn("text-xs font-medium", isToday(day) ? "bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center" : "")}>
                          {format(day, 'd')}
                        </span>
                        {dayBookings.length > 0 && (
                          <div className="mt-0.5 flex flex-wrap gap-0.5">
                            {dayBookings.slice(0, 3).map((b: any) => (
                              <div key={b.id} className={cn("w-1.5 h-1.5 rounded-full", statusDots[b.status] || 'bg-muted-foreground')} />
                            ))}
                            {dayBookings.length > 3 && <span className="text-[9px] text-muted-foreground ml-0.5">+{dayBookings.length - 3}</span>}
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
                          {new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className={cn("w-1 h-10 rounded-full flex-shrink-0", statusDots[b.status] || 'bg-muted')} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{b.service_name}</p>
                          <p className="text-xs text-muted-foreground">{b.customer_name} · {b.pet_name}</p>
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

          {/* Mobile: card list */}
          <div className="space-y-3 md:hidden">
            {filteredBookings.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No bookings found</CardContent></Card>
            ) : filteredBookings.map((b) => (
              <Card key={b.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedBooking(b); setDetailOpen(true); }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold">{b.service_name}</p>
                    <Badge className={cn("text-[10px]", statusColors[b.status])}>{b.status?.replace('_', ' ')}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{b.booking_date}</span>
                    <span>{new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="font-medium text-foreground">${Number(b.total_price).toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{b.customer_name} · {b.pet_name}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop: table */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Date & Time</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Service</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Customer</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Pet</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Price</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredBookings.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">No bookings found</td></tr>
                    ) : filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => { setSelectedBooking(b); setDetailOpen(true); }}>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium">{b.booking_date}</p>
                          <p className="text-xs text-muted-foreground">{new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </td>
                        <td className="px-4 py-3 text-sm">{b.service_name}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm">{b.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{b.customer_email}</p>
                        </td>
                        <td className="px-4 py-3 text-sm">{b.pet_name} ({b.pet_species})</td>
                        <td className="px-4 py-3 text-sm font-medium">${Number(b.total_price).toFixed(2)}</td>
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

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          {selectedBooking && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-lg">{selectedBooking.service_name}</DialogTitle>
                  <Badge className={cn("text-xs", statusColors[selectedBooking.status])}>{selectedBooking.status?.replace('_', ' ')}</Badge>
                </div>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <InfoRow icon={User} label="Customer" value={selectedBooking.customer_name} />
                <InfoRow icon={PawPrint} label="Pet" value={`${selectedBooking.pet_name} (${selectedBooking.pet_species})`} />
                <InfoRow icon={CalIcon} label="Date" value={selectedBooking.booking_date} />
                <InfoRow icon={Clock} label="Time" value={new Date(selectedBooking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
                <InfoRow icon={DollarSign} label="Total" value={`$${Number(selectedBooking.total_price).toFixed(2)}`} />
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                {selectedBooking.status === 'confirmed' && (
                  <Button onClick={() => updateStatus(selectedBooking.id, 'in_progress')} className="flex-1">Start Service</Button>
                )}
                {selectedBooking.status === 'in_progress' && (
                  <Button onClick={() => updateStatus(selectedBooking.id, 'completed')} className="flex-1">Complete</Button>
                )}
                {selectedBooking.status === 'pending' && (
                  <Button onClick={() => updateStatus(selectedBooking.id, 'confirmed')} className="flex-1">Confirm</Button>
                )}
                {['pending', 'confirmed'].includes(selectedBooking.status) && (
                  <Button onClick={() => updateStatus(selectedBooking.id, 'cancelled')} variant="destructive" className="flex-1">Cancel</Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

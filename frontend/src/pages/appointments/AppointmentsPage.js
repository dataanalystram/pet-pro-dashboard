import { useState, useEffect, useMemo } from 'react';
import { bookingsAPI, servicesAPI } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Calendar as CalIcon, List, ChevronLeft, ChevronRight,
  Plus, User, PawPrint, Clock, DollarSign, Filter, Search, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval,
  addMonths, subMonths, isSameDay, isToday, startOfWeek, endOfWeek,
  getDay, addDays
} from 'date-fns';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-violet-100 text-violet-700 border-violet-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  no_show: 'bg-slate-100 text-slate-600 border-slate-200',
};

const statusDots = {
  pending: 'bg-amber-500',
  confirmed: 'bg-blue-500',
  in_progress: 'bg-violet-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-red-500',
};

export default function AppointmentsPage() {
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadData = async () => {
    try {
      const [bRes, sRes] = await Promise.all([
        bookingsAPI.list({}),
        servicesAPI.list(),
      ]);
      setBookings(bRes.data);
      setServices(sRes.data);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const updateStatus = async (bookingId, newStatus) => {
    try {
      await bookingsAPI.updateStatus(bookingId, { status: newStatus });
      await loadData();
      setDetailOpen(false);
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  // Calendar data
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const bookingsByDate = useMemo(() => {
    const map = {};
    bookings.forEach((b) => {
      const d = b.booking_date;
      if (!map[d]) map[d] = [];
      map[d].push(b);
    });
    return map;
  }, [bookings]);

  // Filtered bookings for list view
  const filteredBookings = useMemo(() => {
    let list = [...bookings];
    if (statusFilter !== 'all') list = list.filter((b) => b.status === statusFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((b) =>
        b.customer_name?.toLowerCase().includes(q) ||
        b.pet_name?.toLowerCase().includes(q) ||
        b.service_name?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => (b.booking_date + b.start_time).localeCompare(a.booking_date + a.start_time));
  }, [bookings, statusFilter, searchQuery]);

  // Selected date bookings
  const selectedDayBookings = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return (bookingsByDate[dateStr] || []).sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [selectedDate, bookingsByDate]);

  if (loading) {
    return (
      <div className="space-y-4" data-testid="appointments-skeleton">
        <Skeleton className="h-8 w-48" />
        <div className="grid lg:grid-cols-5 gap-6">
          <Skeleton className="h-96 lg:col-span-3 rounded-xl" />
          <Skeleton className="h-96 lg:col-span-2 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="appointments-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Appointments</h1>
          <p className="text-sm text-slate-500">Manage all your bookings</p>
        </div>
      </div>

      <Tabs defaultValue="calendar" data-testid="appointments-tabs">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="calendar" data-testid="tab-calendar">
            <CalIcon className="w-4 h-4 mr-1.5" /> Calendar
          </TabsTrigger>
          <TabsTrigger value="list" data-testid="tab-list">
            <List className="w-4 h-4 mr-1.5" /> List
          </TabsTrigger>
        </TabsList>

        {/* CALENDAR VIEW */}
        <TabsContent value="calendar" className="mt-4">
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Calendar grid */}
            <Card className="lg:col-span-3 border-slate-200" data-testid="calendar-card">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">{format(currentMonth, 'MMMM yyyy')}</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} data-testid="prev-month">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setCurrentMonth(new Date()); setSelectedDate(new Date()); }} data-testid="today-btn">
                    Today
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} data-testid="next-month">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-2 md:p-4">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                    <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
                  ))}
                </div>
                {/* Calendar cells */}
                <div className="grid grid-cols-7 gap-1" data-testid="calendar-grid">
                  {calendarDays.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const dayBookings = bookingsByDate[dateStr] || [];
                    const isSelected = isSameDay(day, selectedDate);
                    const inMonth = day.getMonth() === currentMonth.getMonth();
                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedDate(day)}
                        className={cn(
                          "relative h-16 md:h-20 rounded-lg p-1 text-left transition-all border",
                          isSelected ? "border-provider-primary bg-blue-50" : "border-transparent hover:bg-slate-50",
                          !inMonth && "opacity-40"
                        )}
                        data-testid={`cal-day-${dateStr}`}
                      >
                        <span className={cn(
                          "text-xs font-medium",
                          isToday(day) ? "bg-provider-primary text-white w-5 h-5 rounded-full flex items-center justify-center" : "text-slate-700"
                        )}>
                          {format(day, 'd')}
                        </span>
                        {dayBookings.length > 0 && (
                          <div className="mt-0.5 flex flex-wrap gap-0.5">
                            {dayBookings.slice(0, 3).map((b) => (
                              <div key={b.id} className={cn("w-1.5 h-1.5 rounded-full", statusDots[b.status] || 'bg-slate-400')} />
                            ))}
                            {dayBookings.length > 3 && (
                              <span className="text-[9px] text-slate-400 ml-0.5">+{dayBookings.length - 3}</span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Day detail */}
            <Card className="lg:col-span-2 border-slate-200" data-testid="day-detail-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE, MMM d')}
                </CardTitle>
                <p className="text-xs text-slate-500">{selectedDayBookings.length} bookings</p>
              </CardHeader>
              <CardContent className="p-0">
                {selectedDayBookings.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center px-4">
                    <CalIcon className="w-10 h-10 text-slate-300 mb-3" />
                    <p className="text-sm text-slate-500">No bookings on this day</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                    {selectedDayBookings.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => { setSelectedBooking(b); setDetailOpen(true); }}
                        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors text-left"
                        data-testid={`day-booking-${b.id}`}
                      >
                        <div className="text-xs font-mono text-slate-500 w-10 flex-shrink-0">
                          {b.start_time ? format(parseISO(b.start_time), 'HH:mm') : '--:--'}
                        </div>
                        <div className={cn("w-1 h-10 rounded-full flex-shrink-0", statusDots[b.status] || 'bg-slate-300')} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{b.service_name || 'Service'}</p>
                          <p className="text-xs text-slate-500">{b.customer_name} · {b.pet_name}</p>
                        </div>
                        <Badge className={cn("text-[10px]", statusColors[b.status])}>
                          {b.status?.replace('_', ' ')}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* LIST VIEW */}
        <TabsContent value="list" className="mt-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4" data-testid="list-filters">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search bookings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="search-bookings"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="status-filter">
                <Filter className="w-4 h-4 mr-2 text-slate-400" />
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
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

          {/* Bookings table */}
          <Card className="border-slate-200" data-testid="bookings-list-card">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Date & Time</th>
                      <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Service</th>
                      <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Customer</th>
                      <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Pet</th>
                      <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Price</th>
                      <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">
                          No bookings found
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.slice(0, 50).map((b) => (
                        <tr
                          key={b.id}
                          className="hover:bg-slate-50 cursor-pointer transition-colors"
                          onClick={() => { setSelectedBooking(b); setDetailOpen(true); }}
                          data-testid={`list-booking-${b.id}`}
                        >
                          <td className="px-5 py-3">
                            <p className="text-sm font-medium text-slate-900">{b.booking_date ? format(parseISO(b.booking_date), 'MMM d, yyyy') : '-'}</p>
                            <p className="text-xs text-slate-500">{b.start_time ? format(parseISO(b.start_time), 'HH:mm') : '-'}</p>
                          </td>
                          <td className="px-5 py-3 text-sm text-slate-700">{b.service_name || '-'}</td>
                          <td className="px-5 py-3">
                            <p className="text-sm text-slate-700">{b.customer_name}</p>
                            <p className="text-xs text-slate-400">{b.customer_email}</p>
                          </td>
                          <td className="px-5 py-3 text-sm text-slate-700">{b.pet_name} ({b.pet_species})</td>
                          <td className="px-5 py-3 text-sm font-medium text-slate-900">€{(b.total_price || 0).toFixed(2)}</td>
                          <td className="px-5 py-3">
                            <Badge className={cn("text-xs", statusColors[b.status])}>
                              {b.status?.replace('_', ' ')}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Booking Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md" data-testid="booking-detail-dialog">
          {selectedBooking && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-lg">{selectedBooking.service_name || 'Booking Detail'}</DialogTitle>
                  <Badge className={cn("text-xs", statusColors[selectedBooking.status])}>
                    {selectedBooking.status?.replace('_', ' ')}
                  </Badge>
                </div>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <InfoRow icon={User} label="Customer" value={selectedBooking.customer_name} />
                <InfoRow icon={PawPrint} label="Pet" value={`${selectedBooking.pet_name} (${selectedBooking.pet_species}${selectedBooking.pet_breed ? `, ${selectedBooking.pet_breed}` : ''})`} />
                <InfoRow icon={CalIcon} label="Date" value={selectedBooking.booking_date ? format(parseISO(selectedBooking.booking_date), 'EEEE, MMM d, yyyy') : '-'} />
                <InfoRow icon={Clock} label="Time" value={selectedBooking.start_time ? format(parseISO(selectedBooking.start_time), 'HH:mm') : '-'} />
                <InfoRow icon={DollarSign} label="Total" value={`€${(selectedBooking.total_price || 0).toFixed(2)}`} />
                {selectedBooking.customer_notes && (
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Customer Notes</p>
                    <p className="text-sm text-slate-700">{selectedBooking.customer_notes}</p>
                  </div>
                )}
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                {selectedBooking.status === 'confirmed' && (
                  <Button onClick={() => updateStatus(selectedBooking.id, 'in_progress')} className="bg-violet-600 hover:bg-violet-700 flex-1" data-testid="start-service-btn">
                    Start Service
                  </Button>
                )}
                {selectedBooking.status === 'in_progress' && (
                  <Button onClick={() => updateStatus(selectedBooking.id, 'completed')} className="bg-emerald-600 hover:bg-emerald-700 flex-1" data-testid="complete-service-btn">
                    Complete
                  </Button>
                )}
                {selectedBooking.status === 'pending' && (
                  <Button onClick={() => updateStatus(selectedBooking.id, 'confirmed')} className="bg-provider-primary hover:bg-blue-700 flex-1" data-testid="confirm-booking-btn">
                    Confirm
                  </Button>
                )}
                {['pending', 'confirmed'].includes(selectedBooking.status) && (
                  <Button onClick={() => updateStatus(selectedBooking.id, 'cancelled')} variant="destructive" className="flex-1" data-testid="cancel-booking-btn">
                    Cancel
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tables } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import { useUpdate } from '@/hooks/use-supabase-data';
import { cn } from '@/lib/utils';
import {
  PawPrint, Calendar, DollarSign, Star, ShoppingBag, Tag, Clock,
  User, Package, MessageSquare, TrendingUp, Heart, Award, Phone,
  AlertTriangle, BarChart3, Send, Plus, ShieldAlert, Percent,
  Mail, ArrowRight
} from 'lucide-react';
import { format, differenceInDays, parseISO, subMonths, startOfMonth, isAfter } from 'date-fns';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

type Customer = Tables<'customers'>;

interface Props {
  customer: Customer | null;
  open: boolean;
  onClose: () => void;
}

const tierColors: Record<string, string> = {
  new: 'bg-secondary text-secondary-foreground',
  regular: 'bg-blue-100 text-blue-700',
  loyal: 'bg-violet-100 text-violet-700',
  vip: 'bg-amber-100 text-amber-700',
};

const statusColors: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-700',
  confirmed: 'bg-blue-100 text-blue-700',
  pending: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-red-100 text-red-700',
  'no-show': 'bg-muted text-muted-foreground',
};

function StatBox({ icon: Icon, label, value, accent, warning }: { icon: any; label: string; value: string | number; accent?: string; warning?: boolean }) {
  return (
    <div className={cn("rounded-xl p-3 text-center space-y-1", warning ? "bg-destructive/10" : "bg-muted/60")}>
      <Icon className={cn("w-4 h-4 mx-auto", warning ? "text-destructive" : accent || "text-muted-foreground")} />
      <p className={cn("text-lg font-bold leading-tight", warning && "text-destructive")}>{value}</p>
      <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
    </div>
  );
}

export default function CustomerDetailPanel({ customer, open, onClose }: Props) {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [bookingRequests, setBookingRequests] = useState<any[]>([]);
  const [staffMap, setStaffMap] = useState<Record<string, string>>({});
  const [servicesMap, setServicesMap] = useState<Record<string, string>>({});
  const [campaignsMap, setCampaignsMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const updateCustomer = useUpdate('customers');

  useEffect(() => {
    if (!customer) return;
    setLoading(true);

    const email = customer.customer_email;
    const name = customer.customer_name;

    Promise.all([
      supabase.from('bookings').select('*').or(`customer_email.eq.${email},customer_name.eq.${name}`).order('start_time', { ascending: false }),
      supabase.from('orders').select('*').or(`customer_email.eq.${email},customer_name.eq.${name}`).order('created_at', { ascending: false }),
      supabase.from('reviews').select('*').or(`customer_email.eq.${email},customer_name.eq.${name}`).order('created_at', { ascending: false }),
      supabase.from('campaign_redemptions').select('*').or(`customer_email.eq.${email},customer_name.eq.${name}`).order('redeemed_at', { ascending: false }),
      supabase.from('messages').select('*').or(`customer_email.eq.${email},customer_name.eq.${name}`).order('created_at', { ascending: false }).limit(50),
      supabase.from('booking_requests').select('*').or(`customer_email.eq.${email},customer_name.eq.${name}`).order('created_at', { ascending: false }),
      supabase.from('staff').select('id, full_name'),
      supabase.from('services').select('id, name'),
      supabase.from('campaigns').select('id, name, promo_code'),
    ]).then(([bRes, oRes, rRes, crRes, mRes, brRes, sRes, svRes, cRes]) => {
      setBookings(bRes.data || []);
      setOrders(oRes.data || []);
      setReviews(rRes.data || []);
      setRedemptions(crRes.data || []);
      setMessages(mRes.data || []);
      setBookingRequests(brRes.data || []);

      const sm: Record<string, string> = {};
      (sRes.data || []).forEach((s: any) => { sm[s.id] = s.full_name; });
      setStaffMap(sm);

      const svm: Record<string, string> = {};
      (svRes.data || []).forEach((s: any) => { svm[s.id] = s.name; });
      setServicesMap(svm);

      const cm: Record<string, any> = {};
      (cRes.data || []).forEach((c: any) => { cm[c.id] = c; });
      setCampaignsMap(cm);

      setLoading(false);
    });
  }, [customer]);

  const analytics = useMemo(() => {
    if (!customer) return null;

    // Favorite services
    const serviceCounts: Record<string, number> = {};
    bookings.forEach(b => {
      serviceCounts[b.service_name] = (serviceCounts[b.service_name] || 0) + 1;
    });
    const favoriteServices = Object.entries(serviceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    // Preferred staff
    const staffCounts: Record<string, number> = {};
    bookings.filter(b => b.assigned_staff_id).forEach(b => {
      staffCounts[b.assigned_staff_id] = (staffCounts[b.assigned_staff_id] || 0) + 1;
    });
    const preferredStaff = Object.entries(staffCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    // Days as customer
    const first = customer.first_booking_date;
    const last = customer.last_booking_date;
    const daysAsCustomer = first && last ? differenceInDays(parseISO(last), parseISO(first)) : 0;

    const avgBookingValue = customer.total_bookings > 0 ? Math.round((Number(customer.total_spent) * 100) / customer.total_bookings) / 100 : 0;

    // No-show / cancellation rate
    const totalCompleted = bookings.filter(b => b.status === 'completed').length;
    const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;
    const noShowCount = bookings.filter(b => b.status === 'no-show').length;
    const unreliableCount = cancelledCount + noShowCount;
    const noShowRate = bookings.length > 0 ? Math.round((unreliableCount / bookings.length) * 100) : 0;

    // Average rating given
    const avgRating = reviews.length > 0 ? Math.round((reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length) * 10) / 10 : null;

    // Total promo savings
    const totalPromoSavings = Math.round(redemptions.reduce((sum: number, r: any) => sum + Number(r.discount_applied), 0) * 100) / 100;

    // Churn risk
    const daysSinceLastVisit = last ? differenceInDays(new Date(), parseISO(last)) : null;
    const churnRisk = daysSinceLastVisit === null ? 'unknown' : daysSinceLastVisit > 90 ? 'high' : daysSinceLastVisit > 60 ? 'medium' : 'low';

    // Revenue breakdown
    const bookingRevenue = Math.round(bookings.filter(b => b.status === 'completed').reduce((sum: number, b: any) => sum + Number(b.total_price), 0) * 100) / 100;
    const orderRevenue = Math.round(orders.filter(o => o.payment_status === 'paid').reduce((sum: number, o: any) => sum + Number(o.total), 0) * 100) / 100;

    // Monthly spend trend (last 6 months)
    const now = new Date();
    const monthlySpend: { month: string; bookings: number; orders: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = startOfMonth(subMonths(now, i - 1));
      const label = format(monthStart, 'MMM');
      const bSpend = bookings
        .filter(b => {
          const d = new Date(b.start_time);
          return isAfter(d, monthStart) && !isAfter(d, monthEnd) && b.status === 'completed';
        })
        .reduce((s: number, b: any) => s + Number(b.total_price), 0);
      const oSpend = orders
        .filter(o => {
          const d = new Date(o.created_at);
          return isAfter(d, monthStart) && !isAfter(d, monthEnd) && o.payment_status === 'paid';
        })
        .reduce((s: number, o: any) => s + Number(o.total), 0);
      monthlySpend.push({ month: label, bookings: Math.round(bSpend), orders: Math.round(oSpend) });
    }

    // Phone number (from booking_requests or orders)
    const phone = bookingRequests.find(br => br.customer_phone)?.customer_phone
      || orders.find(o => o.customer_phone)?.customer_phone
      || null;

    // Pet enrichment from bookings
    const petDetails: Record<string, { species?: string; breed?: string }> = {};
    bookings.forEach(b => {
      if (b.pet_name && !petDetails[b.pet_name]) {
        petDetails[b.pet_name] = { species: b.pet_species, breed: b.pet_breed };
      }
    });

    return {
      favoriteServices, preferredStaff, daysAsCustomer, avgBookingValue,
      noShowRate, unreliableCount, cancelledCount, noShowCount,
      avgRating, totalPromoSavings, churnRisk, daysSinceLastVisit,
      bookingRevenue, orderRevenue, monthlySpend, phone, petDetails,
    };
  }, [customer, bookings, orders, reviews, redemptions, bookingRequests]);

  const handleTierChange = (tier: string) => {
    if (!customer) return;
    updateCustomer.mutate({ id: customer.id, tier }, {
      onSuccess: () => toast.success('Tier updated'),
    });
  };

  if (!customer) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
        {/* Header */}
        <div className="p-6 pb-4 border-b space-y-4">
          <SheetHeader className="p-0">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl flex-shrink-0">
                {customer.customer_name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <SheetTitle className="text-lg">{customer.customer_name}</SheetTitle>
                  <Badge className={cn("text-[10px]", tierColors[customer.tier])}>{customer.tier}</Badge>
                  {analytics?.churnRisk === 'high' && (
                    <Badge className="bg-destructive/10 text-destructive text-[10px] gap-1">
                      <AlertTriangle className="w-3 h-3" /> At Risk
                    </Badge>
                  )}
                  {analytics?.churnRisk === 'medium' && (
                    <Badge className="bg-amber-100 text-amber-700 text-[10px] gap-1">
                      <AlertTriangle className="w-3 h-3" /> Cooling
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {customer.customer_email}
                  </p>
                  {analytics?.phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {analytics.phone}
                    </p>
                  )}
                </div>
                {customer.first_booking_date && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Customer since {format(parseISO(customer.first_booking_date), 'MMM yyyy')}
                    {analytics && analytics.daysAsCustomer > 0 && ` · ${analytics.daysAsCustomer} days`}
                    {analytics?.daysSinceLastVisit !== null && analytics?.daysSinceLastVisit !== undefined && (
                      <span className={cn(
                        "ml-1",
                        analytics.daysSinceLastVisit > 90 ? "text-destructive font-medium" :
                        analytics.daysSinceLastVisit > 60 ? "text-amber-600" : ""
                      )}>
                        · Last seen {analytics.daysSinceLastVisit}d ago
                      </span>
                    )}
                  </p>
                )}
              </div>
              <Select defaultValue={customer.tier} onValueChange={handleTierChange}>
                <SelectTrigger className="w-28 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['new', 'regular', 'loyal', 'vip'].map(t => (
                    <SelectItem key={t} value={t} className="capitalize text-xs">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </SheetHeader>

          {/* Quick Actions */}
          <div className="flex gap-2 flex-wrap">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => { onClose(); navigate(`/messages?customer=${encodeURIComponent(customer.customer_email)}`); }}>
                    <Send className="w-3 h-3" /> Message
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Send a message to this customer</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => { onClose(); navigate('/appointments'); }}>
                    <Plus className="w-3 h-3" /> Book
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Create a booking for this customer</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => { onClose(); navigate('/orders'); }}>
                    <ShoppingBag className="w-3 h-3" /> Order
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Create an order for this customer</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <StatBox icon={DollarSign} label="Total Spent" value={`$${Number(customer.total_spent)}`} accent="text-emerald-600" />
            <StatBox icon={Calendar} label="Bookings" value={customer.total_bookings} accent="text-blue-600" />
            <StatBox icon={TrendingUp} label="Avg Value" value={`$${analytics?.avgBookingValue || 0}`} accent="text-violet-600" />
            <StatBox icon={ShieldAlert} label="No-Show %" value={`${analytics?.noShowRate || 0}%`} accent="text-muted-foreground" warning={(analytics?.noShowRate || 0) > 15} />
            <StatBox icon={Star} label="Avg Rating" value={analytics?.avgRating !== null ? analytics?.avgRating || '—' : '—'} accent="text-amber-600" />
            <StatBox icon={Percent} label="Promo Saved" value={`$${analytics?.totalPromoSavings || 0}`} accent="text-pink-600" />
          </div>
        </div>

        {/* Tabs */}
        <ScrollArea className="flex-1">
          <div className="p-6 pt-4">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">Loading customer data...</div>
            ) : (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full grid grid-cols-6 mb-4">
                  <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                  <TabsTrigger value="bookings" className="text-xs">Bookings</TabsTrigger>
                  <TabsTrigger value="orders" className="text-xs">Orders</TabsTrigger>
                  <TabsTrigger value="reviews" className="text-xs">Reviews</TabsTrigger>
                  <TabsTrigger value="messages" className="text-xs">Messages</TabsTrigger>
                  <TabsTrigger value="promos" className="text-xs">Promos</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-5">
                  {/* Revenue Breakdown */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><BarChart3 className="w-4 h-4" /> Revenue Breakdown</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Card className="bg-muted/40"><CardContent className="p-3">
                        <p className="text-[11px] text-muted-foreground">From Services</p>
                        <p className="text-sm font-bold text-emerald-600">${analytics?.bookingRevenue || 0}</p>
                      </CardContent></Card>
                      <Card className="bg-muted/40"><CardContent className="p-3">
                        <p className="text-[11px] text-muted-foreground">From Products</p>
                        <p className="text-sm font-bold text-orange-600">${analytics?.orderRevenue || 0}</p>
                      </CardContent></Card>
                    </div>
                  </div>

                  {/* Monthly Spend Trend */}
                  {analytics && analytics.monthlySpend.some(m => m.bookings > 0 || m.orders > 0) && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><TrendingUp className="w-4 h-4" /> 6-Month Spend Trend</h3>
                      <div className="h-32 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.monthlySpend} barGap={0}>
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={35} />
                            <RechartsTooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                            <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} name="Services" />
                            <Bar dataKey="orders" fill="hsl(var(--primary) / 0.4)" radius={[3, 3, 0, 0]} name="Products" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Pets */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><PawPrint className="w-4 h-4" /> Pets</h3>
                    {customer.pets?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {customer.pets.map((p: string) => {
                          const details = analytics?.petDetails?.[p];
                          return (
                            <Card key={p} className="bg-muted/40">
                              <CardContent className="p-3 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <PawPrint className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                  <span className="text-sm font-medium">{p}</span>
                                  {(details?.species || details?.breed) && (
                                    <p className="text-[11px] text-muted-foreground">
                                      {[details.species, details.breed].filter(Boolean).join(' · ')}
                                    </p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No pets recorded</p>
                    )}
                  </div>

                  {/* Reliability */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><ShieldAlert className="w-4 h-4" /> Reliability</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <Card className="bg-muted/40"><CardContent className="p-3 text-center">
                        <p className="text-lg font-bold text-emerald-600">{bookings.filter(b => b.status === 'completed').length}</p>
                        <p className="text-[11px] text-muted-foreground">Completed</p>
                      </CardContent></Card>
                      <Card className={cn("bg-muted/40", (analytics?.cancelledCount || 0) > 0 && "bg-amber-50")}><CardContent className="p-3 text-center">
                        <p className="text-lg font-bold">{analytics?.cancelledCount || 0}</p>
                        <p className="text-[11px] text-muted-foreground">Cancelled</p>
                      </CardContent></Card>
                      <Card className={cn("bg-muted/40", (analytics?.noShowCount || 0) > 0 && "bg-destructive/5")}><CardContent className="p-3 text-center">
                        <p className={cn("text-lg font-bold", (analytics?.noShowCount || 0) > 0 && "text-destructive")}>{analytics?.noShowCount || 0}</p>
                        <p className="text-[11px] text-muted-foreground">No-shows</p>
                      </CardContent></Card>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Clock className="w-4 h-4" /> Customer Timeline</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Card className="bg-muted/40"><CardContent className="p-3">
                        <p className="text-[11px] text-muted-foreground">First Visit</p>
                        <p className="text-sm font-medium">{customer.first_booking_date ? format(parseISO(customer.first_booking_date), 'dd MMM yyyy') : '—'}</p>
                      </CardContent></Card>
                      <Card className="bg-muted/40"><CardContent className="p-3">
                        <p className="text-[11px] text-muted-foreground">Last Visit</p>
                        <p className="text-sm font-medium">{customer.last_booking_date ? format(parseISO(customer.last_booking_date), 'dd MMM yyyy') : '—'}</p>
                      </CardContent></Card>
                    </div>
                  </div>

                  {/* Favorite Services */}
                  {analytics && analytics.favoriteServices.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Heart className="w-4 h-4" /> Favorite Services</h3>
                      <div className="space-y-1.5">
                        {analytics.favoriteServices.map(([service, count]) => (
                          <div key={service} className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2">
                            <span className="text-sm">{service}</span>
                            <Badge variant="secondary" className="text-[10px]">{count}x</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preferred Staff */}
                  {analytics && analytics.preferredStaff.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Award className="w-4 h-4" /> Preferred Staff</h3>
                      <div className="space-y-1.5">
                        {analytics.preferredStaff.map(([staffId, count]) => (
                          <div key={staffId} className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-3 h-3 text-primary" />
                              </div>
                              <span className="text-sm">{staffMap[staffId] || 'Unknown'}</span>
                            </div>
                            <Badge variant="secondary" className="text-[10px]">{count} sessions</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pending Requests */}
                  {bookingRequests.filter(br => br.status === 'pending').length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-amber-600"><Clock className="w-4 h-4" /> Pending Requests</h3>
                      <div className="space-y-1.5">
                        {bookingRequests.filter(br => br.status === 'pending').map(br => (
                          <div key={br.id} className="flex items-center justify-between bg-amber-50 rounded-lg px-3 py-2">
                            <div>
                              <p className="text-sm font-medium">{br.service_name}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {br.preferred_date && format(parseISO(br.preferred_date), 'dd MMM yyyy')}
                                {br.preferred_time && ` at ${br.preferred_time}`}
                              </p>
                            </div>
                            {br.is_urgent && <Badge className="bg-destructive/10 text-destructive text-[10px]">Urgent</Badge>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Bookings Tab */}
                <TabsContent value="bookings">
                  {bookings.length === 0 ? (
                    <EmptyState icon={Calendar} text="No booking history" />
                  ) : (
                    <div className="space-y-2">
                      {bookings.map(b => (
                        <Card key={b.id} className="bg-muted/30">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold">{b.service_name}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                  <span>{format(new Date(b.start_time), 'dd MMM yyyy, HH:mm')}</span>
                                  {b.pet_name && <span>· {b.pet_name}</span>}
                                  {b.pet_species && <span className="text-[10px]">({b.pet_species}{b.pet_breed ? `, ${b.pet_breed}` : ''})</span>}
                                </div>
                                {b.assigned_staff_id && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    Staff: {staffMap[b.assigned_staff_id] || 'Unassigned'}
                                  </p>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0 space-y-1">
                                <p className="text-sm font-bold">${Number(b.total_price)}</p>
                                <Badge className={cn("text-[10px]", statusColors[b.status] || 'bg-muted text-muted-foreground')}>
                                  {b.status}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Orders Tab */}
                <TabsContent value="orders">
                  {orders.length === 0 ? (
                    <EmptyState icon={Package} text="No order history" />
                  ) : (
                    <div className="space-y-2">
                      {orders.map(o => {
                        const items = Array.isArray(o.items) ? o.items : [];
                        return (
                          <Card key={o.id} className="bg-muted/30">
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold">{o.order_number}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(o.created_at), 'dd MMM yyyy')} · {items.length} item{items.length !== 1 ? 's' : ''}
                                  </p>
                                  {Number(o.discount) > 0 && (
                                    <p className="text-xs text-emerald-600 mt-0.5">Discount: -${Number(o.discount)}</p>
                                  )}
                                </div>
                                <div className="text-right space-y-1">
                                  <p className="text-sm font-bold">${Number(o.total)}</p>
                                  <Badge className={cn("text-[10px]",
                                    o.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                    o.payment_status === 'refunded' ? 'bg-red-100 text-red-700' :
                                    'bg-amber-100 text-amber-700'
                                  )}>{o.payment_status}</Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                {/* Reviews Tab */}
                <TabsContent value="reviews">
                  {reviews.length === 0 ? (
                    <EmptyState icon={MessageSquare} text="No reviews yet" />
                  ) : (
                    <div className="space-y-2">
                      {reviews.length > 0 && (
                        <div className="flex items-center gap-3 mb-3 p-3 bg-muted/40 rounded-lg">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span className="text-sm font-bold">{analytics?.avgRating}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">avg across {reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {reviews.map(r => (
                        <Card key={r.id} className="bg-muted/30">
                          <CardContent className="p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={cn("w-3.5 h-3.5", i < r.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30")} />
                                ))}
                              </div>
                              <span className="text-xs text-muted-foreground">{format(new Date(r.created_at), 'dd MMM yyyy')}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{servicesMap[r.service_id] || 'Service'}</p>
                            {r.review_text && <p className="text-sm">{r.review_text}</p>}
                            {r.admin_response && (
                              <div className="bg-muted rounded-lg p-2 mt-1">
                                <p className="text-[11px] text-muted-foreground font-medium mb-0.5">Admin Response</p>
                                <p className="text-xs">{r.admin_response}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Messages Tab */}
                <TabsContent value="messages">
                  {messages.length === 0 ? (
                    <EmptyState icon={MessageSquare} text="No message history" />
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-muted-foreground">{messages.length} messages</p>
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => { onClose(); navigate(`/messages?customer=${encodeURIComponent(customer.customer_email)}`); }}>
                          Open Full Thread <ArrowRight className="w-3 h-3" />
                        </Button>
                      </div>
                      {messages.slice(0, 20).map(m => (
                        <div key={m.id} className={cn(
                          "rounded-lg p-3 max-w-[85%]",
                          m.sender === 'customer' ? "bg-muted/60 mr-auto" : "bg-primary/10 ml-auto"
                        )}>
                          <p className="text-sm">{m.content}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {format(new Date(m.created_at), 'dd MMM yyyy, HH:mm')}
                            {m.sender !== 'customer' && ' · You'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Promos Tab */}
                <TabsContent value="promos">
                  {redemptions.length === 0 ? (
                    <EmptyState icon={Tag} text="No promo codes used" />
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 mb-3 p-3 bg-muted/40 rounded-lg">
                        <p className="text-sm font-bold text-emerald-600">${analytics?.totalPromoSavings || 0}</p>
                        <span className="text-xs text-muted-foreground">total savings across {redemptions.length} redemption{redemptions.length !== 1 ? 's' : ''}</span>
                      </div>
                      {redemptions.map(r => {
                        const campaign = campaignsMap[r.campaign_id];
                        return (
                          <Card key={r.id} className="bg-muted/30">
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold">{campaign?.name || 'Campaign'}</p>
                                  {campaign?.promo_code && (
                                    <Badge variant="outline" className="text-[10px] mt-1 font-mono">{campaign.promo_code}</Badge>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {format(new Date(r.redeemed_at), 'dd MMM yyyy')}
                                  </p>
                                </div>
                                <p className="text-sm font-bold text-emerald-600">-${Number(r.discount_applied)}</p>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <Icon className="w-8 h-8 mb-2 opacity-40" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

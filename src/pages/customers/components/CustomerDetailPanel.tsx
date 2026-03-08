import { useEffect, useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tables } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import { useUpdate } from '@/hooks/use-supabase-data';
import { cn } from '@/lib/utils';
import {
  PawPrint, Calendar, DollarSign, Star, ShoppingBag, Tag, Clock,
  User, Package, MessageSquare, TrendingUp, Heart, Award
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { toast } from 'sonner';

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

function StatBox({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string | number; accent?: string }) {
  return (
    <div className="bg-muted/60 rounded-xl p-3 text-center space-y-1">
      <Icon className={cn("w-4 h-4 mx-auto", accent || "text-muted-foreground")} />
      <p className="text-lg font-bold leading-tight">{value}</p>
      <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
    </div>
  );
}

export default function CustomerDetailPanel({ customer, open, onClose }: Props) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);
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
      supabase.from('staff').select('id, full_name'),
      supabase.from('services').select('id, name'),
      supabase.from('campaigns').select('id, name, promo_code'),
    ]).then(([bRes, oRes, rRes, crRes, sRes, svRes, cRes]) => {
      setBookings(bRes.data || []);
      setOrders(oRes.data || []);
      setReviews(rRes.data || []);
      setRedemptions(crRes.data || []);

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

    const avgBookingValue = customer.total_bookings > 0 ? Math.round(Number(customer.total_spent) / customer.total_bookings) : 0;

    return { favoriteServices, preferredStaff, daysAsCustomer, avgBookingValue };
  }, [customer, bookings]);

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
                </div>
                <p className="text-sm text-muted-foreground truncate">{customer.customer_email}</p>
                {customer.first_booking_date && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Customer since {format(parseISO(customer.first_booking_date), 'MMM yyyy')}
                    {analytics && analytics.daysAsCustomer > 0 && ` · ${analytics.daysAsCustomer} days`}
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

          {/* Stats */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <StatBox icon={DollarSign} label="Total Spent" value={`$${Number(customer.total_spent)}`} accent="text-emerald-600" />
            <StatBox icon={Calendar} label="Bookings" value={customer.total_bookings} accent="text-blue-600" />
            <StatBox icon={TrendingUp} label="Avg Value" value={`$${analytics?.avgBookingValue || 0}`} accent="text-violet-600" />
            <StatBox icon={Package} label="Orders" value={orders.length} accent="text-orange-600" />
            <StatBox icon={Star} label="Reviews" value={reviews.length} accent="text-amber-600" />
            <StatBox icon={Tag} label="Promos" value={redemptions.length} accent="text-pink-600" />
          </div>
        </div>

        {/* Tabs */}
        <ScrollArea className="flex-1">
          <div className="p-6 pt-4">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">Loading customer data...</div>
            ) : (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full grid grid-cols-5 mb-4">
                  <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                  <TabsTrigger value="bookings" className="text-xs">Bookings</TabsTrigger>
                  <TabsTrigger value="orders" className="text-xs">Orders</TabsTrigger>
                  <TabsTrigger value="reviews" className="text-xs">Reviews</TabsTrigger>
                  <TabsTrigger value="promos" className="text-xs">Promos</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-5">
                  {/* Pets */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><PawPrint className="w-4 h-4" /> Pets</h3>
                    {customer.pets?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {customer.pets.map((p: string) => (
                          <Card key={p} className="bg-muted/40">
                            <CardContent className="p-3 flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <PawPrint className="w-4 h-4 text-primary" />
                              </div>
                              <span className="text-sm font-medium">{p}</span>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No pets recorded</p>
                    )}
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

                {/* Promos Tab */}
                <TabsContent value="promos">
                  {redemptions.length === 0 ? (
                    <EmptyState icon={Tag} text="No promo codes used" />
                  ) : (
                    <div className="space-y-2">
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

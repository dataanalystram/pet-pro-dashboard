import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Megaphone, Plus, Eye, MousePointerClick, DollarSign, Calendar, Pencil, Trash2, Tag, BarChart3, TrendingUp, Users, Percent, Link2, Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCampaigns, useInsert, useUpdate, useDelete, useServices, useCampaignRedemptions } from '@/hooks/use-supabase-data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, parseISO, subDays, isWithinInterval } from 'date-fns';

const typeColors: Record<string, string> = {
  discount: 'bg-emerald-100 text-emerald-700',
  first_time: 'bg-blue-100 text-blue-700',
  loyalty_reward: 'bg-violet-100 text-violet-700',
  seasonal: 'bg-amber-100 text-amber-700',
  flash_sale: 'bg-red-100 text-red-700',
  referral: 'bg-orange-100 text-orange-700',
  bundle: 'bg-secondary text-secondary-foreground',
};

function getCampaignStatus(c: any): { label: string; color: string } {
  if (!c.is_enabled) return { label: 'Disabled', color: 'bg-muted text-muted-foreground' };
  const now = new Date().toISOString().split('T')[0];
  if (c.end_date && c.end_date < now) return { label: 'Expired', color: 'bg-red-100 text-red-700' };
  if (c.start_date && c.start_date > now) return { label: 'Scheduled', color: 'bg-blue-100 text-blue-700' };
  if (c.max_redemptions && c.redemptions >= c.max_redemptions) return { label: 'Maxed Out', color: 'bg-amber-100 text-amber-700' };
  return { label: 'Active', color: 'bg-emerald-100 text-emerald-700' };
}

export default function MarketingPage() {
  const { data: campaigns = [], isLoading } = useCampaigns();
  const { data: services = [] } = useServices();
  const { data: redemptions = [] } = useCampaignRedemptions();
  const insertCampaign = useInsert('campaigns');
  const updateCampaign = useUpdate('campaigns');
  const deleteCampaign = useDelete('campaigns');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [detailCampaign, setDetailCampaign] = useState<any>(null);
  const [form, setForm] = useState({
    name: '', type: 'discount', description: '', discount_type: 'percentage',
    discount_value: '', promo_code: '', start_date: '', end_date: '',
    applicable_service_ids: [] as string[], min_order_value: '0',
    max_uses_per_customer: '', max_redemptions: '', is_enabled: true,
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', type: 'discount', description: '', discount_type: 'percentage', discount_value: '', promo_code: '', start_date: '', end_date: '', applicable_service_ids: [], min_order_value: '0', max_uses_per_customer: '', max_redemptions: '', is_enabled: true });
    setDialogOpen(true);
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({
      name: c.name, type: c.type, description: c.description || '', discount_type: c.discount_type,
      discount_value: c.discount_value.toString(), promo_code: c.promo_code || '',
      start_date: c.start_date || '', end_date: c.end_date || '',
      applicable_service_ids: c.applicable_service_ids || [],
      min_order_value: (c.min_order_value || 0).toString(),
      max_uses_per_customer: c.max_uses_per_customer?.toString() || '',
      max_redemptions: c.max_redemptions?.toString() || '',
      is_enabled: c.is_enabled ?? true,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const payload: any = {
      name: form.name, type: form.type, description: form.description || null,
      discount_type: form.discount_type, discount_value: parseFloat(form.discount_value),
      promo_code: form.promo_code || null, start_date: form.start_date || null, end_date: form.end_date || null,
      applicable_service_ids: form.applicable_service_ids, min_order_value: parseFloat(form.min_order_value) || 0,
      max_uses_per_customer: form.max_uses_per_customer ? parseInt(form.max_uses_per_customer) : null,
      max_redemptions: form.max_redemptions ? parseInt(form.max_redemptions) : null,
      is_enabled: form.is_enabled,
    };
    if (editing) {
      updateCampaign.mutate({ id: editing.id, ...payload }, { onSuccess: () => { toast.success('Campaign updated'); setDialogOpen(false); } });
    } else {
      insertCampaign.mutate({ ...payload, target_audience: 'all', status: 'active' }, { onSuccess: () => { toast.success('Campaign created'); setDialogOpen(false); } });
    }
  };

  const handleToggle = (c: any) => {
    updateCampaign.mutate({ id: c.id, is_enabled: !c.is_enabled }, {
      onSuccess: () => toast.success(`Campaign ${c.is_enabled ? 'disabled' : 'enabled'}`),
    });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this campaign?')) return;
    deleteCampaign.mutate(id, { onSuccess: () => toast.success('Campaign deleted') });
  };

  const toggleService = (serviceId: string) => {
    setForm(f => ({
      ...f,
      applicable_service_ids: f.applicable_service_ids.includes(serviceId)
        ? f.applicable_service_ids.filter(id => id !== serviceId)
        : [...f.applicable_service_ids, serviceId],
    }));
  };

  // Stats
  const totalActive = campaigns.filter(c => (c as any).is_enabled !== false && getCampaignStatus(c).label === 'Active').length;
  const totalRedemptions = campaigns.reduce((s, c) => s + c.redemptions, 0);
  const totalDiscount = redemptions.reduce((s: number, r: any) => s + Number(r.discount_applied || 0), 0);

  // Analytics: redemptions over last 30 days
  const redemptionChart = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'MM/dd');
      days[d] = 0;
    }
    redemptions.forEach((r: any) => {
      const d = format(new Date(r.redeemed_at), 'MM/dd');
      if (days[d] !== undefined) days[d]++;
    });
    return Object.entries(days).map(([date, count]) => ({ date, count }));
  }, [redemptions]);

  // Top campaigns by redemptions
  const topCampaigns = useMemo(() =>
    [...campaigns].sort((a, b) => b.redemptions - a.redemptions).slice(0, 5),
    [campaigns]
  );

  // Campaign detail redemptions
  const detailRedemptions = useMemo(() =>
    detailCampaign ? redemptions.filter((r: any) => r.campaign_id === detailCampaign.id) : [],
    [detailCampaign, redemptions]
  );

  if (isLoading) return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading campaigns...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Marketing</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <Badge variant="secondary" className="text-xs">{campaigns.length} campaigns</Badge>
            <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">{totalActive} active</Badge>
            <Badge variant="secondary" className="text-xs">{totalRedemptions} redemptions</Badge>
            <Badge variant="secondary" className="text-xs">${totalDiscount.toFixed(2)} discounted</Badge>
          </div>
        </div>
        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" /> New Campaign</Button>
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart3 className="w-3.5 h-3.5 mr-1.5" />Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-3 mt-4">
          {campaigns.length === 0 ? (
            <Card><CardContent className="py-16 text-center"><Megaphone className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" /><p className="text-sm text-muted-foreground">No campaigns yet</p><Button onClick={openAdd} className="mt-4" size="sm">Create Your First Campaign</Button></CardContent></Card>
          ) : (
            campaigns.map((c: any) => {
              const status = getCampaignStatus(c);
              const convRate = c.views > 0 ? ((c.redemptions / c.views) * 100).toFixed(1) : '0';
              const usagePercent = c.max_redemptions ? Math.min((c.redemptions / c.max_redemptions) * 100, 100) : null;
              const appliedServices = (c.applicable_service_ids || []).map((sid: string) => services.find(s => s.id === sid)).filter(Boolean);

              return (
                <Card key={c.id} className={cn("hover:shadow-md transition-shadow", !c.is_enabled && "opacity-60")}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3 gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm sm:text-base font-semibold">{c.name}</p>
                          <Badge className={cn("text-[10px]", typeColors[c.type] || typeColors.discount)}>{c.type.replace('_', ' ')}</Badge>
                          <Badge className={cn("text-[10px]", status.color)}>{status.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{c.description}</p>
                        {appliedServices.length > 0 && (
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {appliedServices.map((s: any) => (
                              <Badge key={s.id} variant="outline" className="text-[10px] font-normal">{s.name}</Badge>
                            ))}
                          </div>
                        )}
                        {appliedServices.length === 0 && (c.applicable_service_ids || []).length === 0 && (
                          <p className="text-[10px] text-muted-foreground mt-1">Applies to all services</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Switch checked={c.is_enabled ?? true} onCheckedChange={() => handleToggle(c)} />
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}><Pencil className="w-3 h-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground"><Tag className="w-3.5 h-3.5 flex-shrink-0" /><span className="font-mono font-semibold text-foreground truncate">{c.promo_code || '—'}</span></div>
                      <div className="flex items-center gap-2 text-muted-foreground"><DollarSign className="w-3.5 h-3.5 flex-shrink-0" /><span>{Number(c.discount_value)}{c.discount_type === 'percentage' ? '%' : '$'} off</span></div>
                      <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="w-3.5 h-3.5 flex-shrink-0" /><span className="truncate">{c.start_date || '—'} → {c.end_date || '—'}</span></div>
                      <div className="flex items-center gap-2 text-muted-foreground"><Eye className="w-3.5 h-3.5 flex-shrink-0" /><span>{c.views} views</span></div>
                      <div className="flex items-center gap-2 text-muted-foreground"><MousePointerClick className="w-3.5 h-3.5 flex-shrink-0" /><span>{c.redemptions}{c.max_redemptions ? `/${c.max_redemptions}` : ''} used</span></div>
                      <div className="flex items-center gap-2 text-muted-foreground"><Percent className="w-3.5 h-3.5 flex-shrink-0" /><span>{convRate}% conv.</span></div>
                    </div>

                    {usagePercent !== null && (
                      <div className="mt-2">
                        <Progress value={usagePercent} className="h-1.5" />
                      </div>
                    )}

                    <Button variant="link" size="sm" className="px-0 mt-1 h-6 text-xs" onClick={() => setDetailCampaign(c)}>
                      View redemption history →
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 mt-4">
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{campaigns.length}</p><p className="text-xs text-muted-foreground">Total Campaigns</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{totalActive}</p><p className="text-xs text-muted-foreground">Active</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{totalRedemptions}</p><p className="text-xs text-muted-foreground">Total Redemptions</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">${totalDiscount.toFixed(0)}</p><p className="text-xs text-muted-foreground">Total Discount Given</p></CardContent></Card>
          </div>

          {/* Redemptions over time */}
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Redemptions (Last 30 Days)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={redemptionChart}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} className="text-muted-foreground" />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top performing */}
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Top Performing Campaigns</CardTitle></CardHeader>
            <CardContent>
              {topCampaigns.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No campaigns yet</p>
              ) : (
                <div className="space-y-2">
                  {topCampaigns.map((c, i) => {
                    const totalDiscountForCamp = redemptions.filter((r: any) => r.campaign_id === c.id).reduce((s: number, r: any) => s + Number(r.discount_applied || 0), 0);
                    return (
                      <div key={c.id} className="flex items-center gap-3 text-sm">
                        <span className="w-5 text-muted-foreground font-mono text-xs">#{i + 1}</span>
                        <span className="flex-1 font-medium truncate">{c.name}</span>
                        <span className="text-muted-foreground">{c.redemptions} uses</span>
                        <span className="font-semibold">${totalDiscountForCamp.toFixed(0)} saved</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Campaign form dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Campaign' : 'New Campaign'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between">
              <Label>Enabled</Label>
              <Switch checked={form.is_enabled} onCheckedChange={(v) => setForm(f => ({ ...f, is_enabled: v }))} />
            </div>
            <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">Discount</SelectItem>
                    <SelectItem value="first_time">First Time</SelectItem>
                    <SelectItem value="seasonal">Seasonal</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="flash_sale">Flash Sale</SelectItem>
                    <SelectItem value="bundle">Bundle</SelectItem>
                    <SelectItem value="loyalty_reward">Loyalty Reward</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Discount Type</Label>
                <Select value={form.discount_type} onValueChange={(v) => setForm(f => ({ ...f, discount_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Discount Value *</Label><Input type="number" value={form.discount_value} onChange={(e) => setForm(f => ({ ...f, discount_value: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Promo Code</Label><Input value={form.promo_code} onChange={(e) => setForm(f => ({ ...f, promo_code: e.target.value.toUpperCase() }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>End Date</Label><Input type="date" value={form.end_date} onChange={(e) => setForm(f => ({ ...f, end_date: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Min Order ($)</Label><Input type="number" value={form.min_order_value} onChange={(e) => setForm(f => ({ ...f, min_order_value: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Max Per Customer</Label><Input type="number" placeholder="∞" value={form.max_uses_per_customer} onChange={(e) => setForm(f => ({ ...f, max_uses_per_customer: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Max Redemptions</Label><Input type="number" placeholder="∞" value={form.max_redemptions} onChange={(e) => setForm(f => ({ ...f, max_redemptions: e.target.value }))} /></div>
            </div>

            {/* Service targeting */}
            {services.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Applicable Services (empty = all)</Label>
                <div className="border rounded-lg p-3 max-h-36 overflow-y-auto space-y-2">
                  {services.map(s => (
                    <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={form.applicable_service_ids.includes(s.id)}
                        onCheckedChange={() => toggleService(s.id)}
                      />
                      <span className="truncate">{s.name}</span>
                      <span className="text-muted-foreground ml-auto text-xs">${Number(s.base_price).toFixed(0)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.discount_value}>{editing ? 'Save Changes' : 'Create Campaign'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Redemption history dialog */}
      <Dialog open={!!detailCampaign} onOpenChange={() => setDetailCampaign(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Redemption History — {detailCampaign?.name}</DialogTitle></DialogHeader>
          {detailRedemptions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No redemptions yet</p>
          ) : (
            <div className="divide-y">
              {detailRedemptions.map((r: any) => (
                <div key={r.id} className="py-2.5 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{r.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{r.customer_email || 'No email'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${Number(r.discount_applied).toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">{format(new Date(r.redeemed_at), 'MMM d, HH:mm')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

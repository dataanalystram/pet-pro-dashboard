import { useState, useEffect } from 'react';
import { marketingAPI } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Megaphone, Plus, Eye, MousePointerClick, DollarSign,
  Calendar, Pencil, Trash2, Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, isAfter, isBefore } from 'date-fns';

const typeColors = {
  discount: 'bg-emerald-100 text-emerald-700',
  first_time: 'bg-blue-100 text-blue-700',
  loyalty_reward: 'bg-violet-100 text-violet-700',
  seasonal: 'bg-amber-100 text-amber-700',
  flash_sale: 'bg-red-100 text-red-700',
  referral: 'bg-orange-100 text-orange-700',
  bundle: 'bg-slate-100 text-slate-700',
};

const EMPTY_FORM = {
  name: '', type: 'discount', description: '', discount_type: 'percentage',
  discount_value: '', promo_code: '', target_audience: 'all', start_date: '', end_date: '',
  max_redemptions: '',
};

export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const load = async () => {
    try { const { data } = await marketingAPI.list(); setCampaigns(data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ ...EMPTY_FORM }); setDialogOpen(true); };
  const openEdit = (c) => {
    setEditing(c);
    setForm({
      name: c.name || '', type: c.type || 'discount', description: c.description || '',
      discount_type: c.discount_type || 'percentage', discount_value: c.discount_value?.toString() || '',
      promo_code: c.promo_code || '', target_audience: c.target_audience || 'all',
      start_date: c.start_date?.split('T')[0] || '', end_date: c.end_date?.split('T')[0] || '',
      max_redemptions: c.max_redemptions?.toString() || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      discount_value: form.discount_value ? parseFloat(form.discount_value) : null,
      max_redemptions: form.max_redemptions ? parseInt(form.max_redemptions) : null,
    };
    try {
      if (editing) await marketingAPI.update(editing.id, payload);
      else await marketingAPI.create(payload);
      await load();
      setDialogOpen(false);
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this campaign?')) return;
    await marketingAPI.remove(id);
    await load();
  };

  const now = new Date();
  const activeCampaigns = campaigns.filter((c) => c.is_active && isAfter(parseISO(c.end_date), now));
  const pastCampaigns = campaigns.filter((c) => !c.is_active || isBefore(parseISO(c.end_date), now));

  if (loading) return (
    <div className="space-y-4" data-testid="marketing-skeleton">
      <Skeleton className="h-8 w-48" />{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
    </div>
  );

  return (
    <div className="space-y-6" data-testid="marketing-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Marketing</h1>
          <p className="text-sm text-slate-500">{activeCampaigns.length} active campaigns</p>
        </div>
        <Button onClick={openAdd} className="bg-provider-primary hover:bg-blue-700" data-testid="add-campaign-btn">
          <Plus className="w-4 h-4 mr-2" /> New Campaign
        </Button>
      </div>

      {/* Active campaigns */}
      {activeCampaigns.length > 0 && (
        <div className="space-y-3" data-testid="active-campaigns">
          {activeCampaigns.map((c) => <CampaignCard key={c.id} campaign={c} onEdit={openEdit} onDelete={handleDelete} />)}
        </div>
      )}

      {activeCampaigns.length === 0 && (
        <Card className="border-slate-200"><CardContent className="py-16 text-center">
          <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No active campaigns</p>
          <Button onClick={openAdd} className="mt-4 bg-provider-primary hover:bg-blue-700" size="sm">Create Your First Campaign</Button>
        </CardContent></Card>
      )}

      {/* Past campaigns */}
      {pastCampaigns.length > 0 && (
        <div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-3">Past Campaigns</p>
          <div className="space-y-3">{pastCampaigns.map((c) => <CampaignCard key={c.id} campaign={c} onEdit={openEdit} onDelete={handleDelete} />)}</div>
        </div>
      )}

      {/* Campaign Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg" data-testid="campaign-dialog">
          <DialogHeader><DialogTitle>{editing ? 'Edit Campaign' : 'Create Campaign'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
            <div className="space-y-1.5"><Label>Campaign Name *</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({...f, name: e.target.value}))} data-testid="campaign-name-input" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm(f => ({...f, type: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">Discount</SelectItem><SelectItem value="first_time">First Time</SelectItem>
                    <SelectItem value="loyalty_reward">Loyalty Reward</SelectItem><SelectItem value="seasonal">Seasonal</SelectItem>
                    <SelectItem value="flash_sale">Flash Sale</SelectItem><SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="bundle">Bundle</SelectItem>
                  </SelectContent>
                </Select></div>
              <div className="space-y-1.5"><Label>Target Audience</Label>
                <Select value={form.target_audience} onValueChange={(v) => setForm(f => ({...f, target_audience: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem><SelectItem value="new_customers">New Customers</SelectItem>
                    <SelectItem value="returning">Returning</SelectItem><SelectItem value="vip">VIP Only</SelectItem>
                  </SelectContent>
                </Select></div>
            </div>
            <div className="space-y-1.5"><Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm(f => ({...f, description: e.target.value}))} rows={2} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Discount Type</Label>
                <Select value={form.discount_type} onValueChange={(v) => setForm(f => ({...f, discount_type: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem><SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="free_addon">Free Add-on</SelectItem>
                  </SelectContent>
                </Select></div>
              <div className="space-y-1.5"><Label>Value</Label>
                <Input type="number" value={form.discount_value} onChange={(e) => setForm(f => ({...f, discount_value: e.target.value}))} /></div>
              <div className="space-y-1.5"><Label>Promo Code</Label>
                <Input value={form.promo_code} onChange={(e) => setForm(f => ({...f, promo_code: e.target.value.toUpperCase()}))} placeholder="e.g. SAVE20" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Start Date *</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm(f => ({...f, start_date: e.target.value}))} /></div>
              <div className="space-y-1.5"><Label>End Date *</Label>
                <Input type="date" value={form.end_date} onChange={(e) => setForm(f => ({...f, end_date: e.target.value}))} /></div>
              <div className="space-y-1.5"><Label>Max Redemptions</Label>
                <Input type="number" value={form.max_redemptions} onChange={(e) => setForm(f => ({...f, max_redemptions: e.target.value}))} placeholder="Unlimited" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-provider-primary hover:bg-blue-700" disabled={!form.name || !form.start_date || !form.end_date} data-testid="save-campaign-btn">
              {editing ? 'Save Changes' : 'Create Campaign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CampaignCard({ campaign: c, onEdit, onDelete }) {
  const now = new Date();
  const isExpired = isBefore(parseISO(c.end_date), now);
  const isUpcoming = isAfter(parseISO(c.start_date), now);

  return (
    <Card className={cn("border-slate-200 transition-all", isExpired && "opacity-60")} data-testid={`campaign-card-${c.id}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-slate-900">{c.name}</p>
              <Badge className={cn("text-[10px]", typeColors[c.type] || typeColors.discount)}>{c.type?.replace('_', ' ')}</Badge>
              {isExpired && <Badge variant="secondary" className="text-[10px]">Expired</Badge>}
              {isUpcoming && <Badge className="bg-blue-100 text-blue-700 text-[10px]">Upcoming</Badge>}
            </div>
            {c.description && <p className="text-xs text-slate-500">{c.description}</p>}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(c)} className="h-7 w-7"><Pencil className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(c.id)} className="h-7 w-7 text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-3">
          {c.promo_code && (
            <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-xs font-mono text-slate-700">
              <Tag className="w-3 h-3" /> {c.promo_code}
            </div>
          )}
          {c.discount_value && (
            <div className="text-xs text-slate-600">
              {c.discount_type === 'percentage' ? `${c.discount_value}% off` : `€${c.discount_value} off`}
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Calendar className="w-3 h-3" />
            {c.start_date ? format(parseISO(c.start_date), 'MMM d') : '?'} - {c.end_date ? format(parseISO(c.end_date), 'MMM d, yyyy') : '?'}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <MetricBox icon={Eye} label="Views" value={c.views || 0} />
          <MetricBox icon={MousePointerClick} label="Clicks" value={c.clicks || 0} />
          <MetricBox icon={Tag} label="Redeemed" value={`${c.current_redemptions || 0}${c.max_redemptions ? `/${c.max_redemptions}` : ''}`} />
          <MetricBox icon={DollarSign} label="Revenue" value={`€${(c.revenue_generated || 0).toFixed(0)}`} />
        </div>
      </CardContent>
    </Card>
  );
}

function MetricBox({ icon: Icon, label, value }) {
  return (
    <div className="bg-slate-50 rounded-lg p-2 text-center">
      <Icon className="w-3.5 h-3.5 text-slate-400 mx-auto mb-0.5" />
      <p className="text-sm font-bold text-slate-900">{value}</p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </div>
  );
}

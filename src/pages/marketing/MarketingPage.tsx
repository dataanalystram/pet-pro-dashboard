import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Megaphone, Plus, Eye, MousePointerClick, DollarSign, Calendar, Pencil, Trash2, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCampaigns, useInsert, useUpdate, useDelete } from '@/hooks/use-supabase-data';

const typeColors: Record<string, string> = {
  discount: 'bg-emerald-100 text-emerald-700', first_time: 'bg-blue-100 text-blue-700',
  loyalty_reward: 'bg-violet-100 text-violet-700', seasonal: 'bg-amber-100 text-amber-700',
  flash_sale: 'bg-red-100 text-red-700', referral: 'bg-orange-100 text-orange-700',
  bundle: 'bg-secondary text-secondary-foreground',
};

export default function MarketingPage() {
  const { data: campaigns = [], isLoading } = useCampaigns();
  const insertCampaign = useInsert('campaigns');
  const updateCampaign = useUpdate('campaigns');
  const deleteCampaign = useDelete('campaigns');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', type: 'discount', description: '', discount_type: 'percentage', discount_value: '', promo_code: '', start_date: '', end_date: '' });

  const openAdd = () => { setEditing(null); setForm({ name: '', type: 'discount', description: '', discount_type: 'percentage', discount_value: '', promo_code: '', start_date: '', end_date: '' }); setDialogOpen(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ name: c.name, type: c.type, description: c.description || '', discount_type: c.discount_type, discount_value: c.discount_value.toString(), promo_code: c.promo_code || '', start_date: c.start_date || '', end_date: c.end_date || '' }); setDialogOpen(true); };

  const handleSave = () => {
    const payload = { name: form.name, type: form.type, description: form.description || null, discount_type: form.discount_type, discount_value: parseFloat(form.discount_value), promo_code: form.promo_code || null, start_date: form.start_date || null, end_date: form.end_date || null };
    if (editing) {
      updateCampaign.mutate({ id: editing.id, ...payload }, { onSuccess: () => { toast.success('Campaign updated'); setDialogOpen(false); } });
    } else {
      insertCampaign.mutate({ ...payload, target_audience: 'all', status: 'active' }, { onSuccess: () => { toast.success('Campaign created'); setDialogOpen(false); } });
    }
  };

  const handleDelete = (id: string) => { if (!window.confirm('Delete this campaign?')) return; deleteCampaign.mutate(id, { onSuccess: () => toast.success('Campaign deleted') }); };

  if (isLoading) return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading campaigns...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl sm:text-2xl font-semibold">Marketing</h1><p className="text-sm text-muted-foreground">{campaigns.length} campaigns</p></div>
        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" /> New Campaign</Button>
      </div>

      {campaigns.length === 0 ? (
        <Card><CardContent className="py-16 text-center"><Megaphone className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" /><p className="text-sm text-muted-foreground">No campaigns yet</p><Button onClick={openAdd} className="mt-4" size="sm">Create Your First Campaign</Button></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap"><p className="text-sm sm:text-base font-semibold">{c.name}</p><Badge className={cn("text-[10px]", typeColors[c.type] || typeColors.discount)}>{c.type.replace('_', ' ')}</Badge></div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{c.description}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}><Pencil className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground"><Tag className="w-3.5 h-3.5 flex-shrink-0" /><span className="font-mono font-semibold text-foreground truncate">{c.promo_code}</span></div>
                  <div className="flex items-center gap-2 text-muted-foreground"><DollarSign className="w-3.5 h-3.5 flex-shrink-0" /><span>{Number(c.discount_value)}{c.discount_type === 'percentage' ? '%' : '$'} off</span></div>
                  <div className="flex items-center gap-2 text-muted-foreground col-span-2 sm:col-span-1"><Calendar className="w-3.5 h-3.5 flex-shrink-0" /><span className="truncate">{c.start_date} - {c.end_date}</span></div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Eye className="w-3.5 h-3.5 flex-shrink-0" /><span>{c.views} views</span></div>
                  <div className="flex items-center gap-2 text-muted-foreground"><MousePointerClick className="w-3.5 h-3.5 flex-shrink-0" /><span>{c.redemptions} used</span></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit Campaign' : 'New Campaign'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Type</Label><Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="discount">Discount</SelectItem><SelectItem value="first_time">First Time</SelectItem><SelectItem value="seasonal">Seasonal</SelectItem><SelectItem value="referral">Referral</SelectItem><SelectItem value="flash_sale">Flash Sale</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Discount Value *</Label><Input type="number" value={form.discount_value} onChange={(e) => setForm(f => ({ ...f, discount_value: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Promo Code</Label><Input value={form.promo_code} onChange={(e) => setForm(f => ({ ...f, promo_code: e.target.value.toUpperCase() }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>End Date</Label><Input type="date" value={form.end_date} onChange={(e) => setForm(f => ({ ...f, end_date: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={!form.name || !form.discount_value}>{editing ? 'Save Changes' : 'Create Campaign'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

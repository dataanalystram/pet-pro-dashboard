import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Minus, Trash2, Package, Tag, CheckCircle2, XCircle } from 'lucide-react';
import { useInventory, useInsert, useUpdate, useCampaigns } from '@/hooks/use-supabase-data';
import { toast } from 'sonner';

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface OrderItem {
  inventory_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  image_url: string;
}

interface AppliedPromo {
  campaign_id: string;
  promo_code: string;
  discount_type: string;
  discount_value: number;
  discount_amount: number;
}

export default function CreateOrderDialog({ open, onOpenChange }: CreateOrderDialogProps) {
  const { data: products = [] } = useInventory();
  const { data: campaigns = [] } = useCampaigns();
  const insertOrder = useInsert('orders');
  const insertRedemption = useInsert('campaign_redemptions');
  const updateInventory = useUpdate('inventory');
  const updateCampaign = useUpdate('campaigns');

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [productSearch, setProductSearch] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
  const [promoError, setPromoError] = useState('');

  const filteredProducts = products.filter(p =>
    (p.status === 'active' || !(p as any).status) &&
    p.name.toLowerCase().includes(productSearch.toLowerCase()) &&
    !items.some(item => item.inventory_id === p.id)
  );

  const addProduct = (product: any) => {
    setItems(prev => [...prev, {
      inventory_id: product.id,
      name: product.name,
      quantity: 1,
      unit_price: Number(product.retail_price || product.cost_per_unit || 0),
      image_url: product.images?.[0] || '',
    }]);
    setProductSearch('');
  };

  const updateQty = (id: string, delta: number) => {
    setItems(prev => prev.map(item =>
      item.inventory_id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.inventory_id !== id));

  const round2 = (n: number) => Math.round(n * 100) / 100;
  const subtotal = round2(items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0));
  const promoDiscount = round2(appliedPromo?.discount_amount || 0);
  const taxableAmount = Math.max(0, subtotal - promoDiscount);
  const tax = round2(taxableAmount * 0.1);
  const total = round2(taxableAmount + tax);

  const validatePromo = () => {
    setPromoError('');
    setAppliedPromo(null);
    if (!promoCode.trim()) return;

    const campaign = campaigns.find((c: any) =>
      c.promo_code?.toUpperCase() === promoCode.toUpperCase() && (c.is_enabled ?? true)
    ) as any;

    if (!campaign) { setPromoError('Invalid promo code'); return; }

    const now = new Date().toISOString().split('T')[0];
    if (campaign.start_date && campaign.start_date > now) { setPromoError('Campaign not yet active'); return; }
    if (campaign.end_date && campaign.end_date < now) { setPromoError('Campaign has expired'); return; }
    if (campaign.max_redemptions && campaign.redemptions >= campaign.max_redemptions) { setPromoError('Campaign fully redeemed'); return; }
    if (campaign.min_order_value && subtotal < Number(campaign.min_order_value)) {
      setPromoError(`Minimum order $${Number(campaign.min_order_value).toFixed(2)} required`); return;
    }

    let discountAmt = 0;
    if (campaign.discount_type === 'percentage') {
      discountAmt = Math.min(subtotal, round2(subtotal * (Number(campaign.discount_value) / 100)));
    } else {
      discountAmt = Math.min(Number(campaign.discount_value), subtotal);
    }

    setAppliedPromo({
      campaign_id: campaign.id,
      promo_code: campaign.promo_code,
      discount_type: campaign.discount_type,
      discount_value: Number(campaign.discount_value),
      discount_amount: round2(discountAmt),
    });
    toast.success('Promo code applied!');
  };

  const removePromo = () => { setAppliedPromo(null); setPromoCode(''); setPromoError(''); };

  const handleCreate = async () => {
    if (!customerName || items.length === 0) {
      toast.error('Customer name and at least one item required');
      return;
    }

    insertOrder.mutate({
      customer_name: customerName,
      customer_email: customerEmail || null,
      customer_phone: customerPhone || null,
      items,
      subtotal,
      tax,
      discount: promoDiscount,
      total,
      notes: notes || null,
      payment_method: paymentMethod,
      payment_status: 'unpaid',
      status: 'pending',
    }, {
      onSuccess: (order: any) => {
        // Deduct stock
        items.forEach(item => {
          const product = products.find(p => p.id === item.inventory_id);
          if (product) {
            updateInventory.mutate({
              id: product.id,
              quantity_in_stock: Math.max(0, product.quantity_in_stock - item.quantity),
              total_sold: ((product as any).total_sold || 0) + item.quantity,
            });
          }
        });

        // Record promo redemption
        if (appliedPromo) {
          insertRedemption.mutate({
            campaign_id: appliedPromo.campaign_id,
            customer_name: customerName,
            customer_email: customerEmail || null,
            order_id: order?.id || null,
            discount_applied: appliedPromo.discount_amount,
          });
          // Increment campaign redemptions
          const campaign = campaigns.find(c => c.id === appliedPromo.campaign_id);
          if (campaign) {
            updateCampaign.mutate({
              id: campaign.id,
              redemptions: campaign.redemptions + 1,
            });
          }
        }

        toast.success('Order created successfully');
        setCustomerName(''); setCustomerEmail(''); setCustomerPhone('');
        setItems([]); setNotes(''); setPaymentMethod('cash');
        setPromoCode(''); setAppliedPromo(null); setPromoError('');
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Customer */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Customer Info</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Name *</Label><Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer name" /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="email@example.com" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Phone</Label><Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="+1 234 567" /></div>
              <div className="space-y-1.5">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Product Search */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Add Products</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Search products to add..." className="pl-9" />
            </div>
            {productSearch && filteredProducts.length > 0 && (
              <div className="border rounded-lg max-h-40 overflow-y-auto divide-y">
                {filteredProducts.slice(0, 5).map(p => (
                  <button key={p.id} onClick={() => addProduct(p)} className="w-full flex items-center gap-3 p-2.5 hover:bg-muted transition-colors text-left">
                    <div className="w-8 h-8 rounded bg-muted border flex items-center justify-center overflow-hidden flex-shrink-0">
                      {(p as any).images?.[0] ? <img src={(p as any).images[0]} alt="" className="w-full h-full object-cover" /> : <Package className="w-3.5 h-3.5 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.quantity_in_stock} in stock</p>
                    </div>
                    <span className="text-sm font-semibold">${Number(p.retail_price || p.cost_per_unit || 0).toFixed(2)}</span>
                    <Plus className="w-4 h-4 text-primary" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Order Items */}
          {items.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Order Items</Label>
              {items.map(item => (
                <div key={item.inventory_id} className="flex items-center gap-3 p-2.5 rounded-lg border bg-card">
                  <div className="w-10 h-10 rounded bg-muted border flex items-center justify-center overflow-hidden flex-shrink-0">
                    {item.image_url ? <img src={item.image_url} alt="" className="w-full h-full object-cover" /> : <Package className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">${item.unit_price.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.inventory_id, -1)}><Minus className="w-3 h-3" /></Button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.inventory_id, 1)}><Plus className="w-3 h-3" /></Button>
                  </div>
                  <span className="text-sm font-bold w-16 text-right">${(item.quantity * item.unit_price).toFixed(2)}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItem(item.inventory_id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                </div>
              ))}
            </div>
          )}

          {/* Promo Code */}
          {items.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Promo Code</Label>
              {appliedPromo ? (
                <div className="flex items-center gap-2 p-2.5 rounded-lg border border-emerald-200 bg-emerald-50">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-emerald-700">{appliedPromo.promo_code} applied</p>
                    <p className="text-xs text-emerald-600">-${appliedPromo.discount_amount.toFixed(2)} ({appliedPromo.discount_value}{appliedPromo.discount_type === 'percentage' ? '%' : '$'} off)</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={removePromo}><XCircle className="w-4 h-4 text-muted-foreground" /></Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input value={promoCode} onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); }} placeholder="Enter code" className="pl-9" />
                  </div>
                  <Button variant="outline" onClick={validatePromo} disabled={!promoCode.trim()}>Apply</Button>
                </div>
              )}
              {promoError && <p className="text-xs text-destructive">{promoError}</p>}
            </div>
          )}

          {/* Totals */}
          {items.length > 0 && (
            <div className="p-3 rounded-lg bg-muted space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              {promoDiscount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-${promoDiscount.toFixed(2)}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Tax (10%)</span><span>${tax.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-base pt-1 border-t"><span>Total</span><span>${total.toFixed(2)}</span></div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Order notes..." />
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!customerName || items.length === 0 || insertOrder.isPending}>
            Create Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

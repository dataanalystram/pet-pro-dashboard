import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Minus, Trash2, Package } from 'lucide-react';
import { useInventory, useInsert, useUpdate } from '@/hooks/use-supabase-data';
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

export default function CreateOrderDialog({ open, onOpenChange }: CreateOrderDialogProps) {
  const { data: products = [] } = useInventory();
  const insertOrder = useInsert('orders');
  const updateInventory = useUpdate('inventory');

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [productSearch, setProductSearch] = useState('');

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

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

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
      discount: 0,
      total,
      notes: notes || null,
      payment_method: paymentMethod,
      payment_status: 'unpaid',
      status: 'pending',
    }, {
      onSuccess: () => {
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
        toast.success('Order created successfully');
        // Reset
        setCustomerName(''); setCustomerEmail(''); setCustomerPhone('');
        setItems([]); setNotes(''); setPaymentMethod('cash');
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
                  <button
                    key={p.id}
                    onClick={() => addProduct(p)}
                    className="w-full flex items-center gap-3 p-2.5 hover:bg-muted transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded bg-muted border flex items-center justify-center overflow-hidden flex-shrink-0">
                      {(p as any).images?.[0] ? (
                        <img src={(p as any).images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
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
                    {item.image_url ? (
                      <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">${item.unit_price.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.inventory_id, -1)}>
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.inventory_id, 1)}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <span className="text-sm font-bold w-16 text-right">${(item.quantity * item.unit_price).toFixed(2)}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItem(item.inventory_id)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Totals */}
          {items.length > 0 && (
            <div className="p-3 rounded-lg bg-muted space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
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

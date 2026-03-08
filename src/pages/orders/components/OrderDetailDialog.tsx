import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Package, User, MapPin, CreditCard, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { useUpdate } from '@/hooks/use-supabase-data';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  processing: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  shipped: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled: 'bg-destructive/10 text-destructive',
  refunded: 'bg-muted text-muted-foreground',
};
const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

interface OrderDetailDialogProps {
  order: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function OrderDetailDialog({ order, open, onOpenChange }: OrderDetailDialogProps) {
  const updateOrder = useUpdate('orders');

  if (!order) return null;

  const items = order.items || [];
  const address = order.shipping_address || {};

  const handleStatusChange = (newStatus: string) => {
    updateOrder.mutate({ id: order.id, status: newStatus }, {
      onSuccess: () => toast.success(`Order updated to ${newStatus}`),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="font-mono">{order.order_number}</DialogTitle>
            <Badge className={cn('border-0', statusColors[order.status])}>{order.status}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{format(new Date(order.created_at), 'PPP p')}</p>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Customer */}
          <div className="flex items-start gap-3">
            <User className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">{order.customer_name}</p>
              {order.customer_email && <p className="text-xs text-muted-foreground">{order.customer_email}</p>}
              {order.customer_phone && <p className="text-xs text-muted-foreground">{order.customer_phone}</p>}
            </div>
          </div>

          {/* Shipping Address */}
          {address.line1 && (
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div className="text-sm">
                <p>{address.line1}</p>
                {address.line2 && <p>{address.line2}</p>}
                <p>{[address.city, address.state, address.zip].filter(Boolean).join(', ')}</p>
              </div>
            </div>
          )}

          <Separator />

          {/* Items */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Items ({items.length})</p>
            <div className="space-y-2">
              {items.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted">
                  <div className="w-10 h-10 rounded bg-background border flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity} × ${Number(item.unit_price).toFixed(2)}</p>
                  </div>
                  <p className="text-sm font-semibold">${(item.quantity * item.unit_price).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${Number(order.subtotal).toFixed(2)}</span></div>
            {Number(order.tax) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>${Number(order.tax).toFixed(2)}</span></div>}
            {Number(order.discount) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="text-emerald-600">-${Number(order.discount).toFixed(2)}</span></div>}
            <div className="flex justify-between font-bold text-base pt-1 border-t"><span>Total</span><span>${Number(order.total).toFixed(2)}</span></div>
          </div>

          {/* Payment & Tracking */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="capitalize">{order.payment_method || 'N/A'}</span>
              <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'} className="text-[10px] ml-1">{order.payment_status}</Badge>
            </div>
            {order.tracking_number && (
              <div className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-mono text-xs">{order.tracking_number}</span>
              </div>
            )}
          </div>

          {order.notes && (
            <div className="p-3 rounded-lg bg-muted text-sm">
              <p className="text-xs text-muted-foreground mb-1">Notes</p>
              <p>{order.notes}</p>
            </div>
          )}

          <Separator />

          {/* Status Update */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Update Status:</span>
            <Select value={order.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {statuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

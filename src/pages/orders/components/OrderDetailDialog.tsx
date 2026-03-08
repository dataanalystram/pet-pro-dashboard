import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Package, User, MapPin, CreditCard, Truck, Check } from 'lucide-react';
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
const statusPipeline = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
const allStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

interface OrderDetailDialogProps {
  order: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIdx = statusPipeline.indexOf(currentStatus);
  const isCancelled = currentStatus === 'cancelled' || currentStatus === 'refunded';

  return (
    <div className="flex items-center gap-0 w-full">
      {statusPipeline.map((step, i) => {
        const isCompleted = !isCancelled && i <= currentIdx;
        const isCurrent = !isCancelled && i === currentIdx;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-initial">
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all border-2',
                isCompleted
                  ? 'bg-primary border-primary text-primary-foreground'
                  : isCancelled
                    ? 'bg-destructive/10 border-destructive/30 text-destructive'
                    : 'bg-muted border-border text-muted-foreground'
              )}>
                {isCompleted ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <span className={cn(
                'text-[9px] uppercase tracking-wider font-medium text-center',
                isCurrent ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {step}
              </span>
            </div>
            {i < statusPipeline.length - 1 && (
              <div className={cn(
                'h-0.5 flex-1 mx-1 rounded-full',
                !isCancelled && i < currentIdx ? 'bg-primary' : 'bg-border'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
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
            <DialogTitle className="font-mono text-lg">{order.order_number}</DialogTitle>
            <Badge className={cn('border-0', statusColors[order.status])}>{order.status}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{format(new Date(order.created_at), 'PPP · h:mm a')}</p>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Status Timeline */}
          <div className="p-4 rounded-xl bg-muted/50 border">
            <StatusTimeline currentStatus={order.status} />
          </div>

          {/* Customer */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-card border">
            <div className="p-2 rounded-lg bg-primary/10">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">{order.customer_name}</p>
              {order.customer_email && <p className="text-xs text-muted-foreground">{order.customer_email}</p>}
              {order.customer_phone && <p className="text-xs text-muted-foreground">{order.customer_phone}</p>}
            </div>
          </div>

          {/* Shipping Address */}
          {address.line1 && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-card border">
              <div className="p-2 rounded-lg bg-info/10">
                <MapPin className="w-4 h-4 text-info" />
              </div>
              <div className="text-sm">
                <p>{address.line1}</p>
                {address.line2 && <p>{address.line2}</p>}
                <p className="text-muted-foreground">{[address.city, address.state, address.zip].filter(Boolean).join(', ')}</p>
              </div>
            </div>
          )}

          {/* Items */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Items ({items.length})</p>
            <div className="space-y-2">
              {items.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50 border">
                  <div className="w-12 h-12 rounded-lg bg-background border overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {item.image_url ? (
                      <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity} × ${Number(item.unit_price).toFixed(2)}</p>
                  </div>
                  <p className="text-sm font-bold">${(item.quantity * item.unit_price).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="p-4 rounded-xl bg-muted/50 border space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${Number(order.subtotal).toFixed(2)}</span></div>
            {Number(order.tax) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>${Number(order.tax).toFixed(2)}</span></div>}
            {Number(order.discount) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="text-success">-${Number(order.discount).toFixed(2)}</span></div>}
            <Separator />
            <div className="flex justify-between font-bold text-lg"><span>Total</span><span>${Number(order.total).toFixed(2)}</span></div>
          </div>

          {/* Payment & Tracking */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-card border">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Payment</span>
              </div>
              <p className="text-sm font-medium capitalize">{order.payment_method || 'N/A'}</p>
              <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'} className="text-[10px] mt-1">
                {order.payment_status === 'paid' ? '✓ ' : ''}{order.payment_status}
              </Badge>
            </div>
            {order.tracking_number && (
              <div className="p-3 rounded-lg bg-card border">
                <div className="flex items-center gap-2 mb-1">
                  <Truck className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Tracking</span>
                </div>
                <p className="font-mono text-sm font-medium">{order.tracking_number}</p>
              </div>
            )}
          </div>

          {order.notes && (
            <div className="p-3 rounded-xl bg-muted/50 border text-sm">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Notes</p>
              <p>{order.notes}</p>
            </div>
          )}

          <Separator />

          {/* Status Update */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Update Status:</span>
            <Select value={order.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {allStatuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

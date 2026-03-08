import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Package, ShoppingBag, DollarSign, Clock } from 'lucide-react';
import { useOrders } from '@/hooks/use-supabase-data';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import OrderDetailDialog from './components/OrderDetailDialog';
import CreateOrderDialog from './components/CreateOrderDialog';

const statusConfig: Record<string, { dot: string; badge: string }> = {
  pending: { dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  confirmed: { dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  processing: { dot: 'bg-purple-500', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  shipped: { dot: 'bg-indigo-500', badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  delivered: { dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  cancelled: { dot: 'bg-destructive', badge: 'bg-destructive/10 text-destructive' },
  refunded: { dot: 'bg-muted-foreground', badge: 'bg-muted text-muted-foreground' },
};

const statuses = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const paymentStatuses = ['all', 'paid', 'unpaid', 'refunded'];

export default function OrdersPage() {
  const { data: orders = [], isLoading } = useOrders();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const stats = useMemo(() => {
    const valid = orders.filter(o => o.status !== 'cancelled' && o.status !== 'refunded');
    const revenue = valid.reduce((sum, o) => sum + Number(o.total), 0);
    const pending = orders.filter(o => o.status === 'pending').length;
    return { total: orders.length, revenue, pending };
  }, [orders]);

  const filtered = orders.filter(o => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (paymentFilter !== 'all' && o.payment_status !== paymentFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return o.order_number?.toLowerCase().includes(q) || o.customer_name?.toLowerCase().includes(q);
    }
    return true;
  });

  if (isLoading) return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading orders...</div>;

  return (
    <div className="space-y-4">
      {/* Header with inline stats */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-semibold">Orders</h1>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-[11px] font-medium gap-1 px-2 py-0.5">
                {stats.total} orders
              </Badge>
              <Badge variant="secondary" className="text-[11px] font-medium gap-1 px-2 py-0.5">
                <DollarSign className="w-3 h-3" />${stats.revenue.toFixed(0)}
              </Badge>
              {stats.pending > 0 && (
                <Badge variant="secondary" className="text-[11px] font-medium gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">
                  <Clock className="w-3 h-3" />{stats.pending} pending
                </Badge>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">Track, manage and fulfill customer orders</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm" className="shadow-sm">
          <Plus className="w-4 h-4 mr-1.5" /> New Order
        </Button>
      </div>

      {/* Compact filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map(s => (
              <SelectItem key={s} value={s} className="text-xs">
                <span className="flex items-center gap-2">
                  {s !== 'all' && <span className={cn('w-1.5 h-1.5 rounded-full inline-block', statusConfig[s]?.dot)} />}
                  <span className="capitalize">{s === 'all' ? 'All Statuses' : s}</span>
                  {s !== 'all' && <span className="text-muted-foreground ml-1">({orders.filter(o => o.status === s).length})</span>}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-[130px] h-9 text-xs">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            {paymentStatuses.map(s => (
              <SelectItem key={s} value={s} className="text-xs capitalize">
                {s === 'all' ? 'All Payments' : s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 text-xs" />
        </div>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-2 md:hidden">
        {filtered.map(order => {
          const items = order.items as any[] || [];
          const cfg = statusConfig[order.status] || statusConfig.pending;
          return (
            <Card key={order.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => setSelectedOrder(order)}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold">{order.order_number}</span>
                    <span className="text-[10px] text-muted-foreground">{format(new Date(order.created_at), 'MMM d, h:mm a')}</span>
                  </div>
                  <Badge className={cn('border-0 text-[10px] gap-1', cfg.badge)}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
                    {order.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    {items[0]?.image_url && (
                      <img src={items[0].image_url} alt="" className="w-7 h-7 rounded object-cover border flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{order.customer_name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {items.length > 0 ? items[0].name : 'No items'}
                        {items.length > 1 ? ` +${items.length - 1}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold ml-2">${Number(order.total).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Desktop Table -- merged columns for density */}
      <Card className="hidden md:block overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 py-2.5">Order / Date</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 py-2.5">Customer</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 py-2.5">Items</th>
                  <th className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 py-2.5">Total</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(order => {
                  const items = order.items as any[] || [];
                  const cfg = statusConfig[order.status] || statusConfig.pending;
                  return (
                    <tr key={order.id} className="hover:bg-muted/30 cursor-pointer transition-colors group" onClick={() => setSelectedOrder(order)}>
                      {/* Order # + Date merged */}
                      <td className="px-3 py-2">
                        <span className="font-mono text-xs font-semibold text-primary group-hover:underline block">{order.order_number}</span>
                        <span className="text-[10px] text-muted-foreground">{format(new Date(order.created_at), 'MMM d · h:mm a')}</span>
                      </td>
                      {/* Customer */}
                      <td className="px-3 py-2">
                        <p className="text-sm font-medium leading-tight">{order.customer_name}</p>
                        {order.customer_email && <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">{order.customer_email}</p>}
                      </td>
                      {/* Items */}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-1.5">
                            {items.slice(0, 2).map((item: any, i: number) => (
                              <div key={i} className="w-7 h-7 rounded border-2 border-background overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                                {item.image_url ? (
                                  <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-3 h-3 text-muted-foreground" />
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs truncate max-w-[110px]">{items[0]?.name || '-'}</p>
                            {items.length > 1 && <p className="text-[10px] text-muted-foreground">+{items.length - 1} more</p>}
                          </div>
                        </div>
                      </td>
                      {/* Total */}
                      <td className="px-3 py-2 text-right">
                        <span className="text-sm font-bold">${Number(order.total).toFixed(2)}</span>
                      </td>
                      {/* Status + Payment merged */}
                      <td className="px-3 py-2">
                        <Badge className={cn('border-0 text-[10px] gap-1 font-medium', cfg.badge)}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
                          {order.status}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {order.payment_status === 'paid' ? '✓ ' : ''}{order.payment_status}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
            <ShoppingBag className="w-6 h-6 opacity-40" />
          </div>
          <p className="font-semibold text-foreground text-sm">No orders found</p>
          <p className="text-xs mt-1 mb-3">
            {statusFilter !== 'all' ? `No ${statusFilter} orders` : 'Create your first order to get started'}
          </p>
          {statusFilter === 'all' && (
            <Button onClick={() => setCreateOpen(true)} variant="outline" size="sm" className="text-xs">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Create Order
            </Button>
          )}
        </div>
      )}

      <OrderDetailDialog order={selectedOrder} open={!!selectedOrder} onOpenChange={open => !open && setSelectedOrder(null)} />
      <CreateOrderDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

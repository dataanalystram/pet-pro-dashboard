import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Package, ShoppingBag } from 'lucide-react';
import { useOrders } from '@/hooks/use-supabase-data';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import OrderStatsRow from './components/OrderStatsRow';
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

const tabs = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function OrdersPage() {
  const { data: orders = [], isLoading } = useOrders();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = orders.filter(o => {
    if (tab !== 'all' && o.status !== tab) return false;
    if (search) {
      const q = search.toLowerCase();
      return o.order_number?.toLowerCase().includes(q) || o.customer_name?.toLowerCase().includes(q);
    }
    return true;
  });

  if (isLoading) return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading orders...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-semibold">Orders</h1>
            <Badge variant="secondary" className="text-xs font-medium">{orders.length} total</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">Track, manage and fulfill customer orders</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> New Order
        </Button>
      </div>

      <OrderStatsRow orders={orders} />

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <Tabs value={tab} onValueChange={setTab} className="w-full sm:w-auto">
          <TabsList className="w-full sm:w-auto overflow-x-auto">
            {tabs.map(t => (
              <TabsTrigger key={t} value={t} className="capitalize text-xs px-3 gap-1.5">
                {t !== 'all' && <span className={cn('w-1.5 h-1.5 rounded-full', statusConfig[t]?.dot)} />}
                {t === 'all' ? 'All' : t}
                {t !== 'all' && (
                  <span className="text-[10px] text-muted-foreground">
                    {orders.filter(o => o.status === t).length}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by order # or customer..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-3 md:hidden">
        {filtered.map(order => {
          const items = order.items as any[] || [];
          const cfg = statusConfig[order.status] || statusConfig.pending;
          return (
            <Card key={order.id} className="cursor-pointer hover:shadow-md transition-all border-l-[3px]" style={{ borderLeftColor: `var(--${order.status === 'delivered' ? 'success' : order.status === 'pending' ? 'warning' : 'primary'})` }} onClick={() => setSelectedOrder(order)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm font-semibold">{order.order_number}</span>
                  <Badge className={cn('border-0 text-[10px] gap-1', cfg.badge)}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
                    {order.status}
                  </Badge>
                </div>
                <p className="text-sm font-medium">{order.customer_name}</p>
                <div className="flex items-center gap-2 mt-2">
                  {items[0]?.image_url && (
                    <img src={items[0].image_url} alt="" className="w-8 h-8 rounded object-cover border" />
                  )}
                  <span className="text-sm text-muted-foreground flex-1 truncate">
                    {items.length > 0 ? items[0].name : 'No items'}
                    {items.length > 1 ? ` +${items.length - 1} more` : ''}
                  </span>
                  <span className="text-sm font-bold">${Number(order.total).toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{format(new Date(order.created_at), 'MMM d, yyyy · h:mm a')}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Desktop Table */}
      <Card className="hidden md:block overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Order</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Customer</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Items</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Total</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Status</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Payment</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(order => {
                  const items = order.items as any[] || [];
                  const cfg = statusConfig[order.status] || statusConfig.pending;
                  return (
                    <tr key={order.id} className="hover:bg-muted/30 cursor-pointer transition-colors group" onClick={() => setSelectedOrder(order)}>
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-sm font-semibold text-primary group-hover:underline">{order.order_number}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-medium">{order.customer_name}</p>
                        {order.customer_email && <p className="text-xs text-muted-foreground truncate max-w-[160px]">{order.customer_email}</p>}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex -space-x-2">
                            {items.slice(0, 2).map((item: any, i: number) => (
                              <div key={i} className="w-8 h-8 rounded-lg border-2 border-background overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                                {item.image_url ? (
                                  <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-3 h-3 text-muted-foreground" />
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm truncate max-w-[120px]">{items[0]?.name || '-'}</p>
                            {items.length > 1 && <p className="text-[11px] text-muted-foreground">+{items.length - 1} more item{items.length > 2 ? 's' : ''}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-bold">${Number(order.total).toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge className={cn('border-0 text-[10px] gap-1 font-medium', cfg.badge)}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge
                          variant={order.payment_status === 'paid' ? 'default' : 'secondary'}
                          className="text-[10px] font-medium"
                        >
                          {order.payment_status === 'paid' ? '✓ ' : ''}{order.payment_status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs text-muted-foreground">{format(new Date(order.created_at), 'MMM d')}</p>
                        <p className="text-[10px] text-muted-foreground/60">{format(new Date(order.created_at), 'h:mm a')}</p>
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
        <div className="text-center py-16 text-muted-foreground">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 opacity-40" />
          </div>
          <p className="font-semibold text-foreground">No orders found</p>
          <p className="text-sm mt-1 mb-4">
            {tab !== 'all' ? `No ${tab} orders to display` : 'Create your first order to get started'}
          </p>
          {tab === 'all' && (
            <Button onClick={() => setCreateOpen(true)} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" /> Create Order
            </Button>
          )}
        </div>
      )}

      <OrderDetailDialog order={selectedOrder} open={!!selectedOrder} onOpenChange={open => !open && setSelectedOrder(null)} />
      <CreateOrderDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

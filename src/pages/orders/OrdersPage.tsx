import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Package } from 'lucide-react';
import { useOrders } from '@/hooks/use-supabase-data';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import OrderStatsRow from './components/OrderStatsRow';
import OrderDetailDialog from './components/OrderDetailDialog';
import CreateOrderDialog from './components/CreateOrderDialog';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  processing: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  shipped: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled: 'bg-destructive/10 text-destructive',
  refunded: 'bg-muted text-muted-foreground',
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
          <h1 className="text-xl sm:text-2xl font-semibold">Orders</h1>
          <p className="text-sm text-muted-foreground">{orders.length} total orders</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4 mr-2" /> New Order</Button>
      </div>

      <OrderStatsRow orders={orders} />

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <Tabs value={tab} onValueChange={setTab} className="w-full sm:w-auto">
          <TabsList className="w-full sm:w-auto overflow-x-auto">
            {tabs.map(t => (
              <TabsTrigger key={t} value={t} className="capitalize text-xs px-3">
                {t === 'all' ? 'All' : t}
                {t !== 'all' && (
                  <span className="ml-1 text-[10px] text-muted-foreground">
                    {orders.filter(o => o.status === t).length}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-3 md:hidden">
        {filtered.map(order => {
          const items = order.items as any[] || [];
          return (
            <Card key={order.id} className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setSelectedOrder(order)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm font-semibold">{order.order_number}</span>
                  <Badge className={cn('border-0 text-[10px]', statusColors[order.status])}>{order.status}</Badge>
                </div>
                <p className="text-sm">{order.customer_name}</p>
                <div className="flex items-center justify-between mt-2 text-sm">
                  <span className="text-muted-foreground">
                    {items.length > 0 ? `${items[0].name}` : 'No items'}
                    {items.length > 1 ? ` +${items.length - 1} more` : ''}
                  </span>
                  <span className="font-bold">${Number(order.total).toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{format(new Date(order.created_at), 'MMM d, yyyy')}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Desktop Table */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Order</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Customer</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Items</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Total</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Payment</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(order => {
                  const items = order.items as any[] || [];
                  return (
                    <tr key={order.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                      <td className="px-4 py-3 font-mono text-sm font-medium">{order.order_number}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium">{order.customer_name}</p>
                        {order.customer_email && <p className="text-xs text-muted-foreground">{order.customer_email}</p>}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          {items[0]?.image_url ? (
                            <img src={items[0].image_url} alt="" className="w-7 h-7 rounded object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded bg-muted flex items-center justify-center"><Package className="w-3 h-3 text-muted-foreground" /></div>
                          )}
                          <span className="truncate max-w-[120px]">{items[0]?.name || '-'}</span>
                          {items.length > 1 && <span className="text-xs text-muted-foreground">+{items.length - 1}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold">${Number(order.total).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <Badge className={cn('border-0 text-[10px]', statusColors[order.status])}>{order.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'} className="text-[10px]">{order.payment_status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{format(new Date(order.created_at), 'MMM d')}</td>
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
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No orders found</p>
          <p className="text-sm mt-1">Create your first order to get started</p>
        </div>
      )}

      <OrderDetailDialog order={selectedOrder} open={!!selectedOrder} onOpenChange={open => !open && setSelectedOrder(null)} />
      <CreateOrderDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

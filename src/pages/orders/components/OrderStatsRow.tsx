import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, Clock, DollarSign, TrendingUp } from 'lucide-react';
import { format, isToday } from 'date-fns';

interface OrderStatsRowProps {
  orders: any[];
}

export default function OrderStatsRow({ orders }: OrderStatsRowProps) {
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const todayRevenue = orders
    .filter(o => isToday(new Date(o.created_at)) && o.status !== 'cancelled' && o.status !== 'refunded')
    .reduce((sum, o) => sum + Number(o.total), 0);
  const avgValue = totalOrders > 0
    ? orders.filter(o => o.status !== 'cancelled' && o.status !== 'refunded').reduce((sum, o) => sum + Number(o.total), 0) / Math.max(orders.filter(o => o.status !== 'cancelled' && o.status !== 'refunded').length, 1)
    : 0;

  const stats = [
    { label: 'Total Orders', value: totalOrders, icon: ShoppingCart, color: 'text-primary' },
    { label: 'Pending', value: pendingOrders, icon: Clock, color: 'text-amber-500' },
    { label: "Today's Revenue", value: `$${todayRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-emerald-500' },
    { label: 'Avg Order Value', value: `$${avgValue.toFixed(2)}`, icon: TrendingUp, color: 'text-blue-500' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map(s => (
        <Card key={s.label}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-muted ${s.color}`}><s.icon className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold">{s.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

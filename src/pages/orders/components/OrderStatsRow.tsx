import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, Clock, DollarSign, TrendingUp } from 'lucide-react';
import { isToday } from 'date-fns';

interface OrderStatsRowProps {
  orders: any[];
}

export default function OrderStatsRow({ orders }: OrderStatsRowProps) {
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const validOrders = orders.filter(o => o.status !== 'cancelled' && o.status !== 'refunded');
  const todayRevenue = validOrders
    .filter(o => isToday(new Date(o.created_at)))
    .reduce((sum, o) => sum + Number(o.total), 0);
  const avgValue = validOrders.length > 0
    ? validOrders.reduce((sum, o) => sum + Number(o.total), 0) / validOrders.length
    : 0;

  const stats = [
    { label: 'Total Orders', value: String(totalOrders), icon: ShoppingCart, gradient: 'from-primary/20 to-primary/5', iconColor: 'text-primary' },
    { label: 'Pending', value: String(pendingOrders), icon: Clock, gradient: 'from-warning/20 to-warning/5', iconColor: 'text-warning' },
    { label: "Today's Revenue", value: `$${todayRevenue.toFixed(2)}`, icon: DollarSign, gradient: 'from-success/20 to-success/5', iconColor: 'text-success' },
    { label: 'Avg Order Value', value: `$${avgValue.toFixed(2)}`, icon: TrendingUp, gradient: 'from-info/20 to-info/5', iconColor: 'text-info' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map(s => (
        <Card key={s.label} className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${s.gradient}`}>
              <s.icon className={`w-5 h-5 ${s.iconColor}`} />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{s.label}</p>
              <p className="text-xl font-bold tracking-tight">{s.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

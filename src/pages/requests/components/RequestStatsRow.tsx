import { Card, CardContent } from '@/components/ui/card';
import { Clock, CheckCircle, DollarSign, Inbox } from 'lucide-react';

interface Props {
  requests: any[];
}

export default function RequestStatsRow({ requests }: Props) {
  const pending = requests.filter(r => r.status === 'pending').length;
  const today = requests.filter(r => {
    const d = new Date(r.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;
  const total = requests.length;
  const accepted = requests.filter(r => r.status === 'accepted').length;
  const rate = total > 0 ? Math.round((accepted / total) * 100) : 0;
  const pendingRevenue = requests
    .filter(r => r.status === 'pending' && r.estimated_price)
    .reduce((sum, r) => sum + Number(r.estimated_price), 0);

  const stats = [
    { label: 'Pending', value: pending, icon: Inbox, color: 'text-warning' },
    { label: "Today's", value: today, icon: Clock, color: 'text-info' },
    { label: 'Accept Rate', value: `${rate}%`, icon: CheckCircle, color: 'text-success' },
    { label: 'Est. Revenue', value: `€${pendingRevenue.toFixed(0)}`, icon: DollarSign, color: 'text-primary' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map(s => (
        <Card key={s.label}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg bg-muted flex items-center justify-center ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-semibold">{s.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

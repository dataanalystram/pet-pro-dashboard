import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MessageSquare, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServicePerformanceCardsProps {
  services: any[];
  reviews: any[];
  selectedServiceId: string | null;
  onSelectService: (id: string | null) => void;
}

export function ServicePerformanceCards({ services, reviews, selectedServiceId, onSelectService }: ServicePerformanceCardsProps) {
  const serviceStats = services.map(service => {
    const serviceReviews = reviews.filter(r => r.service_id === service.id);
    const count = serviceReviews.length;
    const avg = count ? serviceReviews.reduce((s, r) => s + r.rating, 0) / count : 0;
    const positive = serviceReviews.filter(r => r.rating >= 4).length;
    const negative = serviceReviews.filter(r => r.rating <= 2).length;
    const unanswered = serviceReviews.filter(r => !r.admin_response).length;
    const positivePct = count ? Math.round((positive / count) * 100) : 0;
    const negativePct = count ? Math.round((negative / count) * 100) : 0;

    return { service, count, avg, positive, negative, unanswered, positivePct, negativePct };
  }).filter(s => s.count > 0).sort((a, b) => b.count - a.count);

  if (serviceStats.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No reviews yet for any service.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {serviceStats.map(({ service, count, avg, unanswered, positivePct, negativePct }) => (
        <Card
          key={service.id}
          className={cn(
            'cursor-pointer transition-all hover:shadow-md',
            selectedServiceId === service.id && 'ring-2 ring-primary shadow-md'
          )}
          onClick={() => onSelectService(selectedServiceId === service.id ? null : service.id)}
        >
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{service.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{service.category}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold">{avg.toFixed(1)}</span>
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                </div>
                <p className="text-[10px] text-muted-foreground">{count} review{count !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Sentiment bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span className="text-success">{positivePct}% positive</span>
                <span className="text-destructive">{negativePct}% negative</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                <div className="bg-success h-full transition-all" style={{ width: `${positivePct}%` }} />
                <div className="bg-muted h-full flex-1" />
                <div className="bg-destructive h-full transition-all" style={{ width: `${negativePct}%` }} />
              </div>
            </div>

            {unanswered > 0 && (
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-warning" />
                <span className="text-xs text-warning font-medium">{unanswered} unanswered</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

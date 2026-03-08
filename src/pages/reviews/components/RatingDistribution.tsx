import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';

interface RatingDistributionProps {
  reviews: any[];
}

export function RatingDistribution({ reviews }: RatingDistributionProps) {
  const total = reviews.length;
  const dist = [5, 4, 3, 2, 1].map(star => {
    const count = reviews.filter(r => r.rating === star).length;
    return { star, count, pct: total ? Math.round((count / total) * 100) : 0 };
  });

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="font-semibold text-sm mb-3">Rating Distribution</h3>
        <div className="space-y-2">
          {dist.map(({ star, count, pct }) => (
            <div key={star} className="flex items-center gap-3 text-sm">
              <span className="w-4 text-muted-foreground font-medium">{star}</span>
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-14 text-right text-muted-foreground text-xs">{count} ({pct}%)</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, AlertTriangle, Clock, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

export type QuickFilter = 'all' | 'needs_reply' | 'negative' | 'this_week' | 'priority';

interface QuickActionBarProps {
  activeFilter: QuickFilter;
  onFilterChange: (filter: QuickFilter) => void;
  needsReplyCount: number;
  negativeCount: number;
  thisWeekCount: number;
}

export function QuickActionBar({ activeFilter, onFilterChange, needsReplyCount, negativeCount, thisWeekCount }: QuickActionBarProps) {
  const buttons: { id: QuickFilter; label: string; icon: any; count?: number; variant?: string }[] = [
    { id: 'all', label: 'All', icon: null },
    { id: 'needs_reply', label: 'Needs Reply', icon: MessageSquare, count: needsReplyCount },
    { id: 'negative', label: 'Negative', icon: AlertTriangle, count: negativeCount },
    { id: 'this_week', label: 'This Week', icon: Clock, count: thisWeekCount },
    { id: 'priority', label: 'Priority Queue', icon: Flame },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {buttons.map(btn => (
        <Button
          key={btn.id}
          size="sm"
          variant={activeFilter === btn.id ? 'default' : 'outline'}
          className={cn(
            'h-8 text-xs gap-1.5',
            activeFilter === btn.id && btn.id === 'negative' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
            activeFilter === btn.id && btn.id === 'needs_reply' && 'bg-warning text-warning-foreground hover:bg-warning/90',
            activeFilter === btn.id && btn.id === 'priority' && 'bg-orange-500 text-white hover:bg-orange-600',
          )}
          onClick={() => onFilterChange(btn.id)}
        >
          {btn.icon && <btn.icon className="w-3.5 h-3.5" />}
          {btn.label}
          {btn.count !== undefined && btn.count > 0 && (
            <Badge className={cn(
              'ml-0.5 h-4 min-w-[16px] px-1 text-[10px] rounded-full',
              activeFilter === btn.id
                ? 'bg-background/20 text-inherit'
                : btn.id === 'negative' ? 'bg-destructive/10 text-destructive' : btn.id === 'needs_reply' ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'
            )}>
              {btn.count}
            </Badge>
          )}
        </Button>
      ))}
    </div>
  );
}

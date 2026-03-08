import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Star, MessageSquare, Eye, EyeOff, Flag, Trash2, Clock, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ReviewCardProps {
  review: any;
  serviceName: string;
  onReply: (id: string, text: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  isUpdating: boolean;
}

const statusStyles: Record<string, string> = {
  published: 'bg-success/10 text-success border-success/20',
  pending: 'bg-warning/10 text-warning border-warning/20',
  flagged: 'bg-destructive/10 text-destructive border-destructive/20',
  hidden: 'bg-muted text-muted-foreground',
};

const sentimentBorder = (rating: number) => {
  if (rating >= 4) return 'border-l-4 border-l-success';
  if (rating === 3) return 'border-l-4 border-l-warning';
  return 'border-l-4 border-l-destructive';
};

export function ReviewCard({ review, serviceName, onReply, onStatusChange, onDelete, isUpdating }: ReviewCardProps) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    onReply(review.id, replyText);
    setReplying(false);
    setReplyText('');
  };

  return (
    <Card className={cn('overflow-hidden', sentimentBorder(review.rating))}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
              {review.customer_name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm">{review.customer_name}</p>
                <Badge className={cn('capitalize text-[10px] border', statusStyles[review.status] || '')}>{review.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {serviceName} • {format(new Date(review.created_at), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className={cn('w-3.5 h-3.5', i <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-muted')} />
            ))}
          </div>
        </div>

        {review.review_text && (
          <p className="text-sm text-muted-foreground leading-relaxed">{review.review_text}</p>
        )}

        {(review.pet_name || review.pet_species) && (
          <span className="inline-block text-[11px] bg-secondary text-secondary-foreground rounded-full px-2.5 py-0.5">
            {review.pet_species === 'dog' ? '🐕' : review.pet_species === 'cat' ? '🐱' : '🐾'} {review.pet_name} {review.pet_species ? `(${review.pet_species})` : ''}
          </span>
        )}

        {/* Admin Response */}
        {review.admin_response && (
          <div className="bg-accent/50 rounded-xl p-3 ml-6 border-l-2 border-primary">
            <p className="text-xs font-semibold text-primary mb-1">Your Reply</p>
            <p className="text-sm text-muted-foreground">{review.admin_response}</p>
            {review.responded_at && (
              <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {format(new Date(review.responded_at), 'MMM d, yyyy')}
              </p>
            )}
          </div>
        )}

        {/* Reply Form */}
        {replying && (
          <div className="ml-6 space-y-2">
            <Textarea placeholder="Write your reply..." value={replyText} onChange={e => setReplyText(e.target.value)} className="min-h-[60px]" />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSendReply} disabled={isUpdating}>
                <Send className="w-3 h-3 mr-1" /> Send Reply
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setReplying(false); setReplyText(''); }}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5 pt-1">
          {!review.admin_response && !replying && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setReplying(true)}>
              <MessageSquare className="w-3 h-3 mr-1" /> Reply
            </Button>
          )}
          {review.status !== 'published' && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onStatusChange(review.id, 'published')}>
              <Eye className="w-3 h-3 mr-1" /> Publish
            </Button>
          )}
          {review.status === 'published' && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onStatusChange(review.id, 'hidden')}>
              <EyeOff className="w-3 h-3 mr-1" /> Hide
            </Button>
          )}
          {review.status !== 'flagged' && (
            <Button size="sm" variant="outline" className="h-7 text-xs text-warning" onClick={() => onStatusChange(review.id, 'flagged')}>
              <Flag className="w-3 h-3 mr-1" /> Flag
            </Button>
          )}
          <Button size="sm" variant="outline" className="h-7 text-xs text-destructive" onClick={() => onDelete(review.id)}>
            <Trash2 className="w-3 h-3 mr-1" /> Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

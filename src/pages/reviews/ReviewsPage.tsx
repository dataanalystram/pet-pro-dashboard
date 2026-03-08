
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, MessageSquare, TrendingUp, AlertTriangle, Search, Send, Eye, EyeOff, Flag, Trash2, Clock } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { useReviews } from '@/hooks/use-supabase-data';
import { useServices } from '@/hooks/use-supabase-data';
import { useUpdate, useDelete } from '@/hooks/use-supabase-data';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ReviewsPage() {
  const { data: reviews = [], isLoading } = useReviews();
  const { data: services = [] } = useServices();
  const updateReview = useUpdate('reviews');
  const deleteReview = useDelete('reviews');

  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const serviceMap = useMemo(() => {
    const map = new Map<string, string>();
    services.forEach((s: any) => map.set(s.id, s.name));
    return map;
  }, [services]);

  const filtered = useMemo(() => {
    return reviews.filter((r: any) => {
      if (search) {
        const q = search.toLowerCase();
        const serviceName = serviceMap.get(r.service_id) || '';
        if (!r.customer_name.toLowerCase().includes(q) && !serviceName.toLowerCase().includes(q) && !(r.review_text || '').toLowerCase().includes(q)) return false;
      }
      if (ratingFilter !== 'all' && r.rating !== Number(ratingFilter)) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (serviceFilter !== 'all' && r.service_id !== serviceFilter) return false;
      return true;
    });
  }, [reviews, search, ratingFilter, statusFilter, serviceFilter, serviceMap]);

  // Stats
  const totalReviews = reviews.length;
  const avgRating = totalReviews ? (reviews.reduce((s: number, r: any) => s + r.rating, 0) / totalReviews).toFixed(1) : '0';
  const pendingCount = reviews.filter((r: any) => r.status === 'pending').length;
  const respondedCount = reviews.filter((r: any) => r.admin_response).length;
  const responseRate = totalReviews ? Math.round((respondedCount / totalReviews) * 100) : 0;

  // Rating distribution
  const ratingDist = [5, 4, 3, 2, 1].map(star => {
    const count = reviews.filter((r: any) => r.rating === star).length;
    return { star, count, pct: totalReviews ? Math.round((count / totalReviews) * 100) : 0 };
  });

  const handleReply = (id: string) => {
    if (!replyText.trim()) return;
    updateReview.mutate({ id, admin_response: replyText, responded_at: new Date().toISOString() }, {
      onSuccess: () => { toast.success('Reply sent'); setReplyingTo(null); setReplyText(''); }
    });
  };

  const handleStatusChange = (id: string, status: string) => {
    updateReview.mutate({ id, status }, { onSuccess: () => toast.success(`Review ${status}`) });
  };

  const handleDelete = (id: string) => {
    deleteReview.mutate(id, { onSuccess: () => toast.success('Review deleted') });
  };

  const statusBadge = (status: string) => {
    const variants: Record<string, string> = {
      published: 'bg-success/10 text-success border-success/20',
      pending: 'bg-warning/10 text-warning border-warning/20',
      flagged: 'bg-destructive/10 text-destructive border-destructive/20',
      hidden: 'bg-muted text-muted-foreground',
    };
    return <Badge className={cn('capitalize text-[10px] border', variants[status] || '')}>{status}</Badge>;
  };

  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground">Loading reviews...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
        <p className="text-sm text-muted-foreground">Track and respond to customer feedback</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Average Rating" value={String(avgRating)} change={`${totalReviews} total`} changeType="neutral" icon={Star} iconBg="bg-amber-500" />
        <StatCard title="Total Reviews" value={String(totalReviews)} change="All time" changeType="neutral" icon={MessageSquare} iconBg="bg-primary" />
        <StatCard title="Pending" value={String(pendingCount)} change="Needs attention" changeType={pendingCount > 0 ? 'negative' : 'positive'} icon={AlertTriangle} iconBg="bg-warning" />
        <StatCard title="Response Rate" value={`${responseRate}%`} change={`${respondedCount} responded`} changeType={responseRate >= 80 ? 'positive' : 'negative'} icon={TrendingUp} iconBg="bg-success" />
      </div>

      {/* Rating Distribution */}
      <Card>
        <CardContent className="p-5">
          <h3 className="font-semibold text-sm mb-3">Rating Distribution</h3>
          <div className="space-y-2">
            {ratingDist.map(({ star, count, pct }) => (
              <div key={star} className="flex items-center gap-3 text-sm">
                <span className="w-4 text-muted-foreground font-medium">{star}</span>
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-12 text-right text-muted-foreground text-xs">{count} ({pct}%)</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search reviews..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Rating" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            {[5,4,3,2,1].map(r => <SelectItem key={r} value={String(r)}>{r} Star{r !== 1 ? 's' : ''}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
            <SelectItem value="hidden">Hidden</SelectItem>
          </SelectContent>
        </Select>
        <Select value={serviceFilter} onValueChange={setServiceFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Service" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            {services.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No reviews found</CardContent></Card>
        )}
        {filtered.map((review: any) => (
          <Card key={review.id} className="overflow-hidden">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                    {review.customer_name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{review.customer_name}</p>
                      {statusBadge(review.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {serviceMap.get(review.service_id) || 'Unknown Service'} • {format(new Date(review.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={cn('w-4 h-4', i <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-muted')} />
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
              {replyingTo === review.id && (
                <div className="ml-6 space-y-2">
                  <Textarea
                    placeholder="Write your reply..."
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    className="min-h-[60px]"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleReply(review.id)} disabled={updateReview.isPending}>
                      <Send className="w-3 h-3 mr-1" /> Send Reply
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setReplyingTo(null); setReplyText(''); }}>Cancel</Button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1.5 pt-1">
                {!review.admin_response && replyingTo !== review.id && (
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setReplyingTo(review.id); setReplyText(''); }}>
                    <MessageSquare className="w-3 h-3 mr-1" /> Reply
                  </Button>
                )}
                {review.status !== 'published' && (
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleStatusChange(review.id, 'published')}>
                    <Eye className="w-3 h-3 mr-1" /> Publish
                  </Button>
                )}
                {review.status === 'published' && (
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleStatusChange(review.id, 'hidden')}>
                    <EyeOff className="w-3 h-3 mr-1" /> Hide
                  </Button>
                )}
                {review.status !== 'flagged' && (
                  <Button size="sm" variant="outline" className="h-7 text-xs text-warning" onClick={() => handleStatusChange(review.id, 'flagged')}>
                    <Flag className="w-3 h-3 mr-1" /> Flag
                  </Button>
                )}
                <Button size="sm" variant="outline" className="h-7 text-xs text-destructive" onClick={() => handleDelete(review.id)}>
                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

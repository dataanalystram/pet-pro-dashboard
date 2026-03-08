import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search } from 'lucide-react';
import { useReviews, useServices, useUpdate, useDelete } from '@/hooks/use-supabase-data';
import { toast } from 'sonner';
import { ReviewStatsRow } from './components/ReviewStatsRow';
import { QuickActionBar, QuickFilter } from './components/QuickActionBar';
import { ServicePerformanceCards } from './components/ServicePerformanceCards';
import { ReviewCard } from './components/ReviewCard';
import { RatingDistribution } from './components/RatingDistribution';
import { startOfWeek } from 'date-fns';

export default function ReviewsPage() {
  const { data: reviews = [], isLoading } = useReviews();
  const { data: services = [] } = useServices();
  const updateReview = useUpdate('reviews');
  const deleteReview = useDelete('reviews');

  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  const serviceMap = useMemo(() => {
    const map = new Map<string, string>();
    services.forEach((s: any) => map.set(s.id, s.name));
    return map;
  }, [services]);

  // Quick filter counts
  const needsReplyCount = reviews.filter((r: any) => !r.admin_response).length;
  const negativeCount = reviews.filter((r: any) => r.rating <= 2).length;
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const thisWeekCount = reviews.filter((r: any) => new Date(r.created_at) >= weekStart).length;

  // Priority scoring
  const priorityScore = (r: any) => {
    let score = 0;
    if (r.status === 'flagged') score += 1000;
    if (r.rating <= 2 && !r.admin_response) score += 500;
    if (r.status === 'pending') score += 100;
    if (!r.admin_response) score += 50;
    score += (5 - r.rating) * 10;
    return score;
  };

  const filtered = useMemo(() => {
    let result = [...reviews] as any[];

    // Quick filters
    if (quickFilter === 'needs_reply') result = result.filter(r => !r.admin_response);
    if (quickFilter === 'negative') result = result.filter(r => r.rating <= 2);
    if (quickFilter === 'this_week') result = result.filter(r => new Date(r.created_at) >= weekStart);

    // Service filter (from By Service tab click or dropdown)
    if (selectedServiceId) result = result.filter(r => r.service_id === selectedServiceId);

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r => {
        const sn = serviceMap.get(r.service_id) || '';
        return r.customer_name.toLowerCase().includes(q) || sn.toLowerCase().includes(q) || (r.review_text || '').toLowerCase().includes(q);
      });
    }

    // Rating filter
    if (ratingFilter !== 'all') result = result.filter(r => r.rating === Number(ratingFilter));

    // Status filter
    if (statusFilter !== 'all') result = result.filter(r => r.status === statusFilter);

    // Sort
    if (quickFilter === 'priority') {
      result.sort((a, b) => priorityScore(b) - priorityScore(a));
    }

    return result;
  }, [reviews, quickFilter, selectedServiceId, search, ratingFilter, statusFilter, serviceMap, weekStart]);

  const handleReply = (id: string, text: string) => {
    updateReview.mutate({ id, admin_response: text, responded_at: new Date().toISOString() }, {
      onSuccess: () => toast.success('Reply sent'),
    });
  };

  const handleStatusChange = (id: string, status: string) => {
    updateReview.mutate({ id, status }, { onSuccess: () => toast.success(`Review ${status}`) });
  };

  const handleDelete = (id: string) => {
    deleteReview.mutate(id, { onSuccess: () => toast.success('Review deleted') });
  };

  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground">Loading reviews...</div>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Reviews</h1>
        <p className="text-sm text-muted-foreground">Track and respond to customer feedback across all services</p>
      </div>

      <ReviewStatsRow reviews={reviews} />

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Reviews</TabsTrigger>
          <TabsTrigger value="by_service">By Service</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <QuickActionBar
            activeFilter={quickFilter}
            onFilterChange={f => { setQuickFilter(f); setSelectedServiceId(null); }}
            needsReplyCount={needsReplyCount}
            negativeCount={negativeCount}
            thisWeekCount={thisWeekCount}
          />

          {/* Filters row */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search reviews..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Rating" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                {[5, 4, 3, 2, 1].map(r => <SelectItem key={r} value={String(r)}>{r} Star{r !== 1 ? 's' : ''}</SelectItem>)}
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
          </div>

          <RatingDistribution reviews={reviews} />

          {/* Reviews list */}
          <div className="space-y-3">
            {filtered.length === 0 && (
              <div className="py-12 text-center text-muted-foreground text-sm">No reviews match your filters</div>
            )}
            {filtered.map((review: any) => (
              <ReviewCard
                key={review.id}
                review={review}
                serviceName={serviceMap.get(review.service_id) || 'Unknown Service'}
                onReply={handleReply}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                isUpdating={updateReview.isPending}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="by_service" className="space-y-4">
          <ServicePerformanceCards
            services={services}
            reviews={reviews}
            selectedServiceId={selectedServiceId}
            onSelectService={setSelectedServiceId}
          />

          {selectedServiceId && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">
                  Reviews for {serviceMap.get(selectedServiceId) || 'Service'}
                </h3>
                <button className="text-xs text-primary hover:underline" onClick={() => setSelectedServiceId(null)}>
                  Clear filter
                </button>
              </div>
              <div className="space-y-3">
                {filtered.map((review: any) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    serviceName={serviceMap.get(review.service_id) || 'Unknown Service'}
                    onReply={handleReply}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    isUpdating={updateReview.isPending}
                  />
                ))}
                {filtered.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground text-sm">No reviews for this service</div>
                )}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

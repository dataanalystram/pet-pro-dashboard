import { Star, MessageSquare, AlertTriangle, TrendingUp, Clock, ThumbsUp } from 'lucide-react';
import { StatCard } from '@/components/StatCard';

interface ReviewStatsRowProps {
  reviews: any[];
}

export function ReviewStatsRow({ reviews }: ReviewStatsRowProps) {
  const total = reviews.length;
  const avgRating = total ? (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : '0';
  const pendingCount = reviews.filter(r => r.status === 'pending').length;
  const respondedCount = reviews.filter(r => r.admin_response).length;
  const responseRate = total ? Math.round((respondedCount / total) * 100) : 0;
  const positiveRate = total ? Math.round((reviews.filter(r => r.rating >= 4).length / total) * 100) : 0;

  // Avg response time
  const respondedReviews = reviews.filter(r => r.admin_response && r.responded_at);
  let avgResponseTime = '—';
  if (respondedReviews.length > 0) {
    const totalHours = respondedReviews.reduce((sum, r) => {
      const diff = new Date(r.responded_at).getTime() - new Date(r.created_at).getTime();
      return sum + diff / (1000 * 60 * 60);
    }, 0);
    const avg = totalHours / respondedReviews.length;
    avgResponseTime = avg < 24 ? `${Math.round(avg)}h` : `${Math.round(avg / 24)}d`;
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      <StatCard title="Avg Rating" value={String(avgRating)} change={`${total} total`} changeType="neutral" icon={Star} iconBg="bg-amber-500" />
      <StatCard title="Total Reviews" value={String(total)} change="All time" changeType="neutral" icon={MessageSquare} iconBg="bg-primary" />
      <StatCard title="Pending" value={String(pendingCount)} change="Needs attention" changeType={pendingCount > 0 ? 'negative' : 'positive'} icon={AlertTriangle} iconBg="bg-warning" />
      <StatCard title="Response Rate" value={`${responseRate}%`} change={`${respondedCount} replied`} changeType={responseRate >= 80 ? 'positive' : 'negative'} icon={TrendingUp} iconBg="bg-success" />
      <StatCard title="Avg Response" value={avgResponseTime} change="Time to reply" changeType="neutral" icon={Clock} iconBg="bg-accent" />
      <StatCard title="Positive Rate" value={`${positiveRate}%`} change="4-5 stars" changeType={positiveRate >= 70 ? 'positive' : 'negative'} icon={ThumbsUp} iconBg="bg-emerald-500" />
    </div>
  );
}

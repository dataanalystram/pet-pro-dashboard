import { useState, useEffect } from 'react';
import { shelterAPI } from '@/api';
import { Activity, Filter, PawPrint, Users, Heart, Stethoscope, DollarSign, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPE_ICONS = {
  intake: { icon: PawPrint, color: 'bg-blue-100 text-blue-600' },
  adoption: { icon: Heart, color: 'bg-green-100 text-green-600' },
  medical: { icon: Stethoscope, color: 'bg-red-100 text-red-600' },
  volunteer: { icon: Users, color: 'bg-purple-100 text-purple-600' },
  donation: { icon: DollarSign, color: 'bg-amber-100 text-amber-600' },
  general: { icon: Activity, color: 'bg-slate-100 text-slate-600' },
};

export default function ShelterActivityLog() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [limit, setLimit] = useState(50);

  const fetchActivity = async () => {
    setLoading(true);
    try { const { data } = await shelterAPI.getActivity({ limit }); setActivities(data); }
    catch {} setLoading(false);
  };

  useEffect(() => { fetchActivity(); }, [limit]);

  const filtered = activities.filter(a => {
    if (filter === 'all') return true;
    return a.activity_type === filter;
  });

  const types = ['all', ...new Set(activities.map(a => a.activity_type).filter(Boolean))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activity Log</h1>
          <p className="text-sm text-slate-500">{activities.length} recent activities</p>
        </div>
        <button onClick={fetchActivity} className="p-2.5 rounded-lg hover:bg-slate-100 border">
          <RefreshCw className={cn('w-4 h-4 text-slate-500', loading && 'animate-spin')} />
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {types.map(t => (
          <button key={t} onClick={() => setFilter(t)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium capitalize', filter === t ? 'bg-shelter-primary text-white' : 'bg-white border text-slate-600 hover:bg-slate-50')}>{t}</button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(a => {
          const typeConfig = TYPE_ICONS[a.activity_type] || TYPE_ICONS.general;
          const Icon = typeConfig.icon;
          return (
            <div key={a.id} className="flex items-start gap-3 bg-white rounded-xl border p-4 hover:shadow-sm transition-shadow">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', typeConfig.color)}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-900">{a.description}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                  <span className="capitalize">{a.activity_type}</span>
                  {a.performed_by && <span>by {a.performed_by}</span>}
                  <span>{a.created_at ? new Date(a.created_at).toLocaleString() : ''}</span>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && !loading && <div className="py-16 text-center text-sm text-slate-400 bg-white rounded-xl border">No activity found</div>}
      </div>

      {activities.length >= limit && (
        <button onClick={() => setLimit(l => l + 50)} className="w-full py-3 text-sm font-medium text-shelter-primary hover:bg-slate-50 rounded-lg border">Load More</button>
      )}
    </div>
  );
}

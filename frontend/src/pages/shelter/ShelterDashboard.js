import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { shelterAPI } from '@/api';
import { Heart, Users, FileCheck, DollarSign, ClipboardList, Activity, AlertCircle, TrendingUp, Dog, Cat, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ShelterDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    shelterAPI.getDashboardStats().then(({ data }) => { setStats(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-shelter-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!stats) return null;

  const dogCapPct = Math.round((stats.dogs / Math.max(stats.max_capacity_dogs, 1)) * 100);
  const catCapPct = Math.round((stats.cats / Math.max(stats.max_capacity_cats, 1)) * 100);
  const tasksPct = stats.tasks_total > 0 ? Math.round((stats.tasks_completed / stats.tasks_total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Shelter Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">{new Date().toLocaleDateString('en-IE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Heart} label="Animals in Care" value={stats.total_in_care} color="text-shelter-primary" bg="bg-emerald-50" />
        <StatCard icon={FileCheck} label="Pending Applications" value={stats.pending_applications} color="text-amber-600" bg="bg-amber-50" />
        <StatCard icon={TrendingUp} label="Adoptions This Month" value={stats.month_adoptions} color="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={DollarSign} label="Donations This Month" value={`\u20AC${stats.month_donations?.toFixed(0) || '0'}`} color="text-purple-600" bg="bg-purple-50" />
      </div>

      {/* Capacity + Tasks Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Capacity */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Facility Capacity</h2>
          <div className="space-y-4">
            <CapacityBar label="Dogs" icon={Dog} current={stats.dogs} max={stats.max_capacity_dogs} pct={dogCapPct} color="bg-cyan-500" />
            <CapacityBar label="Cats" icon={Cat} current={stats.cats} max={stats.max_capacity_cats} pct={catCapPct} color="bg-purple-500" />
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(stats.status_counts || {}).slice(0, 6).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 capitalize">{status.replace(/_/g, ' ')}</span>
                  <span className="font-semibold text-slate-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Today's Tasks */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Today's Tasks</h2>
            <span className="text-sm font-bold text-shelter-primary">{tasksPct}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 mb-4">
            <div className="bg-shelter-primary h-2.5 rounded-full transition-all" style={{ width: `${tasksPct}%` }} />
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {(stats.today_tasks || []).map(task => (
              <div key={task.id} className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sm', task.status === 'completed' ? 'bg-green-50' : task.status === 'in_progress' ? 'bg-amber-50' : 'bg-slate-50')}>
                <div className={cn('w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0', task.status === 'completed' ? 'bg-green-500' : task.status === 'in_progress' ? 'bg-amber-500' : 'bg-slate-300')}>
                  {task.status === 'completed' ? <CheckCircle2 className="w-3 h-3 text-white" /> : <Clock className="w-3 h-3 text-white" />}
                </div>
                <span className={cn('flex-1 truncate', task.status === 'completed' && 'line-through text-slate-400')}>{task.task_name}</span>
                <span className="text-xs text-slate-400">{task.due_time}</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/shelter/daily-ops')} className="mt-3 w-full text-center text-sm text-shelter-primary font-medium hover:underline">View All Tasks</button>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Recent Activity</h2>
          <div className="space-y-3 max-h-[360px] overflow-y-auto">
            {(stats.recent_activity || []).map(act => (
              <div key={act.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">{act.description}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{timeAgo(act.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <QuickStat label="Month Intakes" value={stats.month_intakes} icon={Heart} />
        <QuickStat label="Active Volunteers" value={stats.active_volunteers} icon={Users} />
        <QuickStat label="Total Applications" value={stats.total_applications} icon={FileCheck} />
        <QuickStat label="Available Animals" value={stats.available_for_adoption} icon={Heart} />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', bg)}><Icon className={cn('w-5 h-5', color)} /></div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}

function CapacityBar({ label, icon: Icon, current, max, pct, color }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2"><Icon className="w-4 h-4 text-slate-500" /><span className="text-sm font-medium text-slate-700">{label}</span></div>
        <span className="text-sm font-semibold text-slate-900">{current}/{max}</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div className={cn('h-2 rounded-full transition-all', color, pct > 90 && 'bg-red-500')} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

function QuickStat({ label, value, icon: Icon }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3">
      <Icon className="w-5 h-5 text-slate-400" />
      <div><p className="text-lg font-bold text-slate-900">{value}</p><p className="text-xs text-slate-500">{label}</p></div>
    </div>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

import { useState, useEffect } from 'react';
import { shelterAPI } from '@/api';
import { TrendingUp, TrendingDown, Users, Heart, DollarSign, Clock, Calendar, Dog, Cat, ArrowUp, ArrowDown, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ShelterAnalytics() {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, trendsRes] = await Promise.all([
        shelterAPI.getAnalyticsSummary(period),
        shelterAPI.getAnalyticsTrends()
      ]);
      setSummary(summaryRes.data);
      setTrends(trendsRes.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-shelter-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  const maxIntake = Math.max(...trends.map(t => t.intake), 1);
  const maxAdoptions = Math.max(...trends.map(t => t.adoptions), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics & Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Comprehensive shelter performance metrics</p>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {['week', 'month', 'year'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={cn('px-4 py-2 rounded-md text-sm font-medium capitalize', period === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Dog} label="Total Intake" value={summary?.intake?.total || 0} trend={`+${summary?.intake?.by_species?.dog || 0} dogs`} color="cyan" />
        <MetricCard icon={Heart} label="Adoptions" value={summary?.outcomes?.adoptions || 0} trend={`${summary?.outcomes?.adoption_rate || 0}% rate`} color="green" />
        <MetricCard icon={Clock} label="Avg Stay" value={`${summary?.operations?.avg_length_of_stay_days || 0}d`} trend="days in shelter" color="amber" />
        <MetricCard icon={DollarSign} label="Donations" value={`€${(summary?.fundraising?.total_donations || 0).toLocaleString()}`} trend={`${summary?.fundraising?.donation_count || 0} donors`} color="purple" />
      </div>

      {/* Intake/Outcome Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Intake Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(summary?.intake?.by_type || {}).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm text-slate-600 capitalize">{type.replace(/_/g, ' ')}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${(count / (summary?.intake?.total || 1)) * 100}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-slate-900 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Dog className="w-4 h-4 text-cyan-500" />
              <span className="text-sm text-slate-600">Dogs: {summary?.intake?.by_species?.dog || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <Cat className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-slate-600">Cats: {summary?.intake?.by_species?.cat || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Outcome Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(summary?.outcomes?.by_type || {}).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm text-slate-600 capitalize">{type.replace(/_/g, ' ')}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full', type === 'adoption' ? 'bg-green-500' : type === 'transfer' ? 'bg-blue-500' : 'bg-slate-400')} style={{ width: `${(count / (summary?.outcomes?.total || 1)) * 100}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-slate-900 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Adoption Rate</span>
              <span className={cn('text-lg font-bold', (summary?.outcomes?.adoption_rate || 0) >= 70 ? 'text-green-600' : (summary?.outcomes?.adoption_rate || 0) >= 50 ? 'text-amber-600' : 'text-red-600')}>
                {summary?.outcomes?.adoption_rate || 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Trends Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">12-Month Trends</h3>
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-500" />
            <span className="text-sm text-slate-600">Intake</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm text-slate-600">Adoptions</span>
          </div>
        </div>
        <div className="h-64 flex items-end gap-2">
          {trends.map((month, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex gap-0.5 justify-center" style={{ height: '180px' }}>
                <div className="w-3 bg-cyan-500 rounded-t" style={{ height: `${(month.intake / maxIntake) * 100}%` }} title={`Intake: ${month.intake}`} />
                <div className="w-3 bg-green-500 rounded-t" style={{ height: `${(month.adoptions / maxAdoptions) * 100}%` }} title={`Adoptions: ${month.adoptions}`} />
              </div>
              <span className="text-xs text-slate-400 mt-1">{month.month?.substring(5)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Operations Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">Volunteer Hours</h4>
              <p className="text-2xl font-bold text-blue-600">{summary?.operations?.volunteer_hours || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">Applications</h4>
              <p className="text-2xl font-bold text-amber-600">{summary?.operations?.applications_received || 0}</p>
              <p className="text-xs text-slate-500">{summary?.operations?.applications_approved || 0} approved</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">Avg Donation</h4>
              <p className="text-2xl font-bold text-green-600">€{summary?.fundraising?.average_donation || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, trend, color }) {
  const colors = {
    cyan: 'bg-cyan-50 text-cyan-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colors[color])}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm text-slate-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{trend}</p>
    </div>
  );
}

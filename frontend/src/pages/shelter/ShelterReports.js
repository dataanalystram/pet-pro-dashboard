import { useState, useEffect } from 'react';
import { shelterAPI } from '@/api';
import { BarChart3, TrendingUp, TrendingDown, ArrowDown, ArrowUp, Filter, ChevronLeft, ChevronRight, PieChart, Calendar, Download, Dog, Cat, Home, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart as RechartsPie, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];

export default function ShelterReports() {
  const [intakeData, setIntakeData] = useState([]);
  const [outcomeData, setOutcomeData] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState('intake');
  const [chartType, setChartType] = useState('bar');
  const [showDogs, setShowDogs] = useState(true);
  const [showCats, setShowCats] = useState(true);
  const [showOther, setShowOther] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [intake, outcome] = await Promise.all([
        shelterAPI.getIntakeByMonth({ year }),
        shelterAPI.getOutcomeByMonth({ year }),
      ]);
      setIntakeData(intake.data.map((d, i) => ({ ...d, name: MONTH_NAMES[i] })));
      setOutcomeData(outcome.data.map((d, i) => ({ ...d, name: MONTH_NAMES[i] })));
    } catch {} setLoading(false);
  };

  useEffect(() => { fetchData(); }, [year]);

  const totalIntake = intakeData.reduce((s, d) => s + (d.total || 0), 0);
  const totalOutcome = outcomeData.reduce((s, d) => s + (d.total || 0), 0);
  const totalAdoptions = outcomeData.reduce((s, d) => s + (d.adoption || 0), 0);
  const totalTransfers = outcomeData.reduce((s, d) => s + (d.transfer || 0), 0);
  const totalRTO = outcomeData.reduce((s, d) => s + (d.return_to_owner || 0), 0);
  const totalDogIntake = intakeData.reduce((s, d) => s + (d.dog || 0), 0);
  const totalCatIntake = intakeData.reduce((s, d) => s + (d.cat || 0), 0);

  // Calculate live release rate
  const positiveOutcomes = totalAdoptions + totalTransfers + totalRTO;
  const liveReleaseRate = totalOutcome > 0 ? ((positiveOutcomes / totalOutcome) * 100).toFixed(1) : 0;

  // Average length of stay (mock calculation)
  const avgLOS = totalOutcome > 0 ? Math.round((totalIntake * 30) / totalOutcome) : 0;

  // Prepare pie chart data for intake by species
  const speciesPieData = [
    { name: 'Dogs', value: totalDogIntake, color: '#3B82F6' },
    { name: 'Cats', value: totalCatIntake, color: '#8B5CF6' },
    { name: 'Other', value: intakeData.reduce((s, d) => s + (d.other || 0), 0), color: '#F59E0B' },
  ].filter(d => d.value > 0);

  // Outcome distribution pie data
  const outcomePieData = [
    { name: 'Adoption', value: totalAdoptions, color: '#10B981' },
    { name: 'Transfer', value: totalTransfers, color: '#3B82F6' },
    { name: 'Return to Owner', value: totalRTO, color: '#F59E0B' },
    { name: 'Other', value: outcomeData.reduce((s, d) => s + (d.other || 0), 0), color: '#6B7280' },
  ].filter(d => d.value > 0);

  const chartData = activeChart === 'intake' ? intakeData : outcomeData;

  const downloadCSV = () => {
    const headers = activeChart === 'intake' 
      ? ['Month', 'Dogs', 'Cats', 'Other', 'Total']
      : ['Month', 'Adoption', 'Transfer', 'Return to Owner', 'Other', 'Total'];
    const rows = chartData.map(d => activeChart === 'intake'
      ? [d.name, d.dog, d.cat, d.other, d.total]
      : [d.name, d.adoption, d.transfer, d.return_to_owner, d.other, d.total]
    );
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); 
    a.href = url; 
    a.download = `${activeChart}_report_${year}.csv`; 
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-sm text-slate-500">Visual reports and insights for {year}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setYear(y => y - 1)} className="p-2 rounded-lg hover:bg-slate-100 border"><ChevronLeft className="w-4 h-4" /></button>
          <span className="px-4 py-2 font-bold text-sm bg-white border rounded-lg">{year}</span>
          <button onClick={() => setYear(y => y + 1)} className="p-2 rounded-lg hover:bg-slate-100 border"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard icon={TrendingUp} label="Total Intakes" value={totalIntake} color="blue" />
        <MetricCard icon={TrendingDown} label="Total Outcomes" value={totalOutcome} color="green" />
        <MetricCard icon={Home} label="Adoptions" value={totalAdoptions} color="emerald" />
        <MetricCard icon={Heart} label="Live Release Rate" value={`${liveReleaseRate}%`} color="purple" />
        <MetricCard icon={Dog} label="Dogs Intake" value={totalDogIntake} color="cyan" />
        <MetricCard icon={Cat} label="Cats Intake" value={totalCatIntake} color="pink" />
      </div>

      {/* Pie Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Intake by Species ({year})</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie data={speciesPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {speciesPieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Animals']} />
                <Legend />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Outcome Distribution ({year})</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie data={outcomePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {outcomePieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Animals']} />
                <Legend />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white rounded-xl border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-4 border-b gap-3">
          <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
            <button onClick={() => setActiveChart('intake')} className={cn('px-4 py-2 rounded-md text-sm font-medium', activeChart === 'intake' ? 'bg-white shadow text-slate-900' : 'text-slate-500')}>Intake by Month</button>
            <button onClick={() => setActiveChart('outcome')} className={cn('px-4 py-2 rounded-md text-sm font-medium', activeChart === 'outcome' ? 'bg-white shadow text-slate-900' : 'text-slate-500')}>Outcomes by Month</button>
          </div>
          <div className="flex items-center gap-3">
            {activeChart === 'intake' && (
              <div className="flex gap-2">
                <button onClick={() => setShowDogs(s => !s)} className={cn('px-3 py-1 rounded text-xs font-medium', showDogs ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400')}>Dogs</button>
                <button onClick={() => setShowCats(s => !s)} className={cn('px-3 py-1 rounded text-xs font-medium', showCats ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-400')}>Cats</button>
                <button onClick={() => setShowOther(s => !s)} className={cn('px-3 py-1 rounded text-xs font-medium', showOther ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400')}>Other</button>
              </div>
            )}
            <div className="flex border rounded-lg overflow-hidden">
              <button onClick={() => setChartType('bar')} className={cn('px-3 py-1.5 text-xs', chartType === 'bar' ? 'bg-slate-100' : 'bg-white hover:bg-slate-50')}>
                <BarChart3 className="w-4 h-4" />
              </button>
              <button onClick={() => setChartType('line')} className={cn('px-3 py-1.5 text-xs', chartType === 'line' ? 'bg-slate-100' : 'bg-white hover:bg-slate-50')}>
                <TrendingUp className="w-4 h-4" />
              </button>
            </div>
            <button onClick={downloadCSV} className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1">
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
          </div>
        </div>
        <div className="p-5">
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={chartData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (<div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs shadow-lg"><p className="font-bold mb-1">{label}</p>{payload.map(p => <p key={p.dataKey} style={{color: p.fill}}>{p.name}: {p.value}</p>)}</div>);
                  }} />
                  <Legend />
                  {activeChart === 'intake' ? (
                    <>
                      {showDogs && <Bar dataKey="dog" name="Dogs" fill="#3B82F6" radius={[4,4,0,0]} />}
                      {showCats && <Bar dataKey="cat" name="Cats" fill="#8B5CF6" radius={[4,4,0,0]} />}
                      {showOther && <Bar dataKey="other" name="Other" fill="#F59E0B" radius={[4,4,0,0]} />}
                    </>
                  ) : (
                    <>
                      <Bar dataKey="adoption" name="Adoption" fill="#10B981" radius={[4,4,0,0]} />
                      <Bar dataKey="transfer" name="Transfer" fill="#3B82F6" radius={[4,4,0,0]} />
                      <Bar dataKey="return_to_owner" name="Return to Owner" fill="#F59E0B" radius={[4,4,0,0]} />
                    </>
                  )}
                </BarChart>
              ) : (
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (<div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs shadow-lg"><p className="font-bold mb-1">{label}</p>{payload.map(p => <p key={p.dataKey} style={{color: p.stroke}}>{p.name}: {p.value}</p>)}</div>);
                  }} />
                  <Legend />
                  {activeChart === 'intake' ? (
                    <>
                      {showDogs && <Area type="monotone" dataKey="dog" name="Dogs" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} strokeWidth={2} />}
                      {showCats && <Area type="monotone" dataKey="cat" name="Cats" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.2} strokeWidth={2} />}
                      {showOther && <Area type="monotone" dataKey="other" name="Other" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.2} strokeWidth={2} />}
                    </>
                  ) : (
                    <>
                      <Area type="monotone" dataKey="adoption" name="Adoption" stroke="#10B981" fill="#10B981" fillOpacity={0.2} strokeWidth={2} />
                      <Area type="monotone" dataKey="transfer" name="Transfer" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} strokeWidth={2} />
                      <Area type="monotone" dataKey="return_to_owner" name="Return to Owner" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.2} strokeWidth={2} />
                    </>
                  )}
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border overflow-x-auto">
        <div className="px-5 py-3 border-b flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">{activeChart === 'intake' ? 'Monthly Intake Data' : 'Monthly Outcome Data'}</h3>
          <span className="text-xs text-slate-400">Year: {year}</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50"><tr>
            <th className="text-left px-5 py-2 font-semibold text-slate-600">Month</th>
            {activeChart === 'intake' ? (
              <><th className="text-right px-5 py-2 font-semibold text-slate-600">Dogs</th><th className="text-right px-5 py-2 font-semibold text-slate-600">Cats</th><th className="text-right px-5 py-2 font-semibold text-slate-600">Other</th><th className="text-right px-5 py-2 font-semibold text-slate-600">Total</th></>
            ) : (
              <><th className="text-right px-5 py-2 font-semibold text-slate-600">Adoption</th><th className="text-right px-5 py-2 font-semibold text-slate-600">Transfer</th><th className="text-right px-5 py-2 font-semibold text-slate-600">RTO</th><th className="text-right px-5 py-2 font-semibold text-slate-600">Total</th></>
            )}
          </tr></thead>
          <tbody className="divide-y">
            {chartData.map(d => (
              <tr key={d.name} className="hover:bg-slate-50">
                <td className="px-5 py-2 font-medium">{d.name}</td>
                {activeChart === 'intake' ? (
                  <><td className="px-5 py-2 text-right text-blue-600">{d.dog}</td><td className="px-5 py-2 text-right text-purple-600">{d.cat}</td><td className="px-5 py-2 text-right text-amber-600">{d.other}</td><td className="px-5 py-2 text-right font-bold">{d.total}</td></>
                ) : (
                  <><td className="px-5 py-2 text-right text-green-600">{d.adoption}</td><td className="px-5 py-2 text-right text-blue-600">{d.transfer}</td><td className="px-5 py-2 text-right text-amber-600">{d.return_to_owner}</td><td className="px-5 py-2 text-right font-bold">{d.total}</td></>
                )}
              </tr>
            ))}
            {/* Totals Row */}
            <tr className="bg-slate-100 font-bold">
              <td className="px-5 py-2">TOTAL</td>
              {activeChart === 'intake' ? (
                <><td className="px-5 py-2 text-right text-blue-600">{totalDogIntake}</td><td className="px-5 py-2 text-right text-purple-600">{totalCatIntake}</td><td className="px-5 py-2 text-right text-amber-600">{intakeData.reduce((s, d) => s + (d.other || 0), 0)}</td><td className="px-5 py-2 text-right">{totalIntake}</td></>
              ) : (
                <><td className="px-5 py-2 text-right text-green-600">{totalAdoptions}</td><td className="px-5 py-2 text-right text-blue-600">{totalTransfers}</td><td className="px-5 py-2 text-right text-amber-600">{totalRTO}</td><td className="px-5 py-2 text-right">{totalOutcome}</td></>
              )}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Key Insights */}
      <div className="bg-gradient-to-r from-shelter-primary to-green-600 rounded-xl p-6 text-white">
        <h3 className="text-lg font-semibold mb-4">Key Insights for {year}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-2xl font-bold">{liveReleaseRate}%</p>
            <p className="text-sm opacity-80">Live Release Rate</p>
            <p className="text-xs mt-1 opacity-60">Adoptions + Transfers + RTO / Total Outcomes</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{totalDogIntake > totalCatIntake ? 'Dogs' : 'Cats'}</p>
            <p className="text-sm opacity-80">Most Common Species</p>
            <p className="text-xs mt-1 opacity-60">{Math.max(totalDogIntake, totalCatIntake)} animals this year</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{MONTH_NAMES[intakeData.findIndex(d => d.total === Math.max(...intakeData.map(x => x.total || 0)))] || 'N/A'}</p>
            <p className="text-sm opacity-80">Busiest Month</p>
            <p className="text-xs mt-1 opacity-60">Highest intake volume</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    pink: 'bg-pink-50 text-pink-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="bg-white rounded-xl border p-4">
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-2', colors[color] || colors.blue)}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vetAPI } from '@/api';
import { Calendar, Users, Stethoscope, Clock, ChevronRight, Activity, AlertCircle, CheckCircle2, UserCheck, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  scheduled: { label: 'Scheduled', color: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500' },
  checked_in: { label: 'Checked In', color: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  with_doctor: { label: 'With Doctor', color: 'bg-purple-50 text-purple-700', dot: 'bg-purple-500' },
  in_treatment: { label: 'In Treatment', color: 'bg-cyan-50 text-cyan-700', dot: 'bg-cyan-600' },
  checking_out: { label: 'Checking Out', color: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  completed: { label: 'Completed', color: 'bg-green-50 text-green-700', dot: 'bg-green-600' },
  no_show: { label: 'No Show', color: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
};

const APPT_TYPE_LABELS = {
  wellness_exam: 'Wellness', sick_visit: 'Sick Visit', vaccination: 'Vaccination',
  dental: 'Dental', follow_up: 'Follow-up', surgery: 'Surgery', emergency: 'Emergency',
};

export default function VetDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    vetAPI.getDashboardStats().then(({ data }) => {
      setStats(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-vet-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!stats) return null;

  const flowStages = ['scheduled', 'confirmed', 'checked_in', 'with_doctor', 'in_treatment', 'checking_out', 'completed'];
  const schedule = stats.today_schedule || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Clinic Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">{new Date().toLocaleDateString('en-IE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Calendar} label="Today's Appointments" value={stats.today_appointments} color="text-vet-primary" bg="bg-cyan-50" />
        <StatCard icon={Stethoscope} label="Total Patients" value={stats.total_patients} color="text-purple-600" bg="bg-purple-50" />
        <StatCard icon={Users} label="Active Clients" value={stats.total_clients} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard icon={Activity} label="In Progress" value={(stats.today_status_counts?.with_doctor || 0) + (stats.today_status_counts?.in_treatment || 0)} color="text-amber-600" bg="bg-amber-50" />
      </div>

      {/* Appointment Flow Board */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Appointment Flow Board</h2>
            <p className="text-xs text-slate-500 mt-0.5">Today's patient flow through the clinic</p>
          </div>
          <button onClick={() => navigate('/vet/appointments')} className="text-sm text-vet-primary font-medium hover:underline flex items-center gap-1">
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <div className="flex min-w-[900px] divide-x divide-slate-100">
            {flowStages.map(stage => {
              const stageAppts = schedule.filter(a => a.status === stage);
              const cfg = STATUS_CONFIG[stage];
              return (
                <div key={stage} className="flex-1 min-w-[180px]">
                  <div className="px-3 py-2.5 bg-slate-50 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-2.5 h-2.5 rounded-full', cfg.dot)} />
                      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{cfg.label}</span>
                      <span className="ml-auto text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border">{stageAppts.length}</span>
                    </div>
                  </div>
                  <div className="p-2 space-y-2 min-h-[200px] max-h-[400px] overflow-y-auto">
                    {stageAppts.map(appt => (
                      <div key={appt.id} className="bg-white border border-slate-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/vet/patients')}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: appt.vet_color || '#0891B2' }}>
                            {(appt.vet_name || 'D')[0]}
                          </div>
                          <span className="text-xs font-medium text-slate-900 truncate">{appt.patient_name}</span>
                        </div>
                        <p className="text-xs text-slate-500 mb-1">{appt.client_name}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-medium">{APPT_TYPE_LABELS[appt.appointment_type] || appt.appointment_type}</span>
                          <span className="text-xs text-slate-400">{appt.start_time?.split('T')[1]?.slice(0, 5)}</span>
                          {appt.exam_room && <span className="text-xs text-slate-400">{appt.exam_room}</span>}
                        </div>
                        {(appt.patient_allergies?.length > 0) && (
                          <div className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                            <AlertCircle className="w-3 h-3" />
                            <span className="truncate">{appt.patient_allergies.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    ))}
                    {stageAppts.length === 0 && (
                      <div className="flex items-center justify-center h-24 text-xs text-slate-400">No patients</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Today Schedule */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Today's Schedule</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {schedule.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')).map(appt => {
            const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.scheduled;
            return (
              <div key={appt.id} className="px-5 py-3 flex items-center gap-4 hover:bg-slate-50">
                <div className="text-sm font-mono font-semibold text-slate-700 w-14">{appt.start_time?.split('T')[1]?.slice(0, 5)}</div>
                <div className={cn('w-1 h-10 rounded-full', cfg.dot)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900">{appt.patient_name}</span>
                    <span className="text-xs text-slate-500">{appt.patient_species} {appt.patient_breed && `· ${appt.patient_breed}`}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{appt.client_name} · {APPT_TYPE_LABELS[appt.appointment_type] || appt.appointment_type}</p>
                </div>
                <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', cfg.color)}>{cfg.label}</span>
                <span className="text-xs text-slate-400 hidden sm:block">{appt.exam_room}</span>
              </div>
            );
          })}
          {schedule.length === 0 && <div className="py-12 text-center text-sm text-slate-400">No appointments today</div>}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', bg)}>
          <Icon className={cn('w-5 h-5', color)} />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}

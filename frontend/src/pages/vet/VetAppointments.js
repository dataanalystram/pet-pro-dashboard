import { useState, useEffect } from 'react';
import { vetAPI } from '@/api';
import { Calendar, Clock, ChevronLeft, ChevronRight, Plus, ArrowRight, RefreshCw, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import SlidePanel from '@/components/shared/SlidePanel';
import { FormInput, FormSelect, FormTextarea, FormRow } from '@/components/shared/FormField';

const STATUS_COLORS = {
  scheduled: 'bg-slate-100 text-slate-700 border-slate-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  checked_in: 'bg-amber-50 text-amber-700 border-amber-200',
  with_doctor: 'bg-purple-50 text-purple-700 border-purple-200',
  in_treatment: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  checking_out: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  no_show: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
};

const STATUS_NEXT = {
  scheduled: 'confirmed', confirmed: 'checked_in', checked_in: 'with_doctor',
  with_doctor: 'in_treatment', in_treatment: 'checking_out', checking_out: 'completed',
};

const STATUS_LABELS = {
  scheduled: 'Scheduled', confirmed: 'Confirmed', checked_in: 'Checked In',
  with_doctor: 'With Doctor', in_treatment: 'In Treatment', checking_out: 'Checking Out',
  completed: 'Completed', no_show: 'No Show', cancelled: 'Cancelled',
};

const APPT_TYPES = [
  { value: 'wellness_exam', label: 'Wellness Exam' },
  { value: 'sick_visit', label: 'Sick Visit' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'dental', label: 'Dental' },
  { value: 'surgery', label: 'Surgery' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'grooming', label: 'Grooming' },
];

const EMPTY_APPT = {
  client_id: '', patient_id: '', veterinarian_id: '', appointment_date: '', start_time: '', end_time: '',
  duration_minutes: 20, appointment_type: 'wellness_exam', reason_for_visit: '', exam_room: '', internal_notes: '',
};

export default function VetAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_APPT);
  const [saving, setSaving] = useState(false);

  const fetchAppts = () => {
    setLoading(true);
    vetAPI.getAppointments({ date_from: selectedDate, date_to: selectedDate }).then(({ data }) => {
      setAppointments(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchAppts(); }, [selectedDate]);

  useEffect(() => {
    Promise.all([vetAPI.getPatients(), vetAPI.getClients(), vetAPI.getStaff()]).then(([p, c, s]) => {
      setPatients(p.data);
      setClients(c.data);
      setStaff(s.data.filter(st => st.role === 'veterinarian'));
    }).catch(() => {});
  }, []);

  const advanceStatus = async (appt) => {
    const next = STATUS_NEXT[appt.status];
    if (!next) return;
    try {
      await vetAPI.updateAppointment(appt.id, { status: next });
      toast.success(`Moved to ${STATUS_LABELS[next]}`);
      fetchAppts();
    } catch { toast.error('Failed to update'); }
  };

  const handleCreate = async () => {
    if (!form.patient_id || !form.veterinarian_id || !form.appointment_date || !form.start_time) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSaving(true);
    try {
      const startTime = `${form.appointment_date}T${form.start_time}:00`;
      const [h, m] = form.start_time.split(':').map(Number);
      const endM = h * 60 + m + (form.duration_minutes || 20);
      const endTime = `${form.appointment_date}T${String(Math.floor(endM / 60)).padStart(2, '0')}:${String(endM % 60).padStart(2, '0')}:00`;

      await vetAPI.createAppointment({
        ...form,
        start_time: startTime,
        end_time: endTime,
      });
      toast.success('Appointment created');
      setShowCreate(false);
      setForm({ ...EMPTY_APPT, appointment_date: selectedDate });
      fetchAppts();
    } catch (e) { toast.error('Failed to create appointment'); }
    setSaving(false);
  };

  const changeDate = (delta) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const dateDisplay = new Date(selectedDate + 'T12:00').toLocaleDateString('en-IE', { weekday: 'long', day: 'numeric', month: 'long' });
  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  // Client's patients for selection
  const clientPatients = form.client_id ? patients.filter(p => p.client_id === form.client_id) : patients;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
          <p className="text-sm text-slate-500 mt-1">{dateDisplay} · {appointments.length} appointments</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <button onClick={() => changeDate(-1)} className="p-2.5 hover:bg-slate-50 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="px-2 py-2 text-sm font-medium border-0 focus:outline-none" />
            <button onClick={() => changeDate(1)} className="p-2.5 hover:bg-slate-50 transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>
          {!isToday && <button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])} className="px-3 py-2 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-600">Today</button>}
          <button onClick={fetchAppts} className="p-2.5 rounded-lg hover:bg-slate-100 border border-slate-200"><RefreshCw className="w-4 h-4 text-slate-500" /></button>
          <button onClick={() => { setForm({ ...EMPTY_APPT, appointment_date: selectedDate }); setShowCreate(true); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-vet-primary text-white rounded-lg font-medium text-sm hover:bg-vet-secondary shadow-sm">
            <Plus className="w-4 h-4" /> New Appointment
          </button>
        </div>
      </div>

      {/* Status summary */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(STATUS_LABELS).slice(0, 7).map(([key, label]) => {
          const count = appointments.filter(a => a.status === key).length;
          if (count === 0) return null;
          return (
            <span key={key} className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border', STATUS_COLORS[key])}>
              <span className="w-2 h-2 rounded-full bg-current opacity-60" />
              {label}: {count}
            </span>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-vet-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {appointments.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')).map(appt => {
              const statusCfg = STATUS_COLORS[appt.status] || STATUS_COLORS.scheduled;
              const nextStatus = STATUS_NEXT[appt.status];
              return (
                <div key={appt.id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="text-center w-16 flex-shrink-0">
                    <p className="text-lg font-bold text-slate-900 font-mono">{appt.start_time?.split('T')[1]?.slice(0, 5)}</p>
                    <p className="text-xs text-slate-400">{appt.duration_minutes}min</p>
                  </div>
                  <div className="w-1 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: appt.vet_color || '#0891B2' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900">{appt.patient_name}</span>
                      <span className="text-xs text-slate-500">{appt.patient_species} · {appt.patient_breed}</span>
                    </div>
                    <p className="text-sm text-slate-500">{appt.client_name} · {appt.reason_for_visit || appt.appointment_type?.replace(/_/g, ' ')}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400 flex items-center gap-1"><User className="w-3 h-3" />{appt.vet_name}</span>
                      {appt.exam_room && <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-medium">{appt.exam_room}</span>}
                    </div>
                  </div>
                  <span className={cn('px-3 py-1.5 rounded-full text-xs font-semibold border hidden sm:block', statusCfg)}>{STATUS_LABELS[appt.status]}</span>
                  {nextStatus && (
                    <button onClick={() => advanceStatus(appt)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-vet-primary text-white hover:bg-vet-secondary transition-colors shadow-sm">
                      <ArrowRight className="w-3.5 h-3.5" /> {STATUS_LABELS[nextStatus]}
                    </button>
                  )}
                </div>
              );
            })}
            {appointments.length === 0 && <div className="py-16 text-center text-sm text-slate-400">No appointments for this date</div>}
          </div>
        </div>
      )}

      {/* Create Appointment Panel */}
      <SlidePanel isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Appointment" subtitle="Schedule a new appointment">
        <div className="space-y-4">
          <FormSelect label="Client" required options={[{ value: '', label: 'Select client...' }, ...clients.map(c => ({ value: c.id, label: `${c.first_name} ${c.last_name}` }))]} value={form.client_id} onChange={e => setForm(p => ({ ...p, client_id: e.target.value, patient_id: '' }))} />
          <FormSelect label="Patient" required options={[{ value: '', label: 'Select patient...' }, ...clientPatients.map(p => ({ value: p.id, label: `${p.name} (${p.breed || p.species})` }))]} value={form.patient_id} onChange={e => setForm(p => ({ ...p, patient_id: e.target.value }))} />
          <FormSelect label="Veterinarian" required options={[{ value: '', label: 'Select vet...' }, ...staff.map(s => ({ value: s.id, label: s.full_name }))]} value={form.veterinarian_id} onChange={e => setForm(p => ({ ...p, veterinarian_id: e.target.value }))} />
          <FormRow>
            <FormInput label="Date" required type="date" value={form.appointment_date} onChange={e => setForm(p => ({ ...p, appointment_date: e.target.value }))} />
            <FormInput label="Start Time" required type="time" value={form.start_time} onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))} />
          </FormRow>
          <FormRow>
            <FormSelect label="Duration" options={[{ value: 15, label: '15 min' }, { value: 20, label: '20 min' }, { value: 30, label: '30 min' }, { value: 45, label: '45 min' }, { value: 60, label: '60 min' }]} value={form.duration_minutes} onChange={e => setForm(p => ({ ...p, duration_minutes: parseInt(e.target.value) }))} />
            <FormSelect label="Type" options={APPT_TYPES} value={form.appointment_type} onChange={e => setForm(p => ({ ...p, appointment_type: e.target.value }))} />
          </FormRow>
          <FormSelect label="Exam Room" options={[{ value: '', label: 'Assign later' }, { value: 'Exam 1', label: 'Exam 1' }, { value: 'Exam 2', label: 'Exam 2' }, { value: 'Exam 3', label: 'Exam 3' }, { value: 'Surgery', label: 'Surgery' }]} value={form.exam_room} onChange={e => setForm(p => ({ ...p, exam_room: e.target.value }))} />
          <FormTextarea label="Reason for Visit" rows={2} value={form.reason_for_visit} onChange={e => setForm(p => ({ ...p, reason_for_visit: e.target.value }))} placeholder="Brief description of why the patient is coming in..." />
          <FormTextarea label="Internal Notes" rows={2} value={form.internal_notes} onChange={e => setForm(p => ({ ...p, internal_notes: e.target.value }))} placeholder="Staff-only notes..." />

          <div className="flex gap-3 pt-4 border-t">
            <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-vet-primary text-white hover:bg-vet-secondary disabled:opacity-50">
              {saving ? 'Creating...' : 'Create Appointment'}
            </button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}

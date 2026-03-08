import { useState, useEffect, useCallback } from 'react';
import { vetAPI } from '@/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { DndContext, closestCenter, DragOverlay, useDroppable, useDraggable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { GripVertical, Clock, AlertTriangle, PawPrint, User, Plus, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import SlidePanel from '@/components/shared/SlidePanel';
import { FormInput, FormSelect, FormTextarea, FormRow } from '@/components/shared/FormField';

const FLOW_COLUMNS = [
  { key: 'scheduled', label: 'Waiting Room', color: 'bg-slate-500', bg: 'bg-slate-50' },
  { key: 'checked_in', label: 'Checked In', color: 'bg-blue-500', bg: 'bg-blue-50' },
  { key: 'with_doctor', label: 'With Doctor', color: 'bg-purple-500', bg: 'bg-purple-50' },
  { key: 'in_treatment', label: 'In Treatment', color: 'bg-cyan-500', bg: 'bg-cyan-50' },
  { key: 'checking_out', label: 'Checking Out', color: 'bg-emerald-500', bg: 'bg-emerald-50' },
  { key: 'completed', label: 'Completed', color: 'bg-green-600', bg: 'bg-green-50' },
];

const SPECIES_ICONS = { canine: '🐕', feline: '🐱', avian: '🐦', reptile: '🦎', other: '🐾' };
const TYPE_COLORS = { wellness_exam: '#0891B2', sick_visit: '#DC2626', vaccination: '#7C3AED', dental: '#D97706', surgery: '#059669', emergency: '#EF4444', follow_up: '#6366F1', grooming: '#EC4899' };

function DraggablePatientCard({ appt, startTime }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: appt.id });
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)`, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 1000 : 1 } : undefined;

  const waitMinutes = startTime ? Math.max(0, Math.floor((Date.now() - new Date(startTime).getTime()) / 60000)) : 0;
  const isUrgent = appt.appointment_type === 'emergency';
  const isLongWait = waitMinutes > 30;
  const isMediumWait = waitMinutes > 15;

  return (
    <div ref={setNodeRef} style={style} className={cn(
      'bg-white rounded-xl border-2 p-3 hover:shadow-lg transition-all cursor-default',
      isUrgent ? 'border-red-400 animate-pulse' : isDragging ? 'border-vet-primary shadow-xl' : 'border-slate-200',
    )}>
      <div className="flex items-start gap-2">
        <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing mt-1 text-slate-300 hover:text-slate-500">
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-base">{SPECIES_ICONS[appt.patient_species?.toLowerCase()] || '🐾'}</span>
            <span className="font-semibold text-sm text-slate-900 truncate">{appt.patient_name}</span>
            {isUrgent && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold animate-pulse">URGENT</span>}
          </div>
          <p className="text-xs text-slate-500 truncate">{appt.patient_breed || appt.patient_species}</p>
          <p className="text-xs text-slate-600 mt-1 truncate">
            <span className="font-medium">{appt.reason_for_visit || appt.appointment_type?.replace(/_/g, ' ')}</span>
          </p>
          <div className="flex items-center gap-2 mt-1.5 text-xs">
            <span className="flex items-center gap-1 text-slate-400" style={{color: appt.vet_color || '#0891B2'}}>
              <User className="w-3 h-3" />{appt.vet_name || 'Unassigned'}
            </span>
            {appt.exam_room && <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-500">{appt.exam_room}</span>}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={cn(
              'text-xs font-medium flex items-center gap-1',
              isLongWait ? 'text-red-600' : isMediumWait ? 'text-amber-600' : 'text-slate-400'
            )}>
              <Clock className="w-3 h-3" />{waitMinutes}min
            </span>
            {appt.has_allergies && <span className="text-xs bg-amber-50 text-amber-700 px-1 py-0.5 rounded flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" />Allergy</span>}
          </div>
        </div>
        <div className="w-1 h-full rounded-full self-stretch" style={{ backgroundColor: TYPE_COLORS[appt.appointment_type] || '#6B7280' }} />
      </div>
    </div>
  );
}

function DroppableColumn({ column, children, count }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key });
  return (
    <div ref={setNodeRef} className={cn('flex-1 min-w-[200px] flex flex-col')}>
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={cn('w-3 h-3 rounded-full', column.color)} />
        <span className="text-sm font-semibold text-slate-700">{column.label}</span>
        <span className="ml-auto text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{count}</span>
      </div>
      <div className={cn(
        'flex-1 space-y-2 p-2 rounded-xl border-2 border-dashed transition-all min-h-[250px]',
        isOver ? 'border-vet-primary/40 bg-vet-primary/5 scale-[1.01]' : 'border-slate-200 bg-slate-50/50'
      )}>
        {children}
        {count === 0 && (
          <div className="flex items-center justify-center h-20 text-xs text-slate-400">
            Drop patient here
          </div>
        )}
      </div>
    </div>
  );
}

export default function VetFlowBoard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeId, setActiveId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [patients, setPatients] = useState([]);
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({
    client_id: '', patient_id: '', veterinarian_id: '', appointment_date: '', start_time: '',
    duration_minutes: 20, appointment_type: 'wellness_exam', reason_for_visit: '', exam_room: '',
  });
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [a, p, c, s] = await Promise.all([
        vetAPI.getAppointments({ date_from: selectedDate, date_to: selectedDate }),
        vetAPI.getPatients(), vetAPI.getClients(), vetAPI.getStaff(),
      ]);
      setAppointments(a.data); setPatients(p.data); setClients(c.data); setStaff(s.data.filter(st => st.role === 'veterinarian'));
    } catch {} setLoading(false);
  }, [selectedDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const appt = appointments.find(a => a.id === active.id);
    if (!appt || appt.status === over.id) return;
    // Optimistic update
    setAppointments(prev => prev.map(a => a.id === active.id ? { ...a, status: over.id } : a));
    try {
      await vetAPI.updateAppointment(active.id, { status: over.id });
      const col = FLOW_COLUMNS.find(c => c.key === over.id);
      toast.success(`${appt.patient_name} → ${col?.label || over.id}`);
    } catch {
      toast.error('Failed to update status');
      fetchData();
    }
  };

  const handleCreate = async () => {
    if (!form.patient_id || !form.veterinarian_id || !form.start_time) { toast.error('Fill required fields'); return; }
    setSaving(true);
    try {
      const date = form.appointment_date || selectedDate;
      const startTime = `${date}T${form.start_time}:00`;
      const [h, m] = form.start_time.split(':').map(Number);
      const endM = h * 60 + m + (form.duration_minutes || 20);
      const endTime = `${date}T${String(Math.floor(endM / 60)).padStart(2, '0')}:${String(endM % 60).padStart(2, '0')}:00`;
      await vetAPI.createAppointment({ ...form, appointment_date: date, start_time: startTime, end_time: endTime });
      toast.success('Appointment created');
      setShowCreate(false); fetchData();
    } catch { toast.error('Failed'); }
    setSaving(false);
  };

  const changeDate = (delta) => {
    const d = new Date(selectedDate); d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const activeAppt = activeId ? appointments.find(a => a.id === activeId) : null;
  const dateDisplay = new Date(selectedDate + 'T12:00').toLocaleDateString('en-IE', { weekday: 'long', day: 'numeric', month: 'long' });
  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const clientPatients = form.client_id ? patients.filter(p => p.client_id === form.client_id) : patients;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Flow Board</h1>
          <p className="text-sm text-slate-500">{dateDisplay} · {appointments.length} patients · Drag to move</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <button onClick={() => changeDate(-1)} className="p-2.5 hover:bg-slate-50"><ChevronLeft className="w-4 h-4" /></button>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="px-2 py-2 text-sm font-medium border-0 focus:outline-none" />
            <button onClick={() => changeDate(1)} className="p-2.5 hover:bg-slate-50"><ChevronRight className="w-4 h-4" /></button>
          </div>
          {!isToday && <button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])} className="px-3 py-2 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200">Today</button>}
          <button onClick={fetchData} className="p-2.5 rounded-lg hover:bg-slate-100 border"><RefreshCw className={cn("w-4 h-4 text-slate-500", loading && "animate-spin")} /></button>
          <button onClick={() => { setForm(f => ({...f, appointment_date: selectedDate})); setShowCreate(true); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-vet-primary text-white rounded-lg font-medium text-sm hover:bg-vet-secondary shadow-sm">
            <Plus className="w-4 h-4" /> Walk-In
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap text-xs">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1.5 text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: color}} />
            {type.replace(/_/g, ' ')}
          </span>
        ))}
      </div>

      {loading && appointments.length === 0 ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-vet-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-3 min-w-[1400px]">
              {FLOW_COLUMNS.map(col => {
                const colAppts = appointments.filter(a => a.status === col.key);
                return (
                  <DroppableColumn key={col.key} column={col} count={colAppts.length}>
                    {colAppts.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')).map(appt => (
                      <DraggablePatientCard key={appt.id} appt={appt} startTime={appt.start_time} />
                    ))}
                  </DroppableColumn>
                );
              })}
            </div>
          </div>
          <DragOverlay>
            {activeAppt && (
              <div className="bg-white rounded-xl border-2 border-vet-primary shadow-2xl p-3 w-[200px] opacity-90">
                <div className="flex items-center gap-2">
                  <span className="text-base">{SPECIES_ICONS[activeAppt.patient_species?.toLowerCase()] || '🐾'}</span>
                  <span className="font-semibold text-sm">{activeAppt.patient_name}</span>
                </div>
                <p className="text-xs text-slate-500">{activeAppt.appointment_type?.replace(/_/g, ' ')}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Quick Add Panel */}
      <SlidePanel isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Walk-In / New Appointment" subtitle="Quick add to flow board">
        <div className="space-y-4">
          <FormSelect label="Client" required options={[{ value: '', label: 'Select client...' }, ...clients.map(c => ({ value: c.id, label: `${c.first_name} ${c.last_name}` }))]} value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value, patient_id: '' }))} />
          <FormSelect label="Patient" required options={[{ value: '', label: 'Select patient...' }, ...clientPatients.map(p => ({ value: p.id, label: `${p.name} (${p.breed || p.species})` }))]} value={form.patient_id} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))} />
          <FormSelect label="Veterinarian" required options={[{ value: '', label: 'Select vet...' }, ...staff.map(s => ({ value: s.id, label: s.full_name }))]} value={form.veterinarian_id} onChange={e => setForm(f => ({ ...f, veterinarian_id: e.target.value }))} />
          <FormRow>
            <FormInput label="Date" type="date" value={form.appointment_date || selectedDate} onChange={e => setForm(f => ({ ...f, appointment_date: e.target.value }))} />
            <FormInput label="Time" required type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
          </FormRow>
          <FormRow>
            <FormSelect label="Type" options={[{value:'wellness_exam',label:'Wellness'},{value:'sick_visit',label:'Sick Visit'},{value:'vaccination',label:'Vaccination'},{value:'emergency',label:'Emergency'},{value:'dental',label:'Dental'},{value:'surgery',label:'Surgery'}]} value={form.appointment_type} onChange={e => setForm(f => ({ ...f, appointment_type: e.target.value }))} />
            <FormSelect label="Room" options={[{value:'',label:'Auto'},{value:'Exam 1',label:'Exam 1'},{value:'Exam 2',label:'Exam 2'},{value:'Exam 3',label:'Exam 3'},{value:'Surgery',label:'Surgery'}]} value={form.exam_room} onChange={e => setForm(f => ({ ...f, exam_room: e.target.value }))} />
          </FormRow>
          <FormTextarea label="Reason" rows={2} value={form.reason_for_visit} onChange={e => setForm(f => ({ ...f, reason_for_visit: e.target.value }))} placeholder="Why is the patient here?" />
          <div className="flex gap-3 pt-4 border-t">
            <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 border hover:bg-slate-50">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-vet-primary text-white hover:bg-vet-secondary disabled:opacity-50">{saving ? 'Creating...' : 'Add to Board'}</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}

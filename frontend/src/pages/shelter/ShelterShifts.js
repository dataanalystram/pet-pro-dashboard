import { useState, useEffect } from 'react';
import { shelterAPI } from '@/api';
import { Plus, Search, Calendar, Clock, User, CheckCircle, XCircle, Play, Square, MapPin, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import SlidePanel from '@/components/shared/SlidePanel';
import { FormInput, FormSelect, FormTextarea, FormRow } from '@/components/shared/FormField';

const STATUS_CONFIG = {
  scheduled: { label: 'Scheduled', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  in_progress: { label: 'In Progress', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  completed: { label: 'Completed', color: 'bg-green-50 text-green-700 border-green-200' },
  cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-700 border-red-200' },
  no_show: { label: 'No Show', color: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const SHIFT_TYPES = [
  { value: 'dog_walking', label: 'Dog Walking' },
  { value: 'cat_care', label: 'Cat Socialization' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'feeding', label: 'Feeding' },
  { value: 'admin', label: 'Admin' },
  { value: 'events', label: 'Events' },
  { value: 'transport', label: 'Transport' },
  { value: 'general', label: 'General' },
];

export default function ShelterShifts() {
  const [shifts, setShifts] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showCheckout, setShowCheckout] = useState(null);
  const [form, setForm] = useState({ volunteer_id: '', shift_date: '', start_time: '09:00', end_time: '13:00', shift_type: 'general', area_assigned: '', notes: '' });
  const [checkoutForm, setCheckoutForm] = useState({ tasks_completed: [], notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [shiftsRes, volRes] = await Promise.all([
        shelterAPI.getShifts({ date: selectedDate }),
        shelterAPI.getVolunteers()
      ]);
      setShifts(shiftsRes.data || []);
      setVolunteers(volRes.data?.filter(v => v.application_status === 'approved') || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.volunteer_id || !form.shift_date) { toast.error('Volunteer and date required'); return; }
    setSaving(true);
    try {
      await shelterAPI.createShift(form);
      toast.success('Shift scheduled');
      setShowCreate(false);
      setForm({ volunteer_id: '', shift_date: '', start_time: '09:00', end_time: '13:00', shift_type: 'general', area_assigned: '', notes: '' });
      fetchData();
    } catch (e) { toast.error('Failed'); }
    setSaving(false);
  };

  const handleCheckIn = async (shiftId) => {
    try {
      await shelterAPI.checkInShift(shiftId);
      toast.success('Checked in!');
      fetchData();
    } catch (e) { toast.error('Failed'); }
  };

  const handleCheckOut = async () => {
    setSaving(true);
    try {
      await shelterAPI.checkOutShift(showCheckout.id, checkoutForm);
      toast.success('Checked out! Hours logged.');
      setShowCheckout(null);
      setCheckoutForm({ tasks_completed: [], notes: '' });
      fetchData();
    } catch (e) { toast.error('Failed'); }
    setSaving(false);
  };

  const handleCancel = async (shiftId) => {
    if (!window.confirm('Cancel this shift?')) return;
    try {
      await shelterAPI.updateShift(shiftId, { status: 'cancelled' });
      toast.success('Shift cancelled');
      fetchData();
    } catch (e) { toast.error('Failed'); }
  };

  const filtered = shifts.filter(s => statusFilter === 'all' || s.status === statusFilter);

  const stats = {
    total: shifts.length,
    completed: shifts.filter(s => s.status === 'completed').length,
    totalHours: shifts.reduce((sum, s) => sum + (s.hours_logged || 0), 0),
  };

  // Generate week dates
  const weekDates = [];
  const startOfWeek = new Date(selectedDate);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    weekDates.push(d.toISOString().split('T')[0]);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Volunteer Shifts</h1>
          <p className="text-sm text-slate-500 mt-1">{stats.total} shifts today · {stats.totalHours.toFixed(1)} hours logged</p>
        </div>
        <button onClick={() => { setForm(f => ({...f, shift_date: selectedDate})); setShowCreate(true); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-shelter-primary text-white rounded-lg font-medium text-sm hover:bg-shelter-secondary">
          <Plus className="w-4 h-4" /> Schedule Shift
        </button>
      </div>

      {/* Week Calendar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 7); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-2 hover:bg-slate-100 rounded-lg">&larr;</button>
          <h3 className="font-semibold text-slate-900">Week of {new Date(weekDates[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</h3>
          <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 7); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-2 hover:bg-slate-100 rounded-lg">&rarr;</button>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map(date => {
            const dayShifts = shifts.filter(s => s.shift_date === date);
            const isSelected = date === selectedDate;
            const isToday = date === new Date().toISOString().split('T')[0];
            return (
              <button key={date} onClick={() => setSelectedDate(date)} className={cn('p-3 rounded-lg text-center transition-all', isSelected ? 'bg-shelter-primary text-white' : isToday ? 'bg-shelter-primary/10 text-shelter-primary' : 'hover:bg-slate-50')}>
                <div className="text-xs opacity-70">{new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div className="text-lg font-bold">{new Date(date).getDate()}</div>
                {dayShifts.length > 0 && <div className={cn('text-xs mt-1', isSelected ? 'opacity-80' : 'text-slate-500')}>{dayShifts.length} shifts</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg text-sm border border-slate-200 bg-white">
          <option value="all">All Status</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-shelter-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(shift => {
            const statusCfg = STATUS_CONFIG[shift.status] || STATUS_CONFIG.scheduled;
            const shiftType = SHIFT_TYPES.find(t => t.value === shift.shift_type);
            return (
              <div key={shift.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-shelter-primary/10 rounded-xl flex items-center justify-center">
                      <User className="w-6 h-6 text-shelter-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{shift.volunteer?.full_name || 'Unknown Volunteer'}</h3>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {shift.start_time} - {shift.end_time}</span>
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">{shiftType?.label || shift.shift_type}</span>
                        {shift.area_assigned && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {shift.area_assigned}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('px-3 py-1 rounded-full text-xs font-medium border', statusCfg.color)}>{statusCfg.label}</span>
                    {shift.status === 'scheduled' && (
                      <>
                        <button onClick={() => handleCheckIn(shift.id)} className="px-3 py-1.5 text-xs font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 flex items-center gap-1">
                          <Play className="w-3 h-3" /> Check In
                        </button>
                        <button onClick={() => handleCancel(shift.id)} className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100">
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    {shift.status === 'in_progress' && (
                      <button onClick={() => setShowCheckout(shift)} className="px-3 py-1.5 text-xs font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 flex items-center gap-1">
                        <Square className="w-3 h-3" /> Check Out
                      </button>
                    )}
                    {shift.status === 'completed' && shift.hours_logged > 0 && (
                      <span className="text-sm font-medium text-green-600">{shift.hours_logged.toFixed(1)} hrs</span>
                    )}
                  </div>
                </div>
                {shift.notes && <p className="mt-2 text-sm text-slate-500 pl-16">{shift.notes}</p>}
              </div>
            );
          })}
        </div>
      )}
      {filtered.length === 0 && !loading && <div className="py-16 text-center text-sm text-slate-400 bg-white rounded-xl border">No shifts for this date</div>}

      {/* Create Shift Panel */}
      <SlidePanel isOpen={showCreate} onClose={() => setShowCreate(false)} title="Schedule Shift" width="max-w-md">
        <div className="space-y-4">
          <FormSelect label="Volunteer" required options={[{ value: '', label: 'Select volunteer...' }, ...volunteers.map(v => ({ value: v.id, label: v.full_name }))]} value={form.volunteer_id} onChange={e => setForm(f => ({...f, volunteer_id: e.target.value}))} />
          <FormInput label="Date" type="date" required value={form.shift_date} onChange={e => setForm(f => ({...f, shift_date: e.target.value}))} />
          <FormRow>
            <FormInput label="Start Time" type="time" value={form.start_time} onChange={e => setForm(f => ({...f, start_time: e.target.value}))} />
            <FormInput label="End Time" type="time" value={form.end_time} onChange={e => setForm(f => ({...f, end_time: e.target.value}))} />
          </FormRow>
          <FormSelect label="Shift Type" options={SHIFT_TYPES} value={form.shift_type} onChange={e => setForm(f => ({...f, shift_type: e.target.value}))} />
          <FormInput label="Area Assigned" value={form.area_assigned} onChange={e => setForm(f => ({...f, area_assigned: e.target.value}))} placeholder="e.g. Dog Ward A, Cat Room" />
          <FormTextarea label="Notes" rows={2} value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
          <div className="flex gap-3 pt-4 border-t">
            <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border hover:bg-slate-50">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-shelter-primary text-white hover:opacity-90 disabled:opacity-50">{saving ? 'Scheduling...' : 'Schedule Shift'}</button>
          </div>
        </div>
      </SlidePanel>

      {/* Checkout Panel */}
      <SlidePanel isOpen={!!showCheckout} onClose={() => setShowCheckout(null)} title="Check Out" subtitle={showCheckout?.volunteer?.full_name}>
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm"><strong>Checked in:</strong> {showCheckout?.check_in_time ? new Date(showCheckout.check_in_time).toLocaleTimeString() : 'Unknown'}</p>
            <p className="text-sm"><strong>Shift type:</strong> {SHIFT_TYPES.find(t => t.value === showCheckout?.shift_type)?.label}</p>
          </div>
          <FormTextarea label="Tasks Completed" rows={3} value={checkoutForm.notes} onChange={e => setCheckoutForm(f => ({...f, notes: e.target.value}))} placeholder="List tasks completed during this shift..." />
          <div className="flex gap-3 pt-4 border-t">
            <button onClick={() => setShowCheckout(null)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border hover:bg-slate-50">Cancel</button>
            <button onClick={handleCheckOut} disabled={saving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50">{saving ? 'Checking out...' : 'Complete Checkout'}</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}

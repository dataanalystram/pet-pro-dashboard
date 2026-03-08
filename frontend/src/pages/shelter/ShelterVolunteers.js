import { useState, useEffect } from 'react';
import { shelterAPI } from '@/api';
import { Users, Plus, Edit, Calendar, Clock, Star, Award, CheckCircle, Search, Phone, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import SlidePanel from '@/components/shared/SlidePanel';
import { FormInput, FormSelect, FormTextarea, FormRow } from '@/components/shared/FormField';

const LEVELS = [
  { key: 'new', label: 'New', icon: '\ud83d\udfe2', min: 0 },
  { key: 'bronze', label: 'Bronze', icon: '\ud83e\udd49', min: 20 },
  { key: 'silver', label: 'Silver', icon: '\ud83e\udd48', min: 50 },
  { key: 'gold', label: 'Gold', icon: '\ud83e\udd47', min: 100 },
  { key: 'platinum', label: 'Platinum', icon: '\ud83d\udc8e', min: 250 },
];

const SKILLS = ['Dog Walking', 'Cat Socialization', 'Feeding', 'Cleaning', 'Medical Assist', 'Event Help', 'Photography', 'Transport', 'Foster Care', 'Admin'];

const EMPTY_VOL = {
  full_name: '', email: '', phone: '', skills: [], availability: '', hours_logged: 0,
  status: 'active', notes: '', emergency_contact: '', start_date: new Date().toISOString().split('T')[0],
  is_foster_eligible: false, max_foster_capacity: 0, training_completed: [],
};

export default function ShelterVolunteers() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_VOL });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [showLogHours, setShowLogHours] = useState(null);
  const [hoursToLog, setHoursToLog] = useState(0);

  const fetchData = async () => {
    try { const { data } = await shelterAPI.getVolunteers(); setVolunteers(data); } catch {} setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getLevel = (hours) => [...LEVELS].reverse().find(l => hours >= l.min) || LEVELS[0];
  const totalHours = volunteers.reduce((s, v) => s + (v.hours_logged || 0), 0);
  const activeCount = volunteers.filter(v => v.status === 'active').length;

  const filtered = volunteers.filter(v => {
    if (!search) return true;
    return v.full_name?.toLowerCase().includes(search.toLowerCase()) || v.email?.toLowerCase().includes(search.toLowerCase());
  });

  const openEdit = (v) => {
    setEditing(v);
    setForm({ ...EMPTY_VOL, ...v, skills: v.skills || [] });
    setShowCreate(true);
  };

  const handleSave = async () => {
    if (!form.full_name) { toast.error('Name required'); return; }
    setSaving(true);
    try {
      if (editing) { await shelterAPI.updateVolunteer(editing.id, form); }
      else { await shelterAPI.createVolunteer(form); }
      toast.success(editing ? 'Volunteer updated' : 'Volunteer added');
      setShowCreate(false); setEditing(null); setForm({ ...EMPTY_VOL }); fetchData();
    } catch { toast.error('Failed'); }
    setSaving(false);
  };

  const logHours = async () => {
    if (!showLogHours) return;
    try {
      await shelterAPI.updateVolunteer(showLogHours.id, { hours_logged: (showLogHours.hours_logged || 0) + hoursToLog });
      toast.success(`Logged ${hoursToLog} hours`);
      setShowLogHours(null); setHoursToLog(0); fetchData();
    } catch { toast.error('Failed'); }
  };

  const toggleSkill = (skill) => {
    setForm(f => ({
      ...f, skills: f.skills.includes(skill) ? f.skills.filter(s => s !== skill) : [...f.skills, skill]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Volunteers</h1>
          <p className="text-sm text-slate-500">{volunteers.length} total volunteers</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ ...EMPTY_VOL }); setShowCreate(true); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-shelter-primary text-white rounded-lg font-medium text-sm hover:opacity-90 shadow-sm">
          <Plus className="w-4 h-4" /> Add Volunteer
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center"><Users className="w-5 h-5 text-green-600" /></div>
          <div><p className="text-xl font-bold">{activeCount}</p><p className="text-xs text-slate-500">Active Volunteers</p></div>
        </div>
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><Clock className="w-5 h-5 text-blue-600" /></div>
          <div><p className="text-xl font-bold">{totalHours}h</p><p className="text-xs text-slate-500">Total Hours</p></div>
        </div>
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"><Award className="w-5 h-5 text-amber-600" /></div>
          <div><p className="text-xl font-bold">{volunteers.filter(v => (v.hours_logged || 0) >= 100).length}</p><p className="text-xs text-slate-500">Gold+ Members</p></div>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search volunteers..." className="w-full pl-9 pr-4 py-2.5 bg-white border rounded-lg text-sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(v => {
          const level = getLevel(v.hours_logged || 0);
          return (
            <div key={v.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-shelter-primary/10 flex items-center justify-center text-lg">{level.icon}</div>
                  <div>
                    <p className="font-semibold text-slate-900">{v.full_name}</p>
                    <p className="text-xs text-slate-500">{level.label} Level · {v.hours_logged || 0}h</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setShowLogHours(v); setHoursToLog(0); }} className="p-1.5 rounded hover:bg-slate-100" title="Log Hours"><Clock className="w-4 h-4 text-slate-500" /></button>
                  <button onClick={() => openEdit(v)} className="p-1.5 rounded hover:bg-slate-100" title="Edit"><Edit className="w-4 h-4 text-slate-500" /></button>
                </div>
              </div>
              {v.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {v.skills.map(s => <span key={s} className="text-xs bg-slate-100 px-2 py-0.5 rounded">{s}</span>)}
                </div>
              )}
              <div className="space-y-1 text-xs text-slate-500">
                {v.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{v.email}</div>}
                {v.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{v.phone}</div>}
              </div>
              {v.is_foster_eligible && <span className="mt-2 inline-block text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">Foster Eligible</span>}
              {v.status !== 'active' && <span className="mt-2 ml-2 inline-block text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded">Inactive</span>}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && !loading && <div className="py-16 text-center text-sm text-slate-400 bg-white rounded-xl border">No volunteers found</div>}

      {/* Create/Edit Panel */}
      <SlidePanel isOpen={showCreate} onClose={() => { setShowCreate(false); setEditing(null); }} title={editing ? 'Edit Volunteer' : 'Add Volunteer'}>
        <div className="space-y-4">
          <FormInput label="Full Name" required value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} />
          <FormRow>
            <FormInput label="Email" type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
            <FormInput label="Phone" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
          </FormRow>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Skills</label>
            <div className="flex flex-wrap gap-2">
              {SKILLS.map(s => (
                <button key={s} onClick={() => toggleSkill(s)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border', form.skills?.includes(s) ? 'bg-shelter-primary text-white' : 'bg-white border-slate-200 hover:bg-slate-50')}>{s}</button>
              ))}
            </div>
          </div>
          <FormInput label="Availability" value={form.availability} onChange={e => setForm(f => ({...f, availability: e.target.value}))} placeholder="e.g. Weekdays 9am-1pm" />
          <FormInput label="Emergency Contact" value={form.emergency_contact} onChange={e => setForm(f => ({...f, emergency_contact: e.target.value}))} />
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_foster_eligible} onChange={e => setForm(f => ({...f, is_foster_eligible: e.target.checked}))} />Foster Eligible</label>
          </div>
          {form.is_foster_eligible && <FormInput label="Max Foster Capacity" type="number" value={form.max_foster_capacity} onChange={e => setForm(f => ({...f, max_foster_capacity: parseInt(e.target.value) || 0}))} />}
          <FormTextarea label="Notes" rows={2} value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
          <div className="flex gap-3 pt-4 border-t">
            <button onClick={() => { setShowCreate(false); setEditing(null); }} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border hover:bg-slate-50">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-shelter-primary text-white hover:opacity-90 disabled:opacity-50">{saving ? 'Saving...' : editing ? 'Update' : 'Add Volunteer'}</button>
          </div>
        </div>
      </SlidePanel>

      {/* Log Hours Modal */}
      {showLogHours && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-bold">Log Hours: {showLogHours.full_name}</h3>
            <p className="text-sm text-slate-500">Current: {showLogHours.hours_logged || 0} hours</p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Hours to Add</label>
              <input type="number" min="0" step="0.5" value={hoursToLog} onChange={e => setHoursToLog(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2.5 border rounded-lg text-sm text-center text-lg font-bold" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowLogHours(null)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border hover:bg-slate-50">Cancel</button>
              <button onClick={logHours} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-shelter-primary text-white hover:opacity-90">Log Hours</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

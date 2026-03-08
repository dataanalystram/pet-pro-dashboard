import { useState, useEffect } from 'react';
import { shelterAPI } from '@/api';
import { Stethoscope, Plus, Search, Pill, AlertCircle, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import SlidePanel from '@/components/shared/SlidePanel';
import { FormInput, FormSelect, FormTextarea, FormRow } from '@/components/shared/FormField';

const RECORD_TYPES = [
  { value: 'intake_exam', label: 'Intake Exam' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'surgery', label: 'Surgery (Spay/Neuter)' },
  { value: 'treatment', label: 'Treatment' },
  { value: 'lab_test', label: 'Lab Test' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'dental', label: 'Dental' },
];

const EMPTY_RECORD = {
  animal_id: '', title: '', record_type: 'treatment', description: '',
  diagnosis: '', treatment_plan: '', medications: '', veterinarian_name: '',
  cost: '', weight: '', temperature: '', follow_up_date: '', notes: '',
};

export default function ShelterMedical() {
  const [records, setRecords] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_RECORD });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const fetchData = async () => {
    try {
      const [r, a] = await Promise.all([shelterAPI.getMedical({}), shelterAPI.getAnimals({})]);
      setRecords(r.data); setAnimals(a.data);
    } catch {} setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = records.filter(r => {
    if (filterType !== 'all' && r.record_type !== filterType) return false;
    if (search && !r.title?.toLowerCase().includes(search.toLowerCase()) && !r.diagnosis?.toLowerCase().includes(search.toLowerCase()) && !r.animal_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleCreate = async () => {
    if (!form.animal_id || !form.title) { toast.error('Animal and title required'); return; }
    setSaving(true);
    try {
      await shelterAPI.createMedical({ ...form, cost: parseFloat(form.cost) || 0 });
      toast.success('Record created');
      setShowCreate(false); setForm({ ...EMPTY_RECORD }); fetchData();
    } catch { toast.error('Failed'); }
    setSaving(false);
  };

  const medOnAnimals = animals.filter(a => a.status === 'medical_hold').length;
  const quarantine = animals.filter(a => a.status === 'quarantine').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medical Center</h1>
          <p className="text-sm text-slate-500">{records.length} medical records</p>
        </div>
        <button onClick={() => { setForm({ ...EMPTY_RECORD }); setShowCreate(true); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-shelter-primary text-white rounded-lg font-medium text-sm hover:opacity-90 shadow-sm">
          <Plus className="w-4 h-4" /> New Record
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"><Stethoscope className="w-5 h-5 text-amber-600" /></div>
          <div><p className="text-xl font-bold">{medOnAnimals}</p><p className="text-xs text-slate-500">Medical Hold</p></div>
        </div>
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center"><AlertCircle className="w-5 h-5 text-red-600" /></div>
          <div><p className="text-xl font-bold text-red-600">{quarantine}</p><p className="text-xs text-slate-500">Quarantine</p></div>
        </div>
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><Activity className="w-5 h-5 text-blue-600" /></div>
          <div><p className="text-xl font-bold">{records.length}</p><p className="text-xs text-slate-500">Total Records</p></div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search records..." className="w-full pl-9 pr-4 py-2.5 bg-white border rounded-lg text-sm" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2.5 bg-white border rounded-lg text-sm">
          <option value="all">All Types</option>
          {RECORD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map(r => (
          <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <Stethoscope className="w-4 h-4 text-shelter-primary" />
                <span className="font-semibold text-slate-900">{r.title}</span>
                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded capitalize">{r.record_type?.replace(/_/g, ' ')}</span>
                {r.animal_name && <span className="text-xs text-slate-500">\u2014 {r.animal_name}</span>}
              </div>
              <span className="text-xs text-slate-400">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</span>
            </div>
            <p className="text-sm text-slate-600 mt-2">{r.description}</p>
            {r.diagnosis && <p className="text-sm mt-1"><strong className="text-slate-700">Diagnosis:</strong> <span className="text-slate-500">{r.diagnosis}</span></p>}
            {r.treatment_plan && <p className="text-sm mt-1"><strong className="text-slate-700">Plan:</strong> <span className="text-slate-500">{r.treatment_plan}</span></p>}
            {r.medications && <p className="text-sm mt-1 flex items-center gap-1"><Pill className="w-3.5 h-3.5 text-slate-400" /><span className="text-slate-500">{r.medications}</span></p>}
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
              {r.veterinarian_name && <span>By {r.veterinarian_name}</span>}
              {r.cost > 0 && <span>\u20AC{r.cost.toFixed(2)}</span>}
              {r.weight && <span>Weight: {r.weight}kg</span>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && !loading && <div className="py-16 text-center text-sm text-slate-400 bg-white rounded-xl border">No medical records found</div>}
      </div>

      {/* Create Panel */}
      <SlidePanel isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Medical Record" subtitle="Record medical information" width="max-w-xl">
        <div className="space-y-4">
          <FormSelect label="Animal" required options={[{value:'',label:'Select animal...'}, ...animals.map(a => ({value:a.id,label:`${a.name} (${a.species} - ${a.breed || ''})`}))]} value={form.animal_id} onChange={e => setForm(f => ({...f, animal_id: e.target.value}))} />
          <FormRow>
            <FormInput label="Title" required value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="e.g. Initial exam" />
            <FormSelect label="Type" options={RECORD_TYPES} value={form.record_type} onChange={e => setForm(f => ({...f, record_type: e.target.value}))} />
          </FormRow>
          <FormTextarea label="Description" rows={3} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Describe findings..." />
          <FormRow>
            <FormInput label="Diagnosis" value={form.diagnosis} onChange={e => setForm(f => ({...f, diagnosis: e.target.value}))} />
            <FormInput label="Veterinarian" value={form.veterinarian_name} onChange={e => setForm(f => ({...f, veterinarian_name: e.target.value}))} />
          </FormRow>
          <FormTextarea label="Treatment Plan" rows={2} value={form.treatment_plan} onChange={e => setForm(f => ({...f, treatment_plan: e.target.value}))} />
          <FormInput label="Medications" value={form.medications} onChange={e => setForm(f => ({...f, medications: e.target.value}))} placeholder="List medications..." />
          <FormRow>
            <FormInput label="Weight (kg)" type="number" step="0.1" value={form.weight} onChange={e => setForm(f => ({...f, weight: e.target.value}))} />
            <FormInput label="Temperature (\u00B0C)" type="number" step="0.1" value={form.temperature} onChange={e => setForm(f => ({...f, temperature: e.target.value}))} />
          </FormRow>
          <FormRow>
            <FormInput label="Cost (\u20AC)" type="number" step="0.01" value={form.cost} onChange={e => setForm(f => ({...f, cost: e.target.value}))} />
            <FormInput label="Follow-up Date" type="date" value={form.follow_up_date} onChange={e => setForm(f => ({...f, follow_up_date: e.target.value}))} />
          </FormRow>
          <FormTextarea label="Notes" rows={2} value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
          <div className="flex gap-3 pt-4 border-t">
            <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border hover:bg-slate-50">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-shelter-primary text-white hover:opacity-90 disabled:opacity-50">{saving ? 'Creating...' : 'Create Record'}</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}

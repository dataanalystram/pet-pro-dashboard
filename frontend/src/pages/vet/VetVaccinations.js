import { useState, useEffect } from 'react';
import { vetAPI } from '@/api';
import { Syringe, Plus, Search, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import SlidePanel from '@/components/shared/SlidePanel';
import { FormInput, FormSelect, FormTextarea, FormRow } from '@/components/shared/FormField';

const COMMON_VACCINES = {
  canine: ['DHPP', 'Rabies', 'Bordetella', 'Canine Influenza', 'Leptospirosis', 'Lyme'],
  feline: ['FVRCP', 'Rabies', 'FeLV', 'FIV'],
};

const EMPTY_VAX = {
  patient_id: '', vaccine_name: '', vaccine_type: 'core', manufacturer: '', lot_number: '',
  serial_number: '', expiry_date: '', administered_date: new Date().toISOString().split('T')[0],
  next_due_date: '', route: 'SQ', site: 'Right shoulder', administered_by: '',
  notes: '', is_rabies: false,
};

export default function VetVaccinations() {
  const [vaxes, setVaxes] = useState([]);
  const [patients, setPatients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_VAX });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchData = async () => {
    try {
      const [v, p, s] = await Promise.all([vetAPI.getVaccinations({}), vetAPI.getPatients(), vetAPI.getStaff()]);
      setVaxes(v.data); setPatients(p.data); setStaff(s.data);
    } catch {} setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const now = new Date();
  const overdue = vaxes.filter(v => v.next_due_date && new Date(v.next_due_date) < now);
  const dueSoon = vaxes.filter(v => v.next_due_date && new Date(v.next_due_date) >= now && new Date(v.next_due_date) <= new Date(now.getTime() + 30*86400000));
  const current = vaxes.filter(v => !v.next_due_date || new Date(v.next_due_date) > new Date(now.getTime() + 30*86400000));

  const filtered = vaxes.filter(v => {
    if (filter === 'overdue' && !(v.next_due_date && new Date(v.next_due_date) < now)) return false;
    if (filter === 'due_soon' && !(v.next_due_date && new Date(v.next_due_date) >= now && new Date(v.next_due_date) <= new Date(now.getTime() + 30*86400000))) return false;
    if (filter === 'current' && v.next_due_date && new Date(v.next_due_date) <= new Date(now.getTime() + 30*86400000)) return false;
    if (search && !v.vaccine_name?.toLowerCase().includes(search.toLowerCase()) && !v.patient_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selectVaccine = (name) => {
    const isRabies = name === 'Rabies';
    const nextDue = new Date();
    nextDue.setFullYear(nextDue.getFullYear() + (isRabies ? 3 : 1));
    setForm(f => ({ ...f, vaccine_name: name, is_rabies: isRabies, next_due_date: nextDue.toISOString().split('T')[0] }));
  };

  const handleCreate = async () => {
    if (!form.patient_id || !form.vaccine_name) { toast.error('Patient and vaccine required'); return; }
    setSaving(true);
    try {
      await vetAPI.createVaccination(form);
      toast.success('Vaccination recorded');
      setShowCreate(false); setForm({ ...EMPTY_VAX }); fetchData();
    } catch { toast.error('Failed'); }
    setSaving(false);
  };

  const selectedPatient = patients.find(p => p.id === form.patient_id);
  const speciesVaccines = selectedPatient?.species?.toLowerCase() === 'feline' ? COMMON_VACCINES.feline : COMMON_VACCINES.canine;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vaccination Records</h1>
          <p className="text-sm text-slate-500">{vaxes.length} records</p>
        </div>
        <button onClick={() => { setForm({ ...EMPTY_VAX }); setShowCreate(true); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-vet-primary text-white rounded-lg font-medium text-sm hover:bg-vet-secondary shadow-sm">
          <Plus className="w-4 h-4" /> Record Vaccination
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center"><AlertCircle className="w-5 h-5 text-red-600" /></div>
          <div><p className="text-2xl font-bold text-red-600">{overdue.length}</p><p className="text-xs text-slate-500">Overdue</p></div>
        </div>
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"><Clock className="w-5 h-5 text-amber-600" /></div>
          <div><p className="text-2xl font-bold text-amber-600">{dueSoon.length}</p><p className="text-xs text-slate-500">Due in 30 Days</p></div>
        </div>
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-green-600" /></div>
          <div><p className="text-2xl font-bold text-green-600">{current.length}</p><p className="text-xs text-slate-500">Current</p></div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vaccinations..." className="w-full pl-9 pr-4 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vet-primary/20" />
        </div>
        {['all','overdue','due_soon','current'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={cn('px-3 py-2 rounded-lg text-xs font-medium capitalize', filter === f ? 'bg-vet-primary text-white' : 'bg-white border text-slate-600 hover:bg-slate-50')}>{f.replace('_',' ')}</button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b"><tr>
            <th className="text-left px-5 py-3 font-semibold text-slate-600">Vaccine</th>
            <th className="text-left px-5 py-3 font-semibold text-slate-600">Patient</th>
            <th className="text-left px-5 py-3 font-semibold text-slate-600">Type</th>
            <th className="text-left px-5 py-3 font-semibold text-slate-600">Date Given</th>
            <th className="text-left px-5 py-3 font-semibold text-slate-600">Next Due</th>
            <th className="text-left px-5 py-3 font-semibold text-slate-600 hidden lg:table-cell">Manufacturer</th>
            <th className="text-left px-5 py-3 font-semibold text-slate-600 hidden lg:table-cell">Lot #</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(v => {
              const isOverdue = v.next_due_date && new Date(v.next_due_date) < now;
              const isDueSoon = v.next_due_date && !isOverdue && new Date(v.next_due_date) <= new Date(now.getTime() + 30*86400000);
              return (
                <tr key={v.id} className={cn('hover:bg-slate-50', isOverdue && 'bg-red-50/50')}>
                  <td className="px-5 py-3 font-medium text-slate-900"><div className="flex items-center gap-2"><Syringe className="w-4 h-4 text-vet-primary" />{v.vaccine_name}{v.is_rabies && <span className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">Rabies</span>}</div></td>
                  <td className="px-5 py-3 text-slate-600">{v.patient_name || '-'}</td>
                  <td className="px-5 py-3"><span className={cn('px-2 py-0.5 rounded text-xs font-medium', v.vaccine_type === 'core' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600')}>{v.vaccine_type}</span></td>
                  <td className="px-5 py-3 text-slate-500">{v.administered_date ? new Date(v.administered_date).toLocaleDateString() : '-'}</td>
                  <td className={cn('px-5 py-3 font-medium', isOverdue ? 'text-red-600' : isDueSoon ? 'text-amber-600' : 'text-slate-500')}>
                    {v.next_due_date ? new Date(v.next_due_date).toLocaleDateString() : '-'}
                    {isOverdue && <span className="ml-1 text-xs">OVERDUE</span>}
                  </td>
                  <td className="px-5 py-3 text-slate-500 hidden lg:table-cell">{v.manufacturer || '-'}</td>
                  <td className="px-5 py-3 text-slate-400 font-mono text-xs hidden lg:table-cell">{v.lot_number || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="py-16 text-center text-sm text-slate-400">No vaccination records found</div>}
      </div>

      {/* Create Vaccination Panel */}
      <SlidePanel isOpen={showCreate} onClose={() => setShowCreate(false)} title="Record Vaccination" subtitle="Add a new vaccination record">
        <div className="space-y-4">
          <FormSelect label="Patient" required options={[{ value: '', label: 'Select patient...' }, ...patients.map(p => ({ value: p.id, label: `${p.name} (${p.species} - ${p.breed || ''})` }))]} value={form.patient_id} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))} />

          {form.patient_id && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Quick Select Vaccine</label>
              <div className="flex flex-wrap gap-2">
                {speciesVaccines.map(v => (
                  <button key={v} onClick={() => selectVaccine(v)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border', form.vaccine_name === v ? 'bg-vet-primary text-white border-vet-primary' : 'bg-white border-slate-200 hover:bg-slate-50')}>{v}</button>
                ))}
              </div>
            </div>
          )}

          <FormInput label="Vaccine Name" required value={form.vaccine_name} onChange={e => setForm(f => ({ ...f, vaccine_name: e.target.value }))} placeholder="Vaccine name" />
          <FormRow>
            <FormSelect label="Type" options={[{value:'core',label:'Core'},{value:'non-core',label:'Non-Core'}]} value={form.vaccine_type} onChange={e => setForm(f => ({ ...f, vaccine_type: e.target.value }))} />
            <FormInput label="Manufacturer" value={form.manufacturer} onChange={e => setForm(f => ({ ...f, manufacturer: e.target.value }))} />
          </FormRow>
          <FormRow>
            <FormInput label="Lot Number" value={form.lot_number} onChange={e => setForm(f => ({ ...f, lot_number: e.target.value }))} />
            <FormInput label="Expiry Date" type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
          </FormRow>
          <FormRow>
            <FormInput label="Date Administered" required type="date" value={form.administered_date} onChange={e => setForm(f => ({ ...f, administered_date: e.target.value }))} />
            <FormInput label="Next Due Date" type="date" value={form.next_due_date} onChange={e => setForm(f => ({ ...f, next_due_date: e.target.value }))} />
          </FormRow>
          <FormRow>
            <FormSelect label="Route" options={[{value:'SQ',label:'SQ (Subcutaneous)'},{value:'IM',label:'IM (Intramuscular)'},{value:'IN',label:'IN (Intranasal)'},{value:'PO',label:'PO (Oral)'}]} value={form.route} onChange={e => setForm(f => ({ ...f, route: e.target.value }))} />
            <FormInput label="Site" value={form.site} onChange={e => setForm(f => ({ ...f, site: e.target.value }))} placeholder="e.g. Right shoulder" />
          </FormRow>
          <FormSelect label="Administered By" options={[{ value: '', label: 'Select staff...' }, ...staff.map(s => ({ value: s.id, label: s.full_name }))]} value={form.administered_by} onChange={e => setForm(f => ({ ...f, administered_by: e.target.value }))} />
          <FormTextarea label="Notes" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />

          <div className="flex gap-3 pt-4 border-t">
            <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 border hover:bg-slate-50">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-vet-primary text-white hover:bg-vet-secondary disabled:opacity-50">
              {saving ? 'Recording...' : 'Record Vaccination'}
            </button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}

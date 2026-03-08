import { useState, useEffect } from 'react';
import { vetAPI } from '@/api';
import { Pill, Plus, Search, AlertTriangle, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import SlidePanel from '@/components/shared/SlidePanel';
import { FormInput, FormSelect, FormTextarea, FormRow } from '@/components/shared/FormField';

const STATUS_COLORS = {
  active: 'bg-green-50 text-green-700',
  completed: 'bg-blue-50 text-blue-700',
  cancelled: 'bg-red-50 text-red-600',
  expired: 'bg-slate-100 text-slate-600',
};

const COMMON_DRUGS = [
  { name: 'Amoxicillin', strengths: ['250mg', '500mg'], form: 'Tablet', route: 'PO', freq: 'BID', dose_range: '10-20 mg/kg' },
  { name: 'Cephalexin', strengths: ['250mg', '500mg'], form: 'Capsule', route: 'PO', freq: 'BID', dose_range: '15-30 mg/kg' },
  { name: 'Metronidazole', strengths: ['250mg', '500mg'], form: 'Tablet', route: 'PO', freq: 'BID', dose_range: '10-15 mg/kg' },
  { name: 'Carprofen', strengths: ['25mg', '75mg', '100mg'], form: 'Tablet', route: 'PO', freq: 'BID', dose_range: '2-4 mg/kg' },
  { name: 'Prednisone', strengths: ['5mg', '10mg', '20mg'], form: 'Tablet', route: 'PO', freq: 'SID', dose_range: '0.5-2 mg/kg' },
  { name: 'Gabapentin', strengths: ['100mg', '300mg'], form: 'Capsule', route: 'PO', freq: 'BID-TID', dose_range: '5-10 mg/kg' },
  { name: 'Cerenia', strengths: ['16mg', '24mg', '60mg'], form: 'Tablet', route: 'PO', freq: 'SID', dose_range: '2 mg/kg' },
  { name: 'Apoquel', strengths: ['3.6mg', '5.4mg', '16mg'], form: 'Tablet', route: 'PO', freq: 'BID then SID', dose_range: '0.4-0.6 mg/kg' },
];

const EMPTY_RX = {
  patient_id: '', drug_name: '', drug_strength: '', drug_form: 'Tablet', dose: '', route: 'PO',
  frequency: 'BID', duration_days: 14, quantity_dispensed: '', quantity_unit: 'tablets',
  refills_authorized: 0, client_instructions: '', prescriber_notes: '', is_controlled: false,
};

export default function VetPrescriptions() {
  const [rxs, setRxs] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_RX });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedDrug, setSelectedDrug] = useState(null);

  const fetchData = async () => {
    try {
      const [r, p] = await Promise.all([vetAPI.getPrescriptions({}), vetAPI.getPatients()]);
      setRxs(r.data); setPatients(p.data);
    } catch {} setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = rxs.filter(rx => {
    if (filter !== 'all' && rx.status !== filter) return false;
    if (search && !rx.drug_name?.toLowerCase().includes(search.toLowerCase()) && !rx.patient_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selectDrug = (drug) => {
    setSelectedDrug(drug);
    const patient = patients.find(p => p.id === form.patient_id);
    const weight = patient?.weight || 0;
    setForm(f => ({
      ...f, drug_name: drug.name, drug_strength: drug.strengths[0], drug_form: drug.form,
      route: drug.route, frequency: drug.freq,
      client_instructions: `Give ${drug.strengths[0]} ${drug.form.toLowerCase()} by mouth ${drug.freq === 'BID' ? 'twice daily' : drug.freq === 'TID' ? 'three times daily' : 'once daily'} for ${f.duration_days} days.${drug.route === 'PO' ? ' Give with food.' : ''} Complete full course.`,
    }));
  };

  const calcQuantity = () => {
    const freqMultiplier = form.frequency === 'TID' ? 3 : form.frequency === 'BID' ? 2 : 1;
    return freqMultiplier * (form.duration_days || 0);
  };

  const handleCreate = async () => {
    if (!form.patient_id || !form.drug_name) { toast.error('Patient and drug required'); return; }
    setSaving(true);
    try {
      const qty = form.quantity_dispensed || calcQuantity();
      await vetAPI.createPrescription({
        ...form, quantity_dispensed: qty, prescribed_date: new Date().toISOString(), status: 'active',
      });
      toast.success('Prescription created');
      setShowCreate(false); setForm({ ...EMPTY_RX }); setSelectedDrug(null); fetchData();
    } catch { toast.error('Failed'); }
    setSaving(false);
  };

  const activeCount = rxs.filter(r => r.status === 'active').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Prescriptions</h1>
          <p className="text-sm text-slate-500">{activeCount} active prescriptions</p>
        </div>
        <button onClick={() => { setForm({ ...EMPTY_RX }); setSelectedDrug(null); setShowCreate(true); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-vet-primary text-white rounded-lg font-medium text-sm hover:bg-vet-secondary shadow-sm">
          <Plus className="w-4 h-4" /> New Prescription
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search prescriptions..." className="w-full pl-9 pr-4 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vet-primary/20" />
        </div>
        {['all','active','completed','cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={cn('px-3 py-2 rounded-lg text-xs font-medium capitalize', filter === f ? 'bg-vet-primary text-white' : 'bg-white border text-slate-600 hover:bg-slate-50')}>{f}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(rx => (
          <div key={rx.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Pill className="w-4 h-4 text-vet-primary" />
                  <span className="font-semibold text-slate-900">{rx.drug_name} {rx.drug_strength}</span>
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', STATUS_COLORS[rx.status] || STATUS_COLORS.active)}>{rx.status}</span>
                  {rx.is_controlled && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Controlled</span>}
                </div>
                <p className="text-sm text-slate-600 mt-1">{rx.patient_name} — {rx.dose} {rx.route} {rx.frequency} x {rx.duration_days || '?'} days</p>
                <p className="text-sm text-slate-500">Qty: {rx.quantity_dispensed} {rx.quantity_unit} · Refills: {rx.refills_used || 0}/{rx.refills_authorized || 0}</p>
                {rx.client_instructions && <div className="mt-2 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">{rx.client_instructions}</div>}
                <p className="text-xs text-slate-400 mt-2">Prescribed {rx.prescribed_date ? new Date(rx.prescribed_date).toLocaleDateString() : '-'} by {rx.prescriber_name || 'Dr.'}</p>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && !loading && <div className="py-16 text-center text-sm text-slate-400 bg-white rounded-xl border">No prescriptions found</div>}
      </div>

      {/* Create Prescription Panel */}
      <SlidePanel isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Prescription" subtitle="Prescribe medication" width="max-w-2xl">
        <div className="space-y-4">
          <FormSelect label="Patient" required options={[{ value: '', label: 'Select patient...' }, ...patients.map(p => ({ value: p.id, label: `${p.name} (${p.species} - ${p.breed || ''}) ${p.weight ? p.weight + 'kg' : ''}` }))]} value={form.patient_id} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))} />

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Drug (click to select or type custom)</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {COMMON_DRUGS.map(drug => (
                <button key={drug.name} onClick={() => selectDrug(drug)} className={cn('text-left p-2.5 rounded-lg border text-sm transition-colors', selectedDrug?.name === drug.name ? 'bg-vet-primary/10 border-vet-primary text-vet-primary' : 'bg-white border-slate-200 hover:bg-slate-50')}>
                  <span className="font-medium">{drug.name}</span>
                  <span className="text-xs text-slate-500 block">{drug.dose_range}</span>
                </button>
              ))}
            </div>
            <input value={form.drug_name} onChange={e => setForm(f => ({ ...f, drug_name: e.target.value }))} placeholder="Or type drug name..." className="w-full px-3 py-2.5 border rounded-lg text-sm" />
          </div>

          <FormRow>
            <FormInput label="Strength" value={form.drug_strength} onChange={e => setForm(f => ({ ...f, drug_strength: e.target.value }))} placeholder="e.g. 500mg" />
            <FormSelect label="Form" options={[{value:'Tablet',label:'Tablet'},{value:'Capsule',label:'Capsule'},{value:'Liquid',label:'Liquid'},{value:'Injection',label:'Injection'},{value:'Topical',label:'Topical'}]} value={form.drug_form} onChange={e => setForm(f => ({ ...f, drug_form: e.target.value }))} />
          </FormRow>
          <FormRow>
            <FormInput label="Dose" value={form.dose} onChange={e => setForm(f => ({ ...f, dose: e.target.value }))} placeholder="e.g. 1 tablet" />
            <FormSelect label="Route" options={[{value:'PO',label:'PO (Oral)'},{value:'SQ',label:'SQ (Subcutaneous)'},{value:'IM',label:'IM (Intramuscular)'},{value:'IV',label:'IV (Intravenous)'},{value:'Topical',label:'Topical'}]} value={form.route} onChange={e => setForm(f => ({ ...f, route: e.target.value }))} />
          </FormRow>
          <FormRow>
            <FormSelect label="Frequency" options={[{value:'SID',label:'SID (Once daily)'},{value:'BID',label:'BID (Twice daily)'},{value:'TID',label:'TID (Three times daily)'},{value:'QID',label:'QID (Four times daily)'},{value:'PRN',label:'PRN (As needed)'}]} value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))} />
            <FormInput label="Duration (days)" type="number" value={form.duration_days} onChange={e => setForm(f => ({ ...f, duration_days: parseInt(e.target.value) || 0 }))} />
          </FormRow>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <p className="font-medium text-blue-800">Auto-calculated: {calcQuantity()} {form.quantity_unit}</p>
            <p className="text-blue-600 text-xs">Based on {form.frequency} x {form.duration_days} days</p>
          </div>

          <FormRow>
            <FormInput label="Quantity" type="number" value={form.quantity_dispensed || calcQuantity()} onChange={e => setForm(f => ({ ...f, quantity_dispensed: parseInt(e.target.value) || 0 }))} />
            <FormInput label="Refills Authorized" type="number" value={form.refills_authorized} onChange={e => setForm(f => ({ ...f, refills_authorized: parseInt(e.target.value) || 0 }))} />
          </FormRow>

          <FormTextarea label="Client Instructions" rows={3} value={form.client_instructions} onChange={e => setForm(f => ({ ...f, client_instructions: e.target.value }))} placeholder="Instructions for the pet owner..." />

          <div className="flex gap-3 pt-4 border-t">
            <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 border hover:bg-slate-50">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-vet-primary text-white hover:bg-vet-secondary disabled:opacity-50">
              {saving ? 'Creating...' : 'Create Prescription'}
            </button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}

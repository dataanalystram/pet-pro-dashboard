import { useState, useEffect } from 'react';
import { vetAPI } from '@/api';
import { FileText, Plus, Search, Stethoscope, Thermometer, Heart, Activity, Scale, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import SlidePanel from '@/components/shared/SlidePanel';
import { FormInput, FormSelect, FormTextarea, FormRow } from '@/components/shared/FormField';

const RECORD_TYPES = [
  { value: 'wellness_exam', label: 'Wellness Exam' },
  { value: 'sick_visit', label: 'Sick Visit' },
  { value: 'dental', label: 'Dental Procedure' },
  { value: 'surgery', label: 'Surgery' },
  { value: 'vaccination_visit', label: 'Vaccination Visit' },
  { value: 'recheck', label: 'Recheck' },
  { value: 'emergency', label: 'Emergency' },
];

const EMPTY_SOAP = {
  patient_id: '', record_type: 'wellness_exam', subjective: '', objective: '',
  assessment: '', plan: '', temperature: '', heart_rate: '', respiratory_rate: '',
  weight: '', body_condition_score: '', pain_score: '', diagnosis: '',
  differential_diagnoses: '', treatment_notes: '', follow_up_date: '', status: 'draft',
};

export default function VetRecords() {
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_SOAP });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      const [r, p] = await Promise.all([vetAPI.getMedicalRecords({}), vetAPI.getPatients()]);
      setRecords(r.data); setPatients(p.data);
    } catch {} setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = records.filter(r => {
    if (search && !r.patient_name?.toLowerCase().includes(search.toLowerCase()) && !r.diagnosis?.toLowerCase().includes(search.toLowerCase()) && !r.record_type?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleCreate = async () => {
    if (!form.patient_id) { toast.error('Select a patient'); return; }
    setSaving(true);
    try {
      await vetAPI.createMedicalRecord({ ...form, record_date: new Date().toISOString() });
      toast.success('Medical record created');
      setShowCreate(false); setForm({ ...EMPTY_SOAP }); fetchData();
    } catch { toast.error('Failed'); }
    setSaving(false);
  };

  const finalize = async (record) => {
    try {
      await vetAPI.updateMedicalRecord(record.id, { status: 'finalized' });
      toast.success('Record finalized');
      fetchData();
      setShowDetail(null);
    } catch { toast.error('Failed to finalize'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medical Records (SOAP)</h1>
          <p className="text-sm text-slate-500">{records.length} records</p>
        </div>
        <button onClick={() => { setForm({ ...EMPTY_SOAP }); setShowCreate(true); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-vet-primary text-white rounded-lg font-medium text-sm hover:bg-vet-secondary shadow-sm">
          <Plus className="w-4 h-4" /> New SOAP Note
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search records..." className="w-full pl-9 pr-4 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vet-primary/20" />
      </div>

      <div className="space-y-3">
        {filtered.map(r => (
          <div key={r.id} onClick={() => setShowDetail(r)} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-vet-primary/10 flex items-center justify-center"><Stethoscope className="w-5 h-5 text-vet-primary" /></div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{r.patient_name}</span>
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded capitalize">{r.record_type?.replace(/_/g, ' ')}</span>
                    <span className={cn('text-xs px-2 py-0.5 rounded', r.status === 'finalized' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700')}>{r.status || 'draft'}</span>
                  </div>
                  {r.diagnosis && <p className="text-sm text-slate-600 mt-0.5">Dx: {r.diagnosis}</p>}
                  <p className="text-xs text-slate-400 mt-1">By {r.veterinarian_name || 'Dr.'} · {r.record_date ? new Date(r.record_date).toLocaleDateString() : '-'}</p>
                </div>
              </div>
              <Eye className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        ))}
        {filtered.length === 0 && !loading && <div className="py-16 text-center text-sm text-slate-400 bg-white rounded-xl border">No medical records found</div>}
      </div>

      {/* Create SOAP Panel */}
      <SlidePanel isOpen={showCreate} onClose={() => setShowCreate(false)} title="New SOAP Note" subtitle="Create a medical record" width="max-w-2xl">
        <div className="space-y-4">
          <FormRow>
            <FormSelect label="Patient" required options={[{ value: '', label: 'Select patient...' }, ...patients.map(p => ({ value: p.id, label: `${p.name} (${p.species} - ${p.breed || ''})` }))]} value={form.patient_id} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))} />
            <FormSelect label="Record Type" options={RECORD_TYPES} value={form.record_type} onChange={e => setForm(f => ({ ...f, record_type: e.target.value }))} />
          </FormRow>

          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <p className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Activity className="w-4 h-4" /> Vitals</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1"><label className="text-xs text-slate-500 flex items-center gap-1"><Thermometer className="w-3 h-3" />Temp (\u00B0C)</label><input type="number" step="0.1" value={form.temperature} onChange={e => setForm(f => ({...f, temperature: e.target.value}))} className="w-full px-2 py-2 border rounded-lg text-sm" placeholder="38.5" /></div>
              <div className="space-y-1"><label className="text-xs text-slate-500 flex items-center gap-1"><Heart className="w-3 h-3" />Heart Rate</label><input type="number" value={form.heart_rate} onChange={e => setForm(f => ({...f, heart_rate: e.target.value}))} className="w-full px-2 py-2 border rounded-lg text-sm" placeholder="120" /></div>
              <div className="space-y-1"><label className="text-xs text-slate-500">Resp. Rate</label><input type="number" value={form.respiratory_rate} onChange={e => setForm(f => ({...f, respiratory_rate: e.target.value}))} className="w-full px-2 py-2 border rounded-lg text-sm" placeholder="24" /></div>
              <div className="space-y-1"><label className="text-xs text-slate-500 flex items-center gap-1"><Scale className="w-3 h-3" />Weight (kg)</label><input type="number" step="0.1" value={form.weight} onChange={e => setForm(f => ({...f, weight: e.target.value}))} className="w-full px-2 py-2 border rounded-lg text-sm" placeholder="28.0" /></div>
              <div className="space-y-1"><label className="text-xs text-slate-500">BCS (1-9)</label><input type="number" min="1" max="9" value={form.body_condition_score} onChange={e => setForm(f => ({...f, body_condition_score: e.target.value}))} className="w-full px-2 py-2 border rounded-lg text-sm" placeholder="5" /></div>
              <div className="space-y-1"><label className="text-xs text-slate-500">Pain (0-10)</label><input type="number" min="0" max="10" value={form.pain_score} onChange={e => setForm(f => ({...f, pain_score: e.target.value}))} className="w-full px-2 py-2 border rounded-lg text-sm" placeholder="0" /></div>
            </div>
          </div>

          <div className="space-y-1.5 border-l-4 border-blue-400 pl-4">
            <label className="text-sm font-bold text-blue-800">S: Subjective</label>
            <textarea value={form.subjective} onChange={e => setForm(f => ({...f, subjective: e.target.value}))} rows={3} className="w-full px-3 py-2.5 border rounded-lg text-sm resize-none" placeholder="Owner reports..." />
          </div>
          <div className="space-y-1.5 border-l-4 border-green-400 pl-4">
            <label className="text-sm font-bold text-green-800">O: Objective</label>
            <textarea value={form.objective} onChange={e => setForm(f => ({...f, objective: e.target.value}))} rows={3} className="w-full px-3 py-2.5 border rounded-lg text-sm resize-none" placeholder="Physical exam findings..." />
          </div>
          <div className="space-y-1.5 border-l-4 border-amber-400 pl-4">
            <label className="text-sm font-bold text-amber-800">A: Assessment</label>
            <FormInput label="Diagnosis" value={form.diagnosis} onChange={e => setForm(f => ({...f, diagnosis: e.target.value}))} placeholder="Primary diagnosis" />
            <textarea value={form.assessment} onChange={e => setForm(f => ({...f, assessment: e.target.value}))} rows={2} className="w-full px-3 py-2.5 border rounded-lg text-sm resize-none" placeholder="Assessment notes..." />
          </div>
          <div className="space-y-1.5 border-l-4 border-purple-400 pl-4">
            <label className="text-sm font-bold text-purple-800">P: Plan</label>
            <textarea value={form.plan} onChange={e => setForm(f => ({...f, plan: e.target.value}))} rows={3} className="w-full px-3 py-2.5 border rounded-lg text-sm resize-none" placeholder="Treatment plan, medications, follow-up..." />
            <FormInput label="Follow-up Date" type="date" value={form.follow_up_date} onChange={e => setForm(f => ({...f, follow_up_date: e.target.value}))} />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 border hover:bg-slate-50">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-vet-primary text-white hover:bg-vet-secondary disabled:opacity-50">
              {saving ? 'Saving...' : 'Save SOAP Note'}
            </button>
          </div>
        </div>
      </SlidePanel>

      {/* Detail Panel */}
      <SlidePanel isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={`SOAP Note — ${showDetail?.patient_name || ''}`} subtitle={showDetail?.record_type?.replace(/_/g, ' ')} width="max-w-2xl">
        {showDetail && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', showDetail.status === 'finalized' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700')}>{showDetail.status || 'draft'}</span>
              <span className="text-sm text-slate-500">{showDetail.record_date ? new Date(showDetail.record_date).toLocaleDateString() : ''}</span>
              <span className="text-sm text-slate-500">by {showDetail.veterinarian_name}</span>
            </div>

            {(showDetail.temperature || showDetail.heart_rate || showDetail.weight) && (
              <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-3 gap-4 text-sm">
                {showDetail.temperature && <div><span className="text-slate-500">Temp:</span> <span className="font-medium">{showDetail.temperature}\u00B0C</span></div>}
                {showDetail.heart_rate && <div><span className="text-slate-500">HR:</span> <span className="font-medium">{showDetail.heart_rate}</span></div>}
                {showDetail.respiratory_rate && <div><span className="text-slate-500">RR:</span> <span className="font-medium">{showDetail.respiratory_rate}</span></div>}
                {showDetail.weight && <div><span className="text-slate-500">Weight:</span> <span className="font-medium">{showDetail.weight}kg</span></div>}
                {showDetail.body_condition_score && <div><span className="text-slate-500">BCS:</span> <span className="font-medium">{showDetail.body_condition_score}/9</span></div>}
                {showDetail.pain_score && <div><span className="text-slate-500">Pain:</span> <span className="font-medium">{showDetail.pain_score}/10</span></div>}
              </div>
            )}

            {showDetail.subjective && <div className="border-l-4 border-blue-400 pl-4"><p className="text-sm font-bold text-blue-800 mb-1">S: Subjective</p><p className="text-sm text-slate-600 whitespace-pre-wrap">{showDetail.subjective}</p></div>}
            {showDetail.objective && <div className="border-l-4 border-green-400 pl-4"><p className="text-sm font-bold text-green-800 mb-1">O: Objective</p><p className="text-sm text-slate-600 whitespace-pre-wrap">{showDetail.objective}</p></div>}
            {(showDetail.assessment || showDetail.diagnosis) && <div className="border-l-4 border-amber-400 pl-4"><p className="text-sm font-bold text-amber-800 mb-1">A: Assessment</p>{showDetail.diagnosis && <p className="text-sm font-medium text-slate-900">Dx: {showDetail.diagnosis}</p>}<p className="text-sm text-slate-600 whitespace-pre-wrap">{showDetail.assessment}</p></div>}
            {showDetail.plan && <div className="border-l-4 border-purple-400 pl-4"><p className="text-sm font-bold text-purple-800 mb-1">P: Plan</p><p className="text-sm text-slate-600 whitespace-pre-wrap">{showDetail.plan}</p></div>}

            {showDetail.status !== 'finalized' && (
              <button onClick={() => finalize(showDetail)} className="w-full py-2.5 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700">
                Finalize Record
              </button>
            )}
          </div>
        )}
      </SlidePanel>
    </div>
  );
}

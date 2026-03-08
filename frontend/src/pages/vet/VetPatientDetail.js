import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { vetAPI } from '@/api';
import { ArrowLeft, Dog, Cat, AlertCircle, Pill, Syringe, FileText, Plus, Heart, Weight, Ruler, Calendar, Phone, Mail, ChevronDown, ChevronUp, Edit3, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const TAB_LIST = [
  { key: 'overview', label: 'Overview' },
  { key: 'records', label: 'Medical Records' },
  { key: 'vaccinations', label: 'Vaccinations' },
  { key: 'prescriptions', label: 'Prescriptions' },
];

export default function VetPatientDetail() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showSoap, setShowSoap] = useState(false);
  const [soapData, setSoapData] = useState({ subjective: '', objective: '', assessment: '', plan: '', vitals: {} });
  const [savingSoap, setSavingSoap] = useState(false);

  useEffect(() => {
    vetAPI.getPatient(patientId).then(({ data }) => {
      setPatient(data);
      setLoading(false);
    }).catch(() => { setLoading(false); navigate('/vet/patients'); });
  }, [patientId, navigate]);

  const handleSaveSoap = async (status = 'draft') => {
    setSavingSoap(true);
    try {
      await vetAPI.createMedicalRecord({ ...soapData, patient_id: patientId, status });
      toast.success(status === 'finalized' ? 'Record finalized' : 'Draft saved');
      const { data } = await vetAPI.getPatient(patientId);
      setPatient(data);
      setShowSoap(false);
      setSoapData({ subjective: '', objective: '', assessment: '', plan: '', vitals: {} });
    } catch (e) { toast.error('Failed to save'); }
    setSavingSoap(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-vet-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!patient) return null;

  const SpeciesIcon = patient.species === 'feline' ? Cat : Dog;
  const client = patient.client || {};
  const records = patient.medical_records || [];
  const vaccinations = patient.vaccinations || [];
  const prescriptions = patient.prescriptions || [];
  const age = patient.date_of_birth ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;

  return (
    <div className="space-y-6">
      {/* Back */}
      <button onClick={() => navigate('/vet/patients')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Patients
      </button>

      {/* Patient Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-5">
          <div className={cn('w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0', patient.species === 'feline' ? 'bg-purple-50' : 'bg-cyan-50')}>
            <SpeciesIcon className={cn('w-10 h-10', patient.species === 'feline' ? 'text-purple-500' : 'text-cyan-600')} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">{patient.name}</h1>
              {patient.allergies?.length > 0 && <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Allergies: {patient.allergies.join(', ')}</span>}
              {patient.behavioral_alerts?.length > 0 && <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">{patient.behavioral_alerts[0]}</span>}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-slate-500">
              <span>{patient.breed || patient.species}</span>
              <span>{patient.sex?.replace('_', ' ')}</span>
              {age !== null && <span>{age < 1 ? `${patient.date_of_birth ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (30.44 * 24 * 60 * 60 * 1000)) : '?'}mo` : `${age}y`}</span>}
              {patient.weight_kg && <span className="flex items-center gap-1"><Weight className="w-3.5 h-3.5" />{patient.weight_kg}kg</span>}
              {patient.microchip_number && <span className="font-mono text-xs">MC: {patient.microchip_number}</span>}
            </div>
            {patient.chronic_conditions?.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{patient.chronic_conditions.map((c, i) => <span key={i} className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-medium">{c}</span>)}</div>}
          </div>
          {/* Owner */}
          <div className="sm:text-right flex-shrink-0">
            <p className="text-sm font-semibold text-slate-900">{client.first_name} {client.last_name}</p>
            {client.phone_primary && <p className="text-xs text-slate-500 flex items-center sm:justify-end gap-1 mt-1"><Phone className="w-3 h-3" />{client.phone_primary}</p>}
            {client.email && <p className="text-xs text-slate-500 flex items-center sm:justify-end gap-1 mt-0.5"><Mail className="w-3 h-3" />{client.email}</p>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
        {TAB_LIST.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap', activeTab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
            {t.label}
            {t.key === 'records' && records.length > 0 && <span className="ml-1.5 text-xs bg-slate-200 px-1.5 py-0.5 rounded-full">{records.length}</span>}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Patient Info</h3>
            <dl className="space-y-3 text-sm">
              <InfoRow label="Species" value={patient.species} />
              <InfoRow label="Breed" value={patient.breed} />
              <InfoRow label="Color" value={patient.color} />
              <InfoRow label="Sex" value={patient.sex?.replace('_', ' ')} />
              <InfoRow label="Date of Birth" value={patient.date_of_birth} />
              <InfoRow label="Weight" value={patient.weight_kg ? `${patient.weight_kg} kg` : null} />
              <InfoRow label="Microchip" value={patient.microchip_number} />
              <InfoRow label="Insurance" value={patient.insurance_provider} />
            </dl>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-base font-semibold text-slate-900 mb-3">Recent Medical Records</h3>
              {records.slice(0, 3).map(r => (
                <div key={r.id} className="py-2.5 border-b last:border-0 border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900">{r.assessment || 'Visit'}</span>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', r.status === 'finalized' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700')}>{r.status}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{new Date(r.record_date).toLocaleDateString()} · {r.veterinarian_name}</p>
                </div>
              ))}
              {records.length === 0 && <p className="text-sm text-slate-400">No records yet</p>}
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-base font-semibold text-slate-900 mb-3">Upcoming Vaccinations</h3>
              {vaccinations.filter(v => v.next_due_date && new Date(v.next_due_date) > new Date()).slice(0, 3).map(v => (
                <div key={v.id} className="py-2 border-b last:border-0 border-slate-100 flex items-center justify-between">
                  <div><span className="text-sm font-medium text-slate-900">{v.vaccine_name}</span><span className="text-xs text-slate-500 ml-2">{v.vaccine_type}</span></div>
                  <span className="text-xs text-slate-500">Due: {new Date(v.next_due_date).toLocaleDateString()}</span>
                </div>
              ))}
              {vaccinations.length === 0 && <p className="text-sm text-slate-400">No vaccinations recorded</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'records' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowSoap(!showSoap)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-vet-primary text-white rounded-lg font-medium text-sm hover:bg-vet-secondary">
              <Plus className="w-4 h-4" /> New SOAP Note
            </button>
          </div>

          {/* SOAP Editor */}
          {showSoap && (
            <div className="bg-white rounded-xl border-2 border-vet-primary/20 p-5 space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">SOAP Medical Record</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SoapSection label="S" title="Subjective" desc="Owner complaints, history" value={soapData.subjective} onChange={v => setSoapData(p => ({ ...p, subjective: v }))} color="text-blue-600" bg="bg-blue-50" />
                <SoapSection label="O" title="Objective" desc="Physical exam findings, vitals" value={soapData.objective} onChange={v => setSoapData(p => ({ ...p, objective: v }))} color="text-green-600" bg="bg-green-50" />
                <SoapSection label="A" title="Assessment" desc="Diagnoses, differentials" value={soapData.assessment} onChange={v => setSoapData(p => ({ ...p, assessment: v }))} color="text-amber-600" bg="bg-amber-50" />
                <SoapSection label="P" title="Plan" desc="Treatment plan, medications, follow-up" value={soapData.plan} onChange={v => setSoapData(p => ({ ...p, plan: v }))} color="text-purple-600" bg="bg-purple-50" />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowSoap(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
                <button onClick={() => handleSaveSoap('draft')} disabled={savingSoap} className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200">Save Draft</button>
                <button onClick={() => handleSaveSoap('finalized')} disabled={savingSoap} className="px-4 py-2 rounded-lg text-sm font-medium bg-vet-primary text-white hover:bg-vet-secondary">Finalize</button>
              </div>
            </div>
          )}

          {/* Records List */}
          <div className="space-y-4">
            {records.map(r => <SOAPRecordCard key={r.id} record={r} />)}
            {records.length === 0 && !showSoap && <div className="py-16 text-center text-sm text-slate-400 bg-white rounded-xl border border-slate-200">No medical records yet. Create the first SOAP note.</div>}
          </div>
        </div>
      )}

      {activeTab === 'vaccinations' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Vaccine</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 hidden sm:table-cell">Type</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Date Given</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Next Due</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 hidden md:table-cell">Manufacturer</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 hidden md:table-cell">Lot #</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vaccinations.map(v => {
                const isOverdue = v.next_due_date && new Date(v.next_due_date) < new Date();
                return (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-900 flex items-center gap-2"><Syringe className="w-4 h-4 text-vet-primary" />{v.vaccine_name}</td>
                    <td className="px-5 py-3 text-slate-500 hidden sm:table-cell"><span className={cn('px-2 py-0.5 rounded text-xs font-medium', v.vaccine_type === 'core' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600')}>{v.vaccine_type}</span></td>
                    <td className="px-5 py-3 text-slate-500">{new Date(v.administered_date).toLocaleDateString()}</td>
                    <td className={cn('px-5 py-3 font-medium', isOverdue ? 'text-red-600' : 'text-slate-500')}>{v.next_due_date ? new Date(v.next_due_date).toLocaleDateString() : '-'} {isOverdue && <span className="text-xs bg-red-50 px-1.5 py-0.5 rounded-full ml-1">Overdue</span>}</td>
                    <td className="px-5 py-3 text-slate-500 hidden md:table-cell">{v.manufacturer || '-'}</td>
                    <td className="px-5 py-3 text-slate-400 font-mono text-xs hidden md:table-cell">{v.lot_number || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {vaccinations.length === 0 && <div className="py-16 text-center text-sm text-slate-400">No vaccinations recorded</div>}
        </div>
      )}

      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          {prescriptions.map(rx => (
            <div key={rx.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2"><Pill className="w-4 h-4 text-vet-primary" /><span className="font-semibold text-slate-900">{rx.drug_name} {rx.drug_strength}</span></div>
                  <p className="text-sm text-slate-500 mt-1">{rx.dose} {rx.route} {rx.frequency} x {rx.duration_days || '?'} days</p>
                  <p className="text-sm text-slate-500 mt-0.5">Qty: {rx.quantity_dispensed} {rx.quantity_unit} · Refills: {rx.refills_used}/{rx.refills_authorized}</p>
                </div>
                <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', rx.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600')}>{rx.status}</span>
              </div>
              {rx.client_instructions && <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm text-slate-600"><strong>Instructions:</strong> {rx.client_instructions}</div>}
              <p className="text-xs text-slate-400 mt-2">Prescribed {new Date(rx.prescribed_date).toLocaleDateString()} by {rx.prescriber_name}</p>
            </div>
          ))}
          {prescriptions.length === 0 && <div className="py-16 text-center text-sm text-slate-400 bg-white rounded-xl border border-slate-200">No prescriptions</div>}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return <div className="flex justify-between"><dt className="text-slate-500">{label}</dt><dd className="font-medium text-slate-900 capitalize">{value}</dd></div>;
}

function SoapSection({ label, title, desc, value, onChange, color, bg }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold', bg, color)}>{label}</span>
        <div><p className="text-sm font-semibold text-slate-900">{title}</p><p className="text-xs text-slate-400">{desc}</p></div>
      </div>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={5} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vet-primary/20 focus:border-vet-primary resize-none" placeholder={`Enter ${title.toLowerCase()}...`} />
    </div>
  );
}

function SOAPRecordCard({ record }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-slate-50">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-vet-primary" />
            <span className="font-semibold text-sm text-slate-900">{record.assessment || 'Medical Record'}</span>
            <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', record.status === 'finalized' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700')}>{record.status}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{new Date(record.record_date).toLocaleDateString()} · {record.veterinarian_name}</p>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>
      {expanded && (
        <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
          <SoapDisplay label="S" title="Subjective" text={record.subjective} color="text-blue-600" bg="bg-blue-50" />
          <SoapDisplay label="O" title="Objective" text={record.objective} color="text-green-600" bg="bg-green-50" />
          <SoapDisplay label="A" title="Assessment" text={record.assessment} color="text-amber-600" bg="bg-amber-50" />
          <SoapDisplay label="P" title="Plan" text={record.plan} color="text-purple-600" bg="bg-purple-50" />
        </div>
      )}
    </div>
  );
}

function SoapDisplay({ label, title, text, color, bg }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <span className={cn('w-6 h-6 rounded flex items-center justify-center text-xs font-bold', bg, color)}>{label}</span>
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{title}</span>
      </div>
      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{text || 'Not documented'}</p>
    </div>
  );
}

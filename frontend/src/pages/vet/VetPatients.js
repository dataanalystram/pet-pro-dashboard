import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vetAPI } from '@/api';
import { Search, Plus, Upload, Dog, Cat, AlertCircle, ChevronRight, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import SlidePanel from '@/components/shared/SlidePanel';
import CSVImport from '@/components/shared/CSVImport';
import { FormInput, FormSelect, FormTextarea, FormRow } from '@/components/shared/FormField';

const SPECIES_ICON = { canine: Dog, feline: Cat };

const EMPTY_PATIENT = {
  client_id: '', name: '', species: 'canine', breed: '', color: '', sex: 'male_intact',
  date_of_birth: '', weight_kg: '', microchip_number: '', allergies: '', chronic_conditions: '', behavioral_alerts: '', internal_notes: '',
};

const SAMPLE_CSV = `Name,Species,Breed,Color,Sex,Date of Birth,Weight (kg),Microchip,Allergies
Buddy,canine,Labrador Retriever,Golden,male_neutered,2021-03-15,32.5,985123456789,Chicken
Whiskers,feline,Domestic Shorthair,Tabby,female_spayed,2020-07-22,4.2,,
Max,canine,German Shepherd,Black and Tan,male_intact,2022-11-01,38,,`;

const CSV_FIELD_MAP = {
  'name': 'name', 'species': 'species', 'breed': 'breed', 'color': 'color', 'sex': 'sex',
  'date of birth': 'date_of_birth', 'weight (kg)': 'weight_kg', 'microchip': 'microchip_number',
  'allergies': 'allergies', 'weight': 'weight_kg',
};

export default function VetPatients() {
  const [patients, setPatients] = useState([]);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showCSV, setShowCSV] = useState(false);
  const [form, setForm] = useState(EMPTY_PATIENT);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const fetchData = () => {
    setLoading(true);
    Promise.all([vetAPI.getPatients(), vetAPI.getClients()]).then(([pRes, cRes]) => {
      setPatients(pRes.data);
      setClients(cRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.client_id) { toast.error('Name and owner are required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        allergies: form.allergies ? form.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
        chronic_conditions: form.chronic_conditions ? form.chronic_conditions.split(',').map(s => s.trim()).filter(Boolean) : [],
        behavioral_alerts: form.behavioral_alerts ? form.behavioral_alerts.split(',').map(s => s.trim()).filter(Boolean) : [],
      };
      await vetAPI.createPatient(payload);
      toast.success(`${form.name} added successfully`);
      setShowCreate(false);
      setForm(EMPTY_PATIENT);
      fetchData();
    } catch (e) { toast.error('Failed to create patient'); }
    setSaving(false);
  };

  const filtered = patients.filter(p => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.client_name || '').toLowerCase().includes(search.toLowerCase()) || (p.breed || '').toLowerCase().includes(search.toLowerCase()) || (p.microchip_number || '').includes(search);
    const matchesSpecies = speciesFilter === 'all' || p.species === speciesFilter;
    return matchesSearch && matchesSpecies;
  });

  const stats = {
    total: patients.length,
    canine: patients.filter(p => p.species === 'canine').length,
    feline: patients.filter(p => p.species === 'feline').length,
    withAllergies: patients.filter(p => p.allergies?.length > 0).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
          <p className="text-sm text-slate-500 mt-1">{stats.total} patients · {stats.canine} dogs · {stats.feline} cats</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCSV(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-50">
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-vet-primary text-white rounded-lg font-medium text-sm hover:bg-vet-secondary transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> New Patient
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, breed, owner, or microchip..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vet-primary/20 focus:border-vet-primary" />
        </div>
        <div className="flex gap-2">
          {[{ key: 'all', label: 'All', count: stats.total }, { key: 'canine', label: 'Dogs', count: stats.canine }, { key: 'feline', label: 'Cats', count: stats.feline }].map(s => (
            <button key={s.key} onClick={() => setSpeciesFilter(s.key)} className={cn('px-4 py-2 rounded-lg text-sm font-medium border transition-colors', speciesFilter === s.key ? 'bg-vet-primary text-white border-vet-primary' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50')}>
              {s.label} <span className="ml-1 text-xs opacity-70">({s.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Patient list */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-vet-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filtered.map(patient => {
              const SpeciesIcon = SPECIES_ICON[patient.species] || Dog;
              const age = patient.date_of_birth ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;
              return (
                <div key={patient.id} onClick={() => navigate(`/vet/patients/${patient.id}`)} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 cursor-pointer transition-colors group">
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', patient.species === 'feline' ? 'bg-purple-50' : 'bg-cyan-50')}>
                    <SpeciesIcon className={cn('w-6 h-6', patient.species === 'feline' ? 'text-purple-500' : 'text-cyan-600')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900">{patient.name}</span>
                      {patient.behavioral_alerts?.length > 0 && <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" />{patient.behavioral_alerts[0]}</span>}
                      {patient.allergies?.length > 0 && <span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full font-medium">⚠ {patient.allergies.join(', ')}</span>}
                    </div>
                    <p className="text-sm text-slate-500">
                      {patient.breed || patient.species} · {patient.sex?.replace('_', ' ')} {patient.weight_kg && `· ${patient.weight_kg}kg`} {age !== null && `· ${age}y`}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Owner: {patient.client_name || 'Unknown'} {patient.client_phone && `· ${patient.client_phone}`}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0 group-hover:text-slate-500 transition-colors" />
                </div>
              );
            })}
            {filtered.length === 0 && <div className="py-16 text-center text-sm text-slate-400">No patients found</div>}
          </div>
        </div>
      )}

      {/* Create Patient Panel */}
      <SlidePanel isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Patient" subtitle="Add a new patient to the clinic">
        <div className="space-y-4">
          <FormSelect label="Owner" required options={[{ value: '', label: 'Select owner...' }, ...clients.map(c => ({ value: c.id, label: `${c.first_name} ${c.last_name}` }))]} value={form.client_id} onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))} />
          <FormInput label="Patient Name" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Buddy" />
          <FormRow>
            <FormSelect label="Species" options={[{ value: 'canine', label: 'Dog' }, { value: 'feline', label: 'Cat' }, { value: 'rabbit', label: 'Rabbit' }, { value: 'bird', label: 'Bird' }]} value={form.species} onChange={e => setForm(p => ({ ...p, species: e.target.value }))} />
            <FormInput label="Breed" value={form.breed} onChange={e => setForm(p => ({ ...p, breed: e.target.value }))} placeholder="e.g. Labrador Retriever" />
          </FormRow>
          <FormRow>
            <FormSelect label="Sex" options={[{ value: 'male_intact', label: 'Male (Intact)' }, { value: 'male_neutered', label: 'Male (Neutered)' }, { value: 'female_intact', label: 'Female (Intact)' }, { value: 'female_spayed', label: 'Female (Spayed)' }]} value={form.sex} onChange={e => setForm(p => ({ ...p, sex: e.target.value }))} />
            <FormInput label="Color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} placeholder="e.g. Golden" />
          </FormRow>
          <FormRow>
            <FormInput label="Date of Birth" type="date" value={form.date_of_birth} onChange={e => setForm(p => ({ ...p, date_of_birth: e.target.value }))} />
            <FormInput label="Weight (kg)" type="number" step="0.1" value={form.weight_kg} onChange={e => setForm(p => ({ ...p, weight_kg: e.target.value }))} placeholder="e.g. 32.5" />
          </FormRow>
          <FormInput label="Microchip Number" value={form.microchip_number} onChange={e => setForm(p => ({ ...p, microchip_number: e.target.value }))} placeholder="e.g. 985123456789" />
          <FormInput label="Allergies" value={form.allergies} onChange={e => setForm(p => ({ ...p, allergies: e.target.value }))} placeholder="Comma separated e.g. Chicken, Penicillin" />
          <FormInput label="Chronic Conditions" value={form.chronic_conditions} onChange={e => setForm(p => ({ ...p, chronic_conditions: e.target.value }))} placeholder="Comma separated e.g. Diabetes, Heart murmur" />
          <FormInput label="Behavioral Alerts" value={form.behavioral_alerts} onChange={e => setForm(p => ({ ...p, behavioral_alerts: e.target.value }))} placeholder="Comma separated e.g. Nervous with strangers" />
          <FormTextarea label="Internal Notes" rows={3} value={form.internal_notes} onChange={e => setForm(p => ({ ...p, internal_notes: e.target.value }))} placeholder="Notes visible only to staff..." />

          <div className="flex gap-3 pt-4 border-t">
            <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-vet-primary text-white hover:bg-vet-secondary disabled:opacity-50">
              {saving ? 'Saving...' : 'Add Patient'}
            </button>
          </div>
        </div>
      </SlidePanel>

      {/* CSV Import */}
      {showCSV && (
        <CSVImport
          collection="vet_patients"
          productType="vet_clinic"
          fieldMapping={CSV_FIELD_MAP}
          sampleCSV={SAMPLE_CSV}
          onComplete={() => fetchData()}
          onClose={() => setShowCSV(false)}
        />
      )}
    </div>
  );
}

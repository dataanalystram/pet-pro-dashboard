import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { shelterAPI } from '@/api';
import { Search, Plus, Upload, Dog, Cat, Heart, Clock, MapPin, ChevronRight, Grid3X3, List, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import SlidePanel from '@/components/shared/SlidePanel';
import CSVImport from '@/components/shared/CSVImport';
import { FormInput, FormSelect, FormTextarea, FormRow } from '@/components/shared/FormField';

const STATUS_CONFIG = {
  available: { label: 'Available', color: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
  pending_application: { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  hold_behavioral: { label: 'Behavioral', color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
  hold_medical: { label: 'Medical Hold', color: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  not_available: { label: 'Not Available', color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  foster: { label: 'Foster', color: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  adopted: { label: 'Adopted', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
};

const EMPTY_ANIMAL = {
  name: '', species: 'dog', breed: '', color: '', sex: 'unknown', estimated_age_months: '',
  weight_kg: '', size: 'medium', microchip_number: '', intake_type: 'stray', intake_condition: 'healthy',
  intake_notes: '', intake_source: '', finder_name: '', finder_phone: '',
  current_location: '', temperament: '', energy_level: 'moderate',
  good_with_dogs: null, good_with_cats: null, good_with_children: null,
  behavioral_notes: '', adoption_fee: '',
};

const SAMPLE_CSV = `Name,Species,Breed,Color,Sex,Age (months),Weight (kg),Size,Intake Type,Location,Temperament
Rocky,dog,Staffordshire Bull Terrier,Brindle,male,36,18.5,medium,stray,Kennel A-1,Friendly
Luna,cat,Siamese Mix,Seal Point,female,8,2.8,small,born_in_shelter,Cat Room 1,Vocal`;

const CSV_MAP = {
  'name': 'name', 'species': 'species', 'breed': 'breed', 'color': 'color', 'sex': 'sex',
  'age (months)': 'estimated_age_months', 'weight (kg)': 'weight_kg', 'size': 'size',
  'intake type': 'intake_type', 'location': 'current_location', 'temperament': 'temperament',
};

export default function ShelterAnimals() {
  const [animals, setAnimals] = useState([]);
  const [search, setSearch] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('card');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showCSV, setShowCSV] = useState(false);
  const [form, setForm] = useState(EMPTY_ANIMAL);
  const [saving, setSaving] = useState(false);
  const [intakeStep, setIntakeStep] = useState(1);
  const navigate = useNavigate();

  const fetchAnimals = () => {
    setLoading(true);
    shelterAPI.getAnimals({}).then(({ data }) => { setAnimals(data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchAnimals(); }, []);

  const handleCreate = async () => {
    if (!form.name) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        estimated_age_months: form.estimated_age_months ? parseInt(form.estimated_age_months) : null,
        adoption_fee: form.adoption_fee ? parseFloat(form.adoption_fee) : null,
        good_with_dogs: form.good_with_dogs === '' ? null : form.good_with_dogs === 'true',
        good_with_cats: form.good_with_cats === '' ? null : form.good_with_cats === 'true',
        good_with_children: form.good_with_children === '' ? null : form.good_with_children === 'true',
      };
      await shelterAPI.createAnimal(payload);
      toast.success(`${form.name} intake completed`);
      setShowCreate(false);
      setForm(EMPTY_ANIMAL);
      setIntakeStep(1);
      fetchAnimals();
    } catch (e) { toast.error('Failed to create intake'); }
    setSaving(false);
  };

  const filtered = animals.filter(a => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || (a.breed || '').toLowerCase().includes(search.toLowerCase()) || (a.animal_id_code || '').toLowerCase().includes(search.toLowerCase());
    const matchSpecies = speciesFilter === 'all' || a.species === speciesFilter;
    const matchStatus = statusFilter === 'all' || a.adoption_status === statusFilter;
    return matchSearch && matchSpecies && matchStatus;
  });

  const stats = {
    total: animals.length,
    dogs: animals.filter(a => a.species === 'dog').length,
    cats: animals.filter(a => a.species === 'cat').length,
    available: animals.filter(a => a.adoption_status === 'available').length,
  };

  const TERNARY_OPTS = [{ value: '', label: 'Unknown' }, { value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Animals</h1>
          <p className="text-sm text-slate-500 mt-1">{stats.total} in system · {stats.available} available for adoption</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCSV(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-50">
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-shelter-primary text-white rounded-lg font-medium text-sm hover:bg-shelter-secondary shadow-sm">
            <Plus className="w-4 h-4" /> New Intake
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, breed, or ID..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-shelter-primary/20" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[{ key: 'all', label: 'All', count: stats.total }, { key: 'dog', label: 'Dogs', count: stats.dogs }, { key: 'cat', label: 'Cats', count: stats.cats }].map(s => (
            <button key={s.key} onClick={() => setSpeciesFilter(s.key)} className={cn('px-3 py-2 rounded-lg text-sm font-medium border', speciesFilter === s.key ? 'bg-shelter-primary text-white border-shelter-primary' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50')}>
              {s.label} ({s.count})
            </button>
          ))}
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg text-sm border border-slate-200 bg-white">
            <option value="all">All Status</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <div className="flex border border-slate-200 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('card')} className={cn('p-2', viewMode === 'card' ? 'bg-slate-100' : 'bg-white hover:bg-slate-50')}><Grid3X3 className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('list')} className={cn('p-2', viewMode === 'list' ? 'bg-slate-100' : 'bg-white hover:bg-slate-50')}><List className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-shelter-primary border-t-transparent rounded-full animate-spin" /></div> : (
        viewMode === 'card' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(animal => {
              const statusCfg = STATUS_CONFIG[animal.adoption_status] || STATUS_CONFIG.not_available;
              const SpeciesIcon = animal.species === 'cat' ? Cat : Dog;
              const ageText = animal.estimated_age_months ? (animal.estimated_age_months >= 12 ? `${Math.floor(animal.estimated_age_months / 12)}y` : `${animal.estimated_age_months}m`) : '';
              return (
                <div key={animal.id} onClick={() => navigate(`/shelter/animals/${animal.id}`)} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group">
                  <div className={cn('h-36 flex items-center justify-center relative', animal.species === 'cat' ? 'bg-gradient-to-br from-purple-50 to-pink-50' : 'bg-gradient-to-br from-cyan-50 to-blue-50')}>
                    <SpeciesIcon className={cn('w-16 h-16 opacity-15', animal.species === 'cat' ? 'text-purple-300' : 'text-cyan-300')} />
                    {animal.featured && <span className="absolute top-3 left-3 px-2.5 py-0.5 bg-amber-400 text-white text-xs font-bold rounded-full shadow-sm">★ Featured</span>}
                    <span className={cn('absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold border', statusCfg.color)}>{statusCfg.label}</span>
                    {ageText && <span className="absolute bottom-3 left-3 px-2 py-0.5 bg-white/80 text-slate-600 text-xs font-medium rounded-full backdrop-blur-sm">{ageText}</span>}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-slate-900 text-lg">{animal.name}</h3>
                      <span className="text-xs text-slate-400 font-mono">{animal.animal_id_code}</span>
                    </div>
                    <p className="text-sm text-slate-500">{animal.breed || animal.species} · {animal.sex || 'Unknown'} {animal.weight_kg ? `· ${animal.weight_kg}kg` : ''}</p>
                    <div className="flex items-center gap-3 mt-2.5 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{animal.current_location}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{animal.days_in_shelter || 0}d</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {animal.good_with_dogs === true && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">🐕 Dogs</span>}
                      {animal.good_with_cats === true && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">🐱 Cats</span>}
                      {animal.good_with_children === true && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">👶 Kids</span>}
                      {animal.house_trained && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">🏠 Trained</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
            {filtered.map(animal => {
              const statusCfg = STATUS_CONFIG[animal.adoption_status] || STATUS_CONFIG.not_available;
              return (
                <div key={animal.id} onClick={() => navigate(`/shelter/animals/${animal.id}`)} className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50 cursor-pointer">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', animal.species === 'cat' ? 'bg-purple-50' : 'bg-cyan-50')}>
                    {animal.species === 'cat' ? <Cat className="w-5 h-5 text-purple-500" /> : <Dog className="w-5 h-5 text-cyan-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><span className="font-semibold text-slate-900">{animal.name}</span><span className="text-xs text-slate-400 font-mono">{animal.animal_id_code}</span></div>
                    <p className="text-sm text-slate-500">{animal.breed} · {animal.sex} · {animal.current_location}</p>
                  </div>
                  <span className="text-xs text-slate-400">{animal.days_in_shelter}d</span>
                  <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold border', statusCfg.color)}>{statusCfg.label}</span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              );
            })}
          </div>
        )
      )}
      {filtered.length === 0 && !loading && <div className="py-16 text-center text-sm text-slate-400 bg-white rounded-xl border">No animals found</div>}

      {/* Intake Wizard Panel */}
      <SlidePanel isOpen={showCreate} onClose={() => { setShowCreate(false); setIntakeStep(1); }} title="Animal Intake" subtitle={`Step ${intakeStep} of 3`} width="max-w-xl">
        <div className="space-y-5">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-2">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex-1 flex items-center gap-2">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold', s <= intakeStep ? 'bg-shelter-primary text-white' : 'bg-slate-100 text-slate-400')}>{s}</div>
                <span className={cn('text-xs font-medium hidden sm:block', s <= intakeStep ? 'text-slate-900' : 'text-slate-400')}>
                  {s === 1 ? 'Basic Info' : s === 2 ? 'Intake Details' : 'Behavior'}
                </span>
                {s < 3 && <div className={cn('flex-1 h-0.5', s < intakeStep ? 'bg-shelter-primary' : 'bg-slate-200')} />}
              </div>
            ))}
          </div>

          {intakeStep === 1 && (
            <>
              <FormInput label="Animal Name" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Buddy" />
              <FormRow>
                <FormSelect label="Species" options={[{ value: 'dog', label: 'Dog' }, { value: 'cat', label: 'Cat' }, { value: 'rabbit', label: 'Rabbit' }, { value: 'bird', label: 'Bird' }]} value={form.species} onChange={e => setForm(p => ({ ...p, species: e.target.value }))} />
                <FormInput label="Breed" value={form.breed} onChange={e => setForm(p => ({ ...p, breed: e.target.value }))} placeholder="e.g. Labrador Mix" />
              </FormRow>
              <FormRow>
                <FormSelect label="Sex" options={[{ value: 'unknown', label: 'Unknown' }, { value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} value={form.sex} onChange={e => setForm(p => ({ ...p, sex: e.target.value }))} />
                <FormInput label="Color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} placeholder="e.g. Black and Tan" />
              </FormRow>
              <FormRow>
                <FormInput label="Estimated Age (months)" type="number" value={form.estimated_age_months} onChange={e => setForm(p => ({ ...p, estimated_age_months: e.target.value }))} placeholder="e.g. 24" />
                <FormInput label="Weight (kg)" type="number" step="0.1" value={form.weight_kg} onChange={e => setForm(p => ({ ...p, weight_kg: e.target.value }))} placeholder="e.g. 18.5" />
              </FormRow>
              <FormRow>
                <FormSelect label="Size" options={[{ value: 'tiny', label: 'Tiny (<5kg)' }, { value: 'small', label: 'Small (5-10kg)' }, { value: 'medium', label: 'Medium (10-25kg)' }, { value: 'large', label: 'Large (25-40kg)' }, { value: 'extra_large', label: 'Extra Large (40kg+)' }]} value={form.size} onChange={e => setForm(p => ({ ...p, size: e.target.value }))} />
                <FormInput label="Microchip #" value={form.microchip_number} onChange={e => setForm(p => ({ ...p, microchip_number: e.target.value }))} placeholder="Scan or enter..." />
              </FormRow>
            </>
          )}

          {intakeStep === 2 && (
            <>
              <FormSelect label="Intake Type" required options={[{ value: 'stray', label: 'Stray / Found' }, { value: 'owner_surrender', label: 'Owner Surrender' }, { value: 'confiscation', label: 'Confiscation' }, { value: 'transfer_in', label: 'Transfer In' }, { value: 'born_in_shelter', label: 'Born in Shelter' }, { value: 'field_rescue', label: 'Field Rescue' }, { value: 'return', label: 'Return (Previous Adoption)' }]} value={form.intake_type} onChange={e => setForm(p => ({ ...p, intake_type: e.target.value }))} />
              <FormSelect label="Intake Condition" options={[{ value: 'healthy', label: 'Healthy' }, { value: 'minor_issues', label: 'Minor Issues' }, { value: 'needs_treatment', label: 'Needs Treatment' }, { value: 'critical', label: 'Critical' }, { value: 'injured', label: 'Injured' }, { value: 'malnourished', label: 'Malnourished' }]} value={form.intake_condition} onChange={e => setForm(p => ({ ...p, intake_condition: e.target.value }))} />
              <FormInput label="Intake Source / Location Found" value={form.intake_source} onChange={e => setForm(p => ({ ...p, intake_source: e.target.value }))} placeholder="e.g. Phoenix Park, Dublin 8" />
              {(form.intake_type === 'stray' || form.intake_type === 'field_rescue') && (
                <FormRow>
                  <FormInput label="Finder Name" value={form.finder_name} onChange={e => setForm(p => ({ ...p, finder_name: e.target.value }))} />
                  <FormInput label="Finder Phone" value={form.finder_phone} onChange={e => setForm(p => ({ ...p, finder_phone: e.target.value }))} />
                </FormRow>
              )}
              <FormInput label="Current Location" value={form.current_location} onChange={e => setForm(p => ({ ...p, current_location: e.target.value }))} placeholder="e.g. Kennel A-1, Cat Room 2, Quarantine" />
              <FormTextarea label="Intake Notes" rows={3} value={form.intake_notes} onChange={e => setForm(p => ({ ...p, intake_notes: e.target.value }))} placeholder="Condition on arrival, any immediate concerns..." />
            </>
          )}

          {intakeStep === 3 && (
            <>
              <FormInput label="Temperament" value={form.temperament} onChange={e => setForm(p => ({ ...p, temperament: e.target.value }))} placeholder="e.g. Friendly, energetic, playful" />
              <FormSelect label="Energy Level" options={[{ value: 'low', label: 'Low' }, { value: 'moderate', label: 'Moderate' }, { value: 'high', label: 'High' }, { value: 'very_high', label: 'Very High' }]} value={form.energy_level} onChange={e => setForm(p => ({ ...p, energy_level: e.target.value }))} />
              <FormRow>
                <FormSelect label="Good with Dogs?" options={TERNARY_OPTS} value={form.good_with_dogs ?? ''} onChange={e => setForm(p => ({ ...p, good_with_dogs: e.target.value }))} />
                <FormSelect label="Good with Cats?" options={TERNARY_OPTS} value={form.good_with_cats ?? ''} onChange={e => setForm(p => ({ ...p, good_with_cats: e.target.value }))} />
              </FormRow>
              <FormSelect label="Good with Children?" options={TERNARY_OPTS} value={form.good_with_children ?? ''} onChange={e => setForm(p => ({ ...p, good_with_children: e.target.value }))} />
              <FormTextarea label="Behavioral Notes" rows={3} value={form.behavioral_notes} onChange={e => setForm(p => ({ ...p, behavioral_notes: e.target.value }))} placeholder="Any behavioral observations, triggers, or concerns..." />
              <FormInput label="Adoption Fee (€)" type="number" value={form.adoption_fee} onChange={e => setForm(p => ({ ...p, adoption_fee: e.target.value }))} placeholder="e.g. 250" />
            </>
          )}

          <div className="flex gap-3 pt-4 border-t">
            {intakeStep > 1 && <button onClick={() => setIntakeStep(s => s - 1)} className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">Back</button>}
            <div className="flex-1" />
            {intakeStep < 3 ? (
              <button onClick={() => setIntakeStep(s => s + 1)} className="px-6 py-2.5 rounded-lg text-sm font-bold bg-shelter-primary text-white hover:bg-shelter-secondary">
                Continue
              </button>
            ) : (
              <button onClick={handleCreate} disabled={saving} className="px-6 py-2.5 rounded-lg text-sm font-bold bg-shelter-primary text-white hover:bg-shelter-secondary disabled:opacity-50">
                {saving ? 'Saving...' : 'Complete Intake'}
              </button>
            )}
          </div>
        </div>
      </SlidePanel>

      {/* CSV Import */}
      {showCSV && (
        <CSVImport collection="shelter_animals" productType="shelter" fieldMapping={CSV_MAP} sampleCSV={SAMPLE_CSV} onComplete={() => fetchAnimals()} onClose={() => setShowCSV(false)} />
      )}
    </div>
  );
}

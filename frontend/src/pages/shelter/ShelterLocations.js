import { useState, useEffect } from 'react';
import { shelterAPI } from '@/api';
import { Plus, Search, MapPin, Dog, Cat, Settings, ArrowRight, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import SlidePanel from '@/components/shared/SlidePanel';
import { FormInput, FormSelect, FormTextarea, FormRow, FormCheckbox } from '@/components/shared/FormField';

const LOCATION_TYPES = [
  { value: 'kennel', label: 'Kennel' },
  { value: 'cage', label: 'Cage' },
  { value: 'room', label: 'Room' },
  { value: 'outdoor', label: 'Outdoor Run' },
  { value: 'isolation', label: 'Isolation' },
  { value: 'quarantine', label: 'Quarantine' },
];

export default function ShelterLocations() {
  const [locations, setLocations] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showMove, setShowMove] = useState(null);
  const [form, setForm] = useState({ name: '', location_type: 'kennel', building: 'Main', section: 'A', capacity: 1, is_isolation: false, is_quarantine: false, notes: '' });
  const [moveForm, setMoveForm] = useState({ new_location: '', reason: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [locsRes, animalsRes] = await Promise.all([
        shelterAPI.getLocations(),
        shelterAPI.getAnimals({})
      ]);
      setLocations(locsRes.data || []);
      setAnimals(animalsRes.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.name) { toast.error('Name required'); return; }
    setSaving(true);
    try {
      await shelterAPI.createLocation(form);
      toast.success('Location created');
      setShowCreate(false);
      setForm({ name: '', location_type: 'kennel', building: 'Main', section: 'A', capacity: 1, is_isolation: false, is_quarantine: false, notes: '' });
      fetchData();
    } catch (e) { toast.error('Failed'); }
    setSaving(false);
  };

  const handleMove = async () => {
    if (!moveForm.new_location) { toast.error('Select destination'); return; }
    setSaving(true);
    try {
      await shelterAPI.moveAnimal(showMove.id, moveForm);
      toast.success(`${showMove.name} moved to ${moveForm.new_location}`);
      setShowMove(null);
      setMoveForm({ new_location: '', reason: '' });
      fetchData();
    } catch (e) { toast.error('Failed'); }
    setSaving(false);
  };

  const filtered = locations.filter(l => {
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || l.location_type === typeFilter;
    return matchSearch && matchType;
  });

  const stats = {
    total: locations.length,
    occupied: locations.filter(l => l.current_count > 0).length,
    available: locations.filter(l => l.current_count < l.capacity).length,
  };

  // Group by building/section
  const grouped = filtered.reduce((acc, loc) => {
    const key = `${loc.building || 'Main'} - ${loc.section || 'General'}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(loc);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kennel & Location Map</h1>
          <p className="text-sm text-slate-500 mt-1">{stats.total} locations · {stats.available} available</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-shelter-primary text-white rounded-lg font-medium text-sm hover:bg-shelter-secondary">
          <Plus className="w-4 h-4" /> Add Location
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search locations..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-shelter-primary/20" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 rounded-lg text-sm border border-slate-200 bg-white">
          <option value="all">All Types</option>
          {LOCATION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-shelter-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([section, locs]) => (
            <div key={section}>
              <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2"><MapPin className="w-5 h-5 text-shelter-primary" /> {section}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {locs.map(loc => {
                  const isFull = loc.current_count >= loc.capacity;
                  const isIso = loc.is_isolation || loc.is_quarantine;
                  return (
                    <div key={loc.id} className={cn('bg-white rounded-xl border-2 p-4 transition-all', isFull ? 'border-red-200' : loc.current_count > 0 ? 'border-amber-200' : 'border-green-200', isIso && 'bg-red-50')}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-900">{loc.name}</span>
                        {isIso && <AlertTriangle className="w-4 h-4 text-red-500" />}
                      </div>
                      <div className="text-xs text-slate-500 mb-2">
                        {LOCATION_TYPES.find(t => t.value === loc.location_type)?.label}
                      </div>
                      <div className={cn('text-lg font-bold mb-2', isFull ? 'text-red-600' : loc.current_count > 0 ? 'text-amber-600' : 'text-green-600')}>
                        {loc.current_count}/{loc.capacity}
                      </div>
                      
                      {loc.occupants?.length > 0 && (
                        <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-100">
                          {loc.occupants.map(animal => (
                            <div key={animal.id} className="flex items-center justify-between text-xs p-1.5 bg-slate-50 rounded">
                              <div className="flex items-center gap-1">
                                {animal.species === 'cat' ? <Cat className="w-3 h-3 text-purple-500" /> : <Dog className="w-3 h-3 text-cyan-500" />}
                                <span className="font-medium">{animal.name}</span>
                              </div>
                              <button onClick={() => setShowMove(animal)} className="p-1 hover:bg-white rounded">
                                <ArrowRight className="w-3 h-3 text-slate-400" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {loc.current_count === 0 && (
                        <div className="flex items-center gap-1 text-xs text-green-600 mt-2">
                          <CheckCircle className="w-3 h-3" /> Available
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Animal List for Moving */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Quick Move Animals</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {animals.filter(a => !a.outcome_date).slice(0, 12).map(animal => (
            <div key={animal.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                {animal.species === 'cat' ? <Cat className="w-4 h-4 text-purple-500" /> : <Dog className="w-4 h-4 text-cyan-500" />}
                <div>
                  <span className="font-medium text-sm">{animal.name}</span>
                  <span className="text-xs text-slate-400 ml-2">{animal.current_location}</span>
                </div>
              </div>
              <button onClick={() => setShowMove(animal)} className="px-2 py-1 text-xs font-medium text-shelter-primary hover:bg-shelter-primary/10 rounded">
                Move
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Create Location Panel */}
      <SlidePanel isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Location" width="max-w-md">
        <div className="space-y-4">
          <FormInput label="Name" required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Kennel A-1, Cat Room 1" />
          <FormSelect label="Type" options={LOCATION_TYPES} value={form.location_type} onChange={e => setForm(f => ({...f, location_type: e.target.value}))} />
          <FormRow>
            <FormInput label="Building" value={form.building} onChange={e => setForm(f => ({...f, building: e.target.value}))} />
            <FormInput label="Section" value={form.section} onChange={e => setForm(f => ({...f, section: e.target.value}))} />
          </FormRow>
          <FormInput label="Capacity" type="number" min="1" value={form.capacity} onChange={e => setForm(f => ({...f, capacity: parseInt(e.target.value) || 1}))} />
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_isolation} onChange={e => setForm(f => ({...f, is_isolation: e.target.checked}))} className="rounded" /> Isolation</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_quarantine} onChange={e => setForm(f => ({...f, is_quarantine: e.target.checked}))} className="rounded" /> Quarantine</label>
          </div>
          <FormTextarea label="Notes" rows={2} value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
          <div className="flex gap-3 pt-4 border-t">
            <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border hover:bg-slate-50">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-shelter-primary text-white hover:opacity-90 disabled:opacity-50">{saving ? 'Creating...' : 'Create'}</button>
          </div>
        </div>
      </SlidePanel>

      {/* Move Animal Panel */}
      <SlidePanel isOpen={!!showMove} onClose={() => setShowMove(null)} title="Move Animal" subtitle={showMove?.name}>
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm"><strong>Current Location:</strong> {showMove?.current_location || 'Unknown'}</p>
          </div>
          <FormSelect label="Move To" required options={[{ value: '', label: 'Select destination...' }, ...locations.filter(l => l.current_count < l.capacity).map(l => ({ value: l.name, label: `${l.name} (${l.current_count}/${l.capacity})` }))]} value={moveForm.new_location} onChange={e => setMoveForm(f => ({...f, new_location: e.target.value}))} />
          <FormTextarea label="Reason" rows={2} value={moveForm.reason} onChange={e => setMoveForm(f => ({...f, reason: e.target.value}))} placeholder="Optional: reason for move" />
          <div className="flex gap-3 pt-4 border-t">
            <button onClick={() => setShowMove(null)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border hover:bg-slate-50">Cancel</button>
            <button onClick={handleMove} disabled={saving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-shelter-primary text-white hover:opacity-90 disabled:opacity-50">{saving ? 'Moving...' : 'Move Animal'}</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}

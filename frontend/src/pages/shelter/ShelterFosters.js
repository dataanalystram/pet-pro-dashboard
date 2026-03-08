import { useState, useEffect } from 'react';
import { shelterAPI } from '@/api';
import { Plus, Search, User, Calendar, Clock, MapPin, Home, AlertCircle, CheckCircle, XCircle, MessageSquare, Phone, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import SlidePanel from '@/components/shared/SlidePanel';
import { FormInput, FormSelect, FormTextarea, FormRow } from '@/components/shared/FormField';

const STATUS_CONFIG = {
  active: { label: 'Active', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
};

const FOSTER_TYPES = [
  { value: 'standard', label: 'Standard Foster' },
  { value: 'medical', label: 'Medical Foster' },
  { value: 'behavioral', label: 'Behavioral Foster' },
  { value: 'maternity', label: 'Maternity/Nursing' },
  { value: 'temporary', label: 'Temporary/Emergency' },
];

export default function ShelterFosters() {
  const [fosters, setFosters] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [people, setPeople] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showNotes, setShowNotes] = useState(null);
  const [form, setForm] = useState({ animal_id: '', foster_parent_id: '', foster_type: 'standard', special_instructions: '', feeding_schedule: '', expected_end_date: '' });
  const [noteForm, setNoteForm] = useState({ content: '', note_type: 'general' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fostersRes, animalsRes, peopleRes, volRes] = await Promise.all([
        shelterAPI.getFosters({}),
        shelterAPI.getAnimals({ status: 'available' }),
        shelterAPI.getPeople({}),
        shelterAPI.getVolunteers()
      ]);
      setFosters(fostersRes.data || []);
      setAnimals(animalsRes.data || []);
      setPeople(peopleRes.data || []);
      setVolunteers(volRes.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.animal_id || !form.foster_parent_id) {
      toast.error('Please select animal and foster parent');
      return;
    }
    setSaving(true);
    try {
      const parent = [...people, ...volunteers].find(p => p.id === form.foster_parent_id);
      await shelterAPI.createFoster({
        ...form,
        foster_parent_name: parent?.full_name || parent?.name || '',
        foster_parent_email: parent?.email || '',
        foster_parent_phone: parent?.phone || '',
      });
      toast.success('Foster placement created');
      setShowCreate(false);
      setForm({ animal_id: '', foster_parent_id: '', foster_type: 'standard', special_instructions: '', feeding_schedule: '', expected_end_date: '' });
      fetchData();
    } catch (e) { toast.error('Failed to create foster'); }
    setSaving(false);
  };

  const handleEndFoster = async (fosterId) => {
    if (!window.confirm('End this foster placement?')) return;
    try {
      await shelterAPI.updateFoster(fosterId, { status: 'completed' });
      toast.success('Foster placement ended');
      fetchData();
    } catch (e) { toast.error('Failed'); }
  };

  const handleAddNote = async (fosterId) => {
    if (!noteForm.content.trim()) { toast.error('Note required'); return; }
    setSaving(true);
    try {
      await shelterAPI.addFosterNote(fosterId, noteForm);
      toast.success('Note added');
      setShowNotes(null);
      setNoteForm({ content: '', note_type: 'general' });
      fetchData();
    } catch (e) { toast.error('Failed'); }
    setSaving(false);
  };

  const filtered = fosters.filter(f => {
    const matchSearch = !search || 
      f.foster_parent_name?.toLowerCase().includes(search.toLowerCase()) ||
      f.animal?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || f.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    active: fosters.filter(f => f.status === 'active').length,
    total: fosters.length,
  };

  const fosterParentOptions = [
    ...people.map(p => ({ value: p.id, label: `${p.full_name || p.first_name + ' ' + p.last_name} (Contact)` })),
    ...volunteers.filter(v => v.is_foster).map(v => ({ value: v.id, label: `${v.full_name} (Foster Volunteer)` })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Foster Management</h1>
          <p className="text-sm text-slate-500 mt-1">{stats.active} active placements · {stats.total} total</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-shelter-primary text-white rounded-lg font-medium text-sm hover:bg-shelter-secondary">
          <Plus className="w-4 h-4" /> New Foster Placement
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by animal or foster parent..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-shelter-primary/20" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg text-sm border border-slate-200 bg-white">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-shelter-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(foster => {
            const statusCfg = STATUS_CONFIG[foster.status] || STATUS_CONFIG.active;
            const StatusIcon = statusCfg.icon;
            return (
              <div key={foster.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                      <Home className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{foster.animal?.name || 'Unknown Animal'}</h3>
                      <p className="text-sm text-slate-500">{foster.animal?.species} · {foster.animal?.breed}</p>
                    </div>
                  </div>
                  <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1', statusCfg.color)}>
                    <StatusIcon className="w-3 h-3" /> {statusCfg.label}
                  </span>
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-slate-700">{foster.foster_parent_name || 'Unknown'}</span>
                  </div>
                  {foster.foster_parent_phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Phone className="w-4 h-4" /> {foster.foster_parent_phone}
                    </div>
                  )}
                  {foster.foster_parent_email && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Mail className="w-4 h-4" /> {foster.foster_parent_email}
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Started: {foster.start_date ? new Date(foster.start_date).toLocaleDateString() : 'N/A'}</span>
                    {foster.expected_end_date && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Expected: {new Date(foster.expected_end_date).toLocaleDateString()}</span>}
                  </div>
                  <div className="flex items-center gap-1 pt-1">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full', foster.foster_type === 'medical' ? 'bg-red-50 text-red-700' : foster.foster_type === 'behavioral' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600')}>
                      {FOSTER_TYPES.find(t => t.value === foster.foster_type)?.label || foster.foster_type}
                    </span>
                  </div>
                </div>

                {foster.special_instructions && (
                  <div className="mt-3 p-3 bg-amber-50 rounded-lg">
                    <p className="text-xs text-amber-800"><strong>Instructions:</strong> {foster.special_instructions}</p>
                  </div>
                )}

                {foster.notes?.length > 0 && (
                  <div className="mt-3 text-xs text-slate-500">
                    <MessageSquare className="w-3 h-3 inline mr-1" /> {foster.notes.length} note(s)
                  </div>
                )}

                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                  <button onClick={() => setShowNotes(foster)} className="flex-1 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100">Add Note</button>
                  {foster.status === 'active' && (
                    <button onClick={() => handleEndFoster(foster.id)} className="flex-1 px-3 py-2 text-xs font-medium text-white bg-shelter-primary rounded-lg hover:opacity-90">End Foster</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {filtered.length === 0 && !loading && <div className="py-16 text-center text-sm text-slate-400 bg-white rounded-xl border">No foster placements found</div>}

      {/* Create Panel */}
      <SlidePanel isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Foster Placement" width="max-w-lg">
        <div className="space-y-4">
          <FormSelect label="Animal" required options={[{ value: '', label: 'Select animal...' }, ...animals.map(a => ({ value: a.id, label: `${a.name} (${a.species} - ${a.breed || 'Unknown'})` }))]} value={form.animal_id} onChange={e => setForm(f => ({...f, animal_id: e.target.value}))} />
          <FormSelect label="Foster Parent" required options={[{ value: '', label: 'Select foster parent...' }, ...fosterParentOptions]} value={form.foster_parent_id} onChange={e => setForm(f => ({...f, foster_parent_id: e.target.value}))} />
          <FormSelect label="Foster Type" options={FOSTER_TYPES} value={form.foster_type} onChange={e => setForm(f => ({...f, foster_type: e.target.value}))} />
          <FormInput label="Expected End Date" type="date" value={form.expected_end_date} onChange={e => setForm(f => ({...f, expected_end_date: e.target.value}))} />
          <FormTextarea label="Special Instructions" rows={3} value={form.special_instructions} onChange={e => setForm(f => ({...f, special_instructions: e.target.value}))} placeholder="Feeding, medication, behavioral notes..." />
          <FormTextarea label="Feeding Schedule" rows={2} value={form.feeding_schedule} onChange={e => setForm(f => ({...f, feeding_schedule: e.target.value}))} placeholder="e.g. 2x daily, 1 cup each..." />
          <div className="flex gap-3 pt-4 border-t">
            <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border hover:bg-slate-50">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-shelter-primary text-white hover:opacity-90 disabled:opacity-50">{saving ? 'Creating...' : 'Create Placement'}</button>
          </div>
        </div>
      </SlidePanel>

      {/* Notes Panel */}
      <SlidePanel isOpen={!!showNotes} onClose={() => setShowNotes(null)} title="Foster Notes" subtitle={showNotes?.animal?.name}>
        <div className="space-y-4">
          {showNotes?.notes?.length > 0 && (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {showNotes.notes.map((note, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-700">{note.content}</p>
                  <p className="text-xs text-slate-400 mt-1">{note.author} · {note.created_at ? new Date(note.created_at).toLocaleString() : ''}</p>
                </div>
              ))}
            </div>
          )}
          <FormSelect label="Note Type" options={[{ value: 'general', label: 'General' }, { value: 'medical', label: 'Medical Update' }, { value: 'behavioral', label: 'Behavioral' }, { value: 'check_in', label: 'Check-in' }]} value={noteForm.note_type} onChange={e => setNoteForm(f => ({...f, note_type: e.target.value}))} />
          <FormTextarea label="Add Note" rows={3} value={noteForm.content} onChange={e => setNoteForm(f => ({...f, content: e.target.value}))} placeholder="Enter note..." />
          <div className="flex gap-3 pt-4 border-t">
            <button onClick={() => setShowNotes(null)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border hover:bg-slate-50">Close</button>
            <button onClick={() => handleAddNote(showNotes?.id)} disabled={saving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-shelter-primary text-white hover:opacity-90 disabled:opacity-50">{saving ? 'Saving...' : 'Add Note'}</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}

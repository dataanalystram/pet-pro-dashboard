import { useState, useEffect } from 'react';
import { shelterAPI } from '@/api';
import { Users, Plus, Search, User, Mail, Phone, MapPin, Heart, Home, Tag, Edit, Trash2, Download, Eye, History, Dog, Cat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import SlidePanel from '@/components/shared/SlidePanel';
import { FormInput, FormSelect, FormTextarea, FormRow } from '@/components/shared/FormField';

const PERSON_TAGS = [
  { value: 'adopter', label: 'Adopter', color: 'bg-green-100 text-green-700' },
  { value: 'foster', label: 'Foster', color: 'bg-purple-100 text-purple-700' },
  { value: 'volunteer', label: 'Volunteer', color: 'bg-blue-100 text-blue-700' },
  { value: 'donor', label: 'Donor', color: 'bg-amber-100 text-amber-700' },
  { value: 'applicant', label: 'Applicant', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'surrenderer', label: 'Surrenderer', color: 'bg-red-100 text-red-700' },
  { value: 'vet', label: 'Veterinarian', color: 'bg-pink-100 text-pink-700' },
  { value: 'transporter', label: 'Transporter', color: 'bg-indigo-100 text-indigo-700' },
];

const EMPTY_PERSON = {
  full_name: '', email: '', phone: '', address: '', city: '', state: '', zip_code: '',
  tags: [], notes: '', preferred_contact: 'email',
};

export default function ShelterPeople() {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_PERSON });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [showDetail, setShowDetail] = useState(null);
  const [personHistory, setPersonHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchData = async () => {
    try { const { data } = await shelterAPI.getPeople(); setPeople(data); } catch {} setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = people.filter(p => {
    const matchSearch = !search || 
      p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.includes(search);
    const matchTag = !filterTag || p.tags?.includes(filterTag);
    return matchSearch && matchTag;
  });

  const getTagConfig = (tag) => PERSON_TAGS.find(t => t.value === tag) || { color: 'bg-slate-100 text-slate-600', label: tag };

  const toggleTag = (tag) => {
    setForm(f => ({
      ...f, tags: f.tags?.includes(tag) ? f.tags.filter(t => t !== tag) : [...(f.tags || []), tag]
    }));
  };

  const handleSave = async () => {
    if (!form.full_name) { toast.error('Name required'); return; }
    setSaving(true);
    try {
      if (editing) { await shelterAPI.updatePerson(editing.id, form); }
      else { await shelterAPI.createPerson(form); }
      toast.success(editing ? 'Person updated' : 'Person added');
      setShowCreate(false); setEditing(null); setForm({ ...EMPTY_PERSON }); fetchData();
    } catch { toast.error('Failed'); }
    setSaving(false);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({ ...EMPTY_PERSON, ...p, tags: p.tags || [] });
    setShowCreate(true);
  };

  const openDetail = async (p) => {
    setShowDetail(p);
    setLoadingHistory(true);
    try {
      const { data } = await shelterAPI.getPersonHistory(p.id);
      setPersonHistory(data || []);
    } catch { setPersonHistory([]); }
    setLoadingHistory(false);
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete ${p.full_name}?`)) return;
    try {
      await shelterAPI.deletePerson(p.id);
      toast.success('Deleted');
      fetchData();
    } catch { toast.error('Failed'); }
  };

  const downloadCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'City', 'State', 'Tags'];
    const rows = filtered.map(p => [p.full_name, p.email, p.phone, p.city, p.state, (p.tags || []).join(';')]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'people_export.csv'; a.click();
  };

  // Stats
  const adopterCount = people.filter(p => p.tags?.includes('adopter')).length;
  const fosterCount = people.filter(p => p.tags?.includes('foster')).length;
  const donorCount = people.filter(p => p.tags?.includes('donor')).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">People</h1>
          <p className="text-sm text-slate-500">{people.length} people in your network</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ ...EMPTY_PERSON }); setShowCreate(true); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-shelter-primary text-white rounded-lg font-medium text-sm hover:opacity-90 shadow-sm">
          <Plus className="w-4 h-4" /> Add Person
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center"><Users className="w-5 h-5 text-slate-600" /></div>
          <div><p className="text-xl font-bold">{people.length}</p><p className="text-xs text-slate-500">Total People</p></div>
        </div>
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center"><Heart className="w-5 h-5 text-green-600" /></div>
          <div><p className="text-xl font-bold">{adopterCount}</p><p className="text-xs text-slate-500">Adopters</p></div>
        </div>
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center"><Home className="w-5 h-5 text-purple-600" /></div>
          <div><p className="text-xl font-bold">{fosterCount}</p><p className="text-xs text-slate-500">Fosters</p></div>
        </div>
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"><Tag className="w-5 h-5 text-amber-600" /></div>
          <div><p className="text-xl font-bold">{donorCount}</p><p className="text-xs text-slate-500">Donors</p></div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, phone..." className="w-full pl-9 pr-4 py-2.5 bg-white border rounded-lg text-sm" />
        </div>
        <select value={filterTag} onChange={e => setFilterTag(e.target.value)} className="px-3 py-2.5 border rounded-lg text-sm bg-white">
          <option value="">All Tags</option>
          {PERSON_TAGS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <button onClick={downloadCSV} className="px-4 py-2.5 bg-white border rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* People Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => (
          <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-shelter-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-shelter-primary" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{p.full_name}</p>
                  {(p.city || p.state) && <p className="text-xs text-slate-400">{[p.city, p.state].filter(Boolean).join(', ')}</p>}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openDetail(p)} className="p-1.5 rounded hover:bg-slate-100" title="View"><Eye className="w-4 h-4 text-slate-500" /></button>
                <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-slate-100" title="Edit"><Edit className="w-4 h-4 text-slate-500" /></button>
                <button onClick={() => handleDelete(p)} className="p-1.5 rounded hover:bg-red-50" title="Delete"><Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" /></button>
              </div>
            </div>
            {p.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {p.tags.map(t => {
                  const cfg = getTagConfig(t);
                  return <span key={t} className={cn('text-xs px-2 py-0.5 rounded-full font-medium', cfg.color)}>{cfg.label}</span>;
                })}
              </div>
            )}
            <div className="space-y-1 text-xs text-slate-500">
              {p.email && <div className="flex items-center gap-1.5 truncate"><Mail className="w-3 h-3 flex-shrink-0" />{p.email}</div>}
              {p.phone && <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 flex-shrink-0" />{p.phone}</div>}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && !loading && <div className="py-16 text-center text-sm text-slate-400 bg-white rounded-xl border">No people found</div>}

      {/* Create/Edit Panel */}
      <SlidePanel isOpen={showCreate} onClose={() => { setShowCreate(false); setEditing(null); }} title={editing ? 'Edit Person' : 'Add Person'}>
        <div className="space-y-4">
          <FormInput label="Full Name" required value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} />
          <FormRow>
            <FormInput label="Email" type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
            <FormInput label="Phone" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
          </FormRow>
          <FormInput label="Address" value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} />
          <FormRow>
            <FormInput label="City" value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))} />
            <FormInput label="State" value={form.state} onChange={e => setForm(f => ({...f, state: e.target.value}))} />
            <FormInput label="ZIP" value={form.zip_code} onChange={e => setForm(f => ({...f, zip_code: e.target.value}))} />
          </FormRow>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Tags</label>
            <div className="flex flex-wrap gap-2">
              {PERSON_TAGS.map(t => (
                <button key={t.value} onClick={() => toggleTag(t.value)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border', form.tags?.includes(t.value) ? t.color : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600')}>{t.label}</button>
              ))}
            </div>
          </div>
          <FormSelect label="Preferred Contact" options={[{value:'email',label:'Email'},{value:'phone',label:'Phone'},{value:'text',label:'Text'}]} value={form.preferred_contact} onChange={e => setForm(f => ({...f, preferred_contact: e.target.value}))} />
          <FormTextarea label="Notes" rows={3} value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
          <div className="flex gap-3 pt-4 border-t">
            <button onClick={() => { setShowCreate(false); setEditing(null); }} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border hover:bg-slate-50">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-shelter-primary text-white hover:opacity-90 disabled:opacity-50">{saving ? 'Saving...' : editing ? 'Update' : 'Add Person'}</button>
          </div>
        </div>
      </SlidePanel>

      {/* Detail Panel */}
      <SlidePanel isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={showDetail?.full_name || ''} subtitle="Person Details" width="max-w-2xl">
        {showDetail && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-xs text-slate-500">Email</span><p className="text-sm font-medium">{showDetail.email || '-'}</p></div>
              <div><span className="text-xs text-slate-500">Phone</span><p className="text-sm font-medium">{showDetail.phone || '-'}</p></div>
              <div><span className="text-xs text-slate-500">Address</span><p className="text-sm font-medium">{[showDetail.address, showDetail.city, showDetail.state, showDetail.zip_code].filter(Boolean).join(', ') || '-'}</p></div>
              <div><span className="text-xs text-slate-500">Preferred Contact</span><p className="text-sm font-medium capitalize">{showDetail.preferred_contact || '-'}</p></div>
            </div>

            {/* Tags */}
            {showDetail.tags?.length > 0 && (
              <div>
                <h4 className="text-xs text-slate-500 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-1.5">
                  {showDetail.tags.map(t => {
                    const cfg = getTagConfig(t);
                    return <span key={t} className={cn('text-xs px-2.5 py-1 rounded-full font-medium', cfg.color)}>{cfg.label}</span>;
                  })}
                </div>
              </div>
            )}

            {/* Notes */}
            {showDetail.notes && (
              <div>
                <h4 className="text-xs text-slate-500 mb-2">Notes</h4>
                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{showDetail.notes}</p>
              </div>
            )}

            {/* History */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><History className="w-4 h-4" /> Adoption & Foster History</h4>
              {loadingHistory ? (
                <div className="py-8 text-center"><div className="w-6 h-6 border-2 border-shelter-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
              ) : personHistory.length > 0 ? (
                <div className="space-y-3">
                  {personHistory.map((h, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      {h.species === 'cat' ? <Cat className="w-5 h-5 text-purple-500" /> : <Dog className="w-5 h-5 text-blue-500" />}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{h.animal_name}</p>
                        <p className="text-xs text-slate-500">{h.type} on {h.date ? new Date(h.date).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <span className={cn('text-xs px-2 py-1 rounded-full font-medium', h.type === 'Adoption' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700')}>{h.type}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-6 bg-slate-50 rounded-lg">No adoption or foster history</p>
              )}
            </div>

            {/* Applications linked to this person */}
            {showDetail.applications?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Applications</h4>
                <div className="space-y-2">
                  {showDetail.applications.map((app, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-sm">
                      <span>{app.type} - {app.animal_name || 'General'}</span>
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium', app.status === 'approved' ? 'bg-green-100 text-green-700' : app.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')}>{app.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </SlidePanel>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { shelterAPI } from '@/api';
import { Building2, Plus, Search, Edit, Trash2, Phone, Mail, Globe, MapPin, User, Stethoscope, Truck, Scissors, PawPrint, Store, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import SlidePanel from '@/components/shared/SlidePanel';
import { FormInput, FormSelect, FormTextarea, FormRow } from '@/components/shared/FormField';

const PARTNER_TYPES = [
  { value: 'vet_clinic', label: 'Vet Clinic', icon: Stethoscope, color: 'bg-blue-100 text-blue-700' },
  { value: 'shelter', label: 'Shelter/Rescue', icon: PawPrint, color: 'bg-green-100 text-green-700' },
  { value: 'transporter', label: 'Transporter', icon: Truck, color: 'bg-amber-100 text-amber-700' },
  { value: 'groomer', label: 'Groomer', icon: Scissors, color: 'bg-pink-100 text-pink-700' },
  { value: 'pet_store', label: 'Pet Store', icon: Store, color: 'bg-purple-100 text-purple-700' },
  { value: 'boarding', label: 'Boarding Facility', icon: Building2, color: 'bg-cyan-100 text-cyan-700' },
  { value: 'trainer', label: 'Trainer', icon: User, color: 'bg-indigo-100 text-indigo-700' },
  { value: 'supplier', label: 'Supplier', icon: Store, color: 'bg-slate-100 text-slate-700' },
  { value: 'other', label: 'Other', icon: Building2, color: 'bg-slate-100 text-slate-600' },
];

const EMPTY_PARTNER = {
  name: '', partner_type: 'vet_clinic', address: '', city: '', state: '', zip_code: '',
  phone: '', email: '', website: '', contact_name: '', contact_phone: '', contact_email: '',
  notes: '', services: '', is_preferred: false,
};

export default function ShelterPartners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_PARTNER });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');

  const fetchData = async () => {
    try { const { data } = await shelterAPI.getPartners(); setPartners(data); } catch {} setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = partners.filter(p => {
    const matchSearch = !search || 
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.city?.toLowerCase().includes(search.toLowerCase()) ||
      p.contact_name?.toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || p.partner_type === filterType;
    return matchSearch && matchType;
  });

  const getTypeConfig = (type) => PARTNER_TYPES.find(t => t.value === type) || PARTNER_TYPES[PARTNER_TYPES.length - 1];

  const handleSave = async () => {
    if (!form.name) { toast.error('Partner name required'); return; }
    setSaving(true);
    try {
      if (editing) { await shelterAPI.updatePartner(editing.id, form); }
      else { await shelterAPI.createPartner(form); }
      toast.success(editing ? 'Partner updated' : 'Partner added');
      setShowCreate(false); setEditing(null); setForm({ ...EMPTY_PARTNER }); fetchData();
    } catch { toast.error('Failed'); }
    setSaving(false);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({ ...EMPTY_PARTNER, ...p });
    setShowCreate(true);
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete ${p.name}?`)) return;
    try {
      await shelterAPI.deletePartner(p.id);
      toast.success('Deleted');
      fetchData();
    } catch { toast.error('Failed'); }
  };

  const togglePreferred = async (p) => {
    try {
      await shelterAPI.updatePartner(p.id, { is_preferred: !p.is_preferred });
      toast.success(p.is_preferred ? 'Removed from preferred' : 'Marked as preferred');
      fetchData();
    } catch { toast.error('Failed'); }
  };

  // Stats by type
  const typeCounts = PARTNER_TYPES.reduce((acc, t) => {
    acc[t.value] = partners.filter(p => p.partner_type === t.value).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Partners Directory</h1>
          <p className="text-sm text-slate-500">{partners.length} partners in your network</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ ...EMPTY_PARTNER }); setShowCreate(true); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-shelter-primary text-white rounded-lg font-medium text-sm hover:opacity-90 shadow-sm">
          <Plus className="w-4 h-4" /> Add Partner
        </button>
      </div>

      {/* Type Stats */}
      <div className="flex gap-2 flex-wrap">
        {PARTNER_TYPES.filter(t => typeCounts[t.value] > 0).map(t => {
          const TypeIcon = t.icon;
          return (
            <button key={t.value} onClick={() => setFilterType(f => f === t.value ? '' : t.value)} className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors', filterType === t.value ? t.color + ' border-current' : 'bg-white border-slate-200 hover:bg-slate-50')}>
              <TypeIcon className="w-3.5 h-3.5" />
              {t.label}: {typeCounts[t.value]}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, city, contact..." className="w-full pl-9 pr-4 py-2.5 bg-white border rounded-lg text-sm" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2.5 border rounded-lg text-sm bg-white">
          <option value="">All Types</option>
          {PARTNER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => {
          const typeConfig = getTypeConfig(p.partner_type);
          const TypeIcon = typeConfig.icon;
          return (
            <div key={p.id} className={cn('bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow', p.is_preferred && 'ring-2 ring-amber-400')}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', typeConfig.color.replace('text-', 'bg-').split(' ')[0])}>
                    <TypeIcon className={cn('w-6 h-6', typeConfig.color.split(' ')[1])} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">{p.name}</p>
                      {p.is_preferred && <span className="text-amber-500" title="Preferred">★</span>}
                    </div>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', typeConfig.color)}>{typeConfig.label}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => togglePreferred(p)} className={cn('p-1.5 rounded hover:bg-amber-50', p.is_preferred ? 'text-amber-500' : 'text-slate-400')} title="Toggle Preferred">★</button>
                  <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-slate-100" title="Edit"><Edit className="w-4 h-4 text-slate-500" /></button>
                  <button onClick={() => handleDelete(p)} className="p-1.5 rounded hover:bg-red-50" title="Delete"><Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" /></button>
                </div>
              </div>

              {/* Location */}
              {(p.city || p.state) && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                  <MapPin className="w-3 h-3" />{[p.city, p.state].filter(Boolean).join(', ')}
                </div>
              )}

              {/* Contact Info */}
              <div className="space-y-1.5 text-xs text-slate-500 mb-3">
                {p.phone && <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 flex-shrink-0" />{p.phone}</div>}
                {p.email && <div className="flex items-center gap-1.5 truncate"><Mail className="w-3 h-3 flex-shrink-0" />{p.email}</div>}
                {p.website && (
                  <a href={p.website.startsWith('http') ? p.website : `https://${p.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-shelter-primary hover:underline truncate">
                    <Globe className="w-3 h-3 flex-shrink-0" />{p.website.replace(/^https?:\/\//, '')}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>

              {/* Primary Contact */}
              {p.contact_name && (
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-400 mb-1">Primary Contact</p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                      <User className="w-3 h-3 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{p.contact_name}</p>
                      {p.contact_phone && <p className="text-xs text-slate-400">{p.contact_phone}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Services */}
              {p.services && (
                <div className="pt-3 mt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500 line-clamp-2">{p.services}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && !loading && <div className="py-16 text-center text-sm text-slate-400 bg-white rounded-xl border">No partners found</div>}

      {/* Create/Edit Panel */}
      <SlidePanel isOpen={showCreate} onClose={() => { setShowCreate(false); setEditing(null); }} title={editing ? 'Edit Partner' : 'Add Partner'} width="max-w-xl">
        <div className="space-y-4">
          <FormInput label="Partner Name" required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
          <FormSelect label="Partner Type" options={PARTNER_TYPES.map(t => ({value: t.value, label: t.label}))} value={form.partner_type} onChange={e => setForm(f => ({...f, partner_type: e.target.value}))} />
          
          <div className="pt-3 border-t">
            <h4 className="text-sm font-medium text-slate-700 mb-3">Location</h4>
            <FormInput label="Address" value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} />
            <FormRow className="mt-3">
              <FormInput label="City" value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))} />
              <FormInput label="State" value={form.state} onChange={e => setForm(f => ({...f, state: e.target.value}))} />
              <FormInput label="ZIP" value={form.zip_code} onChange={e => setForm(f => ({...f, zip_code: e.target.value}))} />
            </FormRow>
          </div>

          <div className="pt-3 border-t">
            <h4 className="text-sm font-medium text-slate-700 mb-3">Contact Information</h4>
            <FormRow>
              <FormInput label="Phone" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
              <FormInput label="Email" type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
            </FormRow>
            <FormInput label="Website" value={form.website} onChange={e => setForm(f => ({...f, website: e.target.value}))} placeholder="www.example.com" className="mt-3" />
          </div>

          <div className="pt-3 border-t">
            <h4 className="text-sm font-medium text-slate-700 mb-3">Primary Contact Person</h4>
            <FormInput label="Contact Name" value={form.contact_name} onChange={e => setForm(f => ({...f, contact_name: e.target.value}))} />
            <FormRow className="mt-3">
              <FormInput label="Contact Phone" value={form.contact_phone} onChange={e => setForm(f => ({...f, contact_phone: e.target.value}))} />
              <FormInput label="Contact Email" type="email" value={form.contact_email} onChange={e => setForm(f => ({...f, contact_email: e.target.value}))} />
            </FormRow>
          </div>

          <FormTextarea label="Services Offered" rows={2} value={form.services} onChange={e => setForm(f => ({...f, services: e.target.value}))} placeholder="Describe services this partner provides..." />
          <FormTextarea label="Notes" rows={2} value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} />

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_preferred} onChange={e => setForm(f => ({...f, is_preferred: e.target.checked}))} />
            Mark as Preferred Partner
          </label>

          <div className="flex gap-3 pt-4 border-t">
            <button onClick={() => { setShowCreate(false); setEditing(null); }} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border hover:bg-slate-50">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-shelter-primary text-white hover:opacity-90 disabled:opacity-50">{saving ? 'Saving...' : editing ? 'Update' : 'Add Partner'}</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}

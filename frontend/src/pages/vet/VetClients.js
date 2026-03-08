import { useState, useEffect } from 'react';
import { vetAPI } from '@/api';
import { Users, Plus, Search, Phone, Mail, MapPin, PawPrint, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import SlidePanel from '@/components/shared/SlidePanel';
import { FormInput, FormSelect, FormTextarea, FormRow } from '@/components/shared/FormField';

const EMPTY_CLIENT = {
  first_name: '', last_name: '', email: '', phone: '', address: '',
  city: '', emergency_contact: '', preferred_contact: 'phone', notes: '',
};

export default function VetClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_CLIENT });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try { const { data } = await vetAPI.getClients(); setClients(data); } catch {} setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = clients.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return c.first_name?.toLowerCase().includes(s) || c.last_name?.toLowerCase().includes(s) || c.email?.toLowerCase().includes(s) || c.phone?.includes(s);
  });

  const handleCreate = async () => {
    if (!form.first_name || !form.last_name) { toast.error('Name required'); return; }
    setSaving(true);
    try {
      await vetAPI.createClient(form);
      toast.success('Client created');
      setShowCreate(false); setForm({ ...EMPTY_CLIENT }); fetchData();
    } catch { toast.error('Failed'); }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-sm text-slate-500">{clients.length} registered clients</p>
        </div>
        <button onClick={() => { setForm({ ...EMPTY_CLIENT }); setShowCreate(true); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-vet-primary text-white rounded-lg font-medium text-sm hover:bg-vet-secondary shadow-sm">
          <Plus className="w-4 h-4" /> New Client
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, phone..." className="w-full pl-9 pr-4 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vet-primary/20" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b"><tr>
            <th className="text-left px-5 py-3 font-semibold text-slate-600">Name</th>
            <th className="text-left px-5 py-3 font-semibold text-slate-600">Contact</th>
            <th className="text-left px-5 py-3 font-semibold text-slate-600 hidden md:table-cell">Address</th>
            <th className="text-left px-5 py-3 font-semibold text-slate-600">Pets</th>
            <th className="text-right px-5 py-3 font-semibold text-slate-600">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-5 py-3">
                  <p className="font-medium text-slate-900">{c.first_name} {c.last_name}</p>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1 text-slate-500 text-xs"><Phone className="w-3 h-3" />{c.phone || '-'}</div>
                  <div className="flex items-center gap-1 text-slate-500 text-xs"><Mail className="w-3 h-3" />{c.email || '-'}</div>
                </td>
                <td className="px-5 py-3 text-slate-500 text-xs hidden md:table-cell">{c.address || '-'}</td>
                <td className="px-5 py-3"><span className="inline-flex items-center gap-1 text-xs"><PawPrint className="w-3 h-3" />{c.pets_count || c.patients?.length || 0}</span></td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => setShowDetail(c)} className="p-1.5 rounded hover:bg-slate-100"><Eye className="w-4 h-4 text-slate-500" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="py-16 text-center text-sm text-slate-400">No clients found</div>}
      </div>

      {/* Create Client Panel */}
      <SlidePanel isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Client" subtitle="Register a new client">
        <div className="space-y-4">
          <FormRow>
            <FormInput label="First Name" required value={form.first_name} onChange={e => setForm(f => ({...f, first_name: e.target.value}))} />
            <FormInput label="Last Name" required value={form.last_name} onChange={e => setForm(f => ({...f, last_name: e.target.value}))} />
          </FormRow>
          <FormRow>
            <FormInput label="Email" type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
            <FormInput label="Phone" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
          </FormRow>
          <FormInput label="Address" value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} />
          <FormInput label="City" value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))} />
          <FormInput label="Emergency Contact" value={form.emergency_contact} onChange={e => setForm(f => ({...f, emergency_contact: e.target.value}))} />
          <FormSelect label="Preferred Contact" options={[{value:'phone',label:'Phone'},{value:'email',label:'Email'},{value:'sms',label:'SMS'}]} value={form.preferred_contact} onChange={e => setForm(f => ({...f, preferred_contact: e.target.value}))} />
          <FormTextarea label="Notes" rows={2} value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
          <div className="flex gap-3 pt-4 border-t">
            <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 border hover:bg-slate-50">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-vet-primary text-white hover:bg-vet-secondary disabled:opacity-50">{saving ? 'Creating...' : 'Create Client'}</button>
          </div>
        </div>
      </SlidePanel>

      {/* Detail Panel */}
      <SlidePanel isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={showDetail ? `${showDetail.first_name} ${showDetail.last_name}` : ''} subtitle="Client Details">
        {showDetail && (
          <div className="space-y-4">
            <div className="space-y-2 text-sm">
              {showDetail.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /><span>{showDetail.phone}</span></div>}
              {showDetail.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" /><span>{showDetail.email}</span></div>}
              {showDetail.address && <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /><span>{showDetail.address}</span></div>}
            </div>
            {showDetail.patients && showDetail.patients.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Pets</h3>
                <div className="space-y-2">
                  {showDetail.patients.map(p => (
                    <div key={p.id} className="p-3 bg-slate-50 rounded-lg flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-vet-primary/10 flex items-center justify-center"><PawPrint className="w-5 h-5 text-vet-primary" /></div>
                      <div><p className="text-sm font-medium text-slate-900">{p.name}</p><p className="text-xs text-slate-500">{p.species} · {p.breed}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {showDetail.notes && <div><h3 className="text-sm font-semibold text-slate-700 mb-1">Notes</h3><p className="text-sm text-slate-600">{showDetail.notes}</p></div>}
          </div>
        )}
      </SlidePanel>
    </div>
  );
}

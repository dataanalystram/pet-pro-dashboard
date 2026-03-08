import { useState, useEffect } from 'react';
import { servicesAPI } from '@/api';
import { Plus, Pencil, Trash2, Clock, DollarSign, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import SlidePanel from '@/components/shared/SlidePanel';
import { FormInput, FormSelect, FormTextarea, FormRow } from '@/components/shared/FormField';

const categoryColors = {
  grooming: 'bg-blue-100 text-blue-700',
  dental: 'bg-emerald-100 text-emerald-700',
  medical: 'bg-red-100 text-red-700',
  walking: 'bg-amber-100 text-amber-700',
  boarding: 'bg-violet-100 text-violet-700',
  training: 'bg-orange-100 text-orange-700',
  sitting: 'bg-pink-100 text-pink-700',
  photography: 'bg-cyan-100 text-cyan-700',
  other: 'bg-slate-100 text-slate-600',
};

const CATEGORIES = [
  { value: 'grooming', label: 'Grooming' },
  { value: 'dental', label: 'Dental' },
  { value: 'medical', label: 'Medical' },
  { value: 'walking', label: 'Walking' },
  { value: 'boarding', label: 'Boarding' },
  { value: 'training', label: 'Training' },
  { value: 'sitting', label: 'Pet Sitting' },
  { value: 'photography', label: 'Photography' },
  { value: 'other', label: 'Other' },
];

const EMPTY_FORM = {
  name: '', description: '', category: 'grooming', base_price: '',
  price_type: 'fixed', duration_minutes: '', buffer_minutes: '15',
  pet_types_accepted: ['dog', 'cat'], vaccination_required: true, is_active: true,
  max_bookings_per_day: '', cancellation_hours: 24,
};

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const loadServices = async () => {
    try { const { data } = await servicesAPI.list(); setServices(data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadServices(); }, []);

  const openAdd = () => { setEditing(null); setForm({ ...EMPTY_FORM }); setShowPanel(true); };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      name: s.name || '', description: s.description || '', category: s.category || 'grooming',
      base_price: s.base_price?.toString() || '', price_type: s.price_type || 'fixed',
      duration_minutes: s.duration_minutes?.toString() || '', buffer_minutes: (s.buffer_minutes || 15).toString(),
      pet_types_accepted: s.pet_types_accepted || ['dog', 'cat'],
      vaccination_required: s.vaccination_required ?? true, is_active: s.is_active ?? true,
      max_bookings_per_day: s.max_bookings_per_day?.toString() || '',
      cancellation_hours: s.cancellation_hours || 24,
    });
    setShowPanel(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.base_price) { toast.error('Name and price required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        base_price: parseFloat(form.base_price) || 0,
        duration_minutes: parseInt(form.duration_minutes) || 60,
        buffer_minutes: parseInt(form.buffer_minutes) || 15,
        max_bookings_per_day: form.max_bookings_per_day ? parseInt(form.max_bookings_per_day) : null,
      };
      if (editing) await servicesAPI.update(editing.id, payload);
      else await servicesAPI.create(payload);
      toast.success(editing ? 'Service updated' : 'Service created');
      await loadServices();
      setShowPanel(false);
    } catch (e) { toast.error('Failed to save'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this service?')) return;
    try {
      await servicesAPI.remove(id);
      toast.success('Service deleted');
      await loadServices();
    } catch { toast.error('Failed to delete'); }
  };

  const toggleActive = async (svc) => {
    try {
      await servicesAPI.update(svc.id, { is_active: !svc.is_active });
      toast.success(svc.is_active ? 'Service deactivated' : 'Service activated');
      await loadServices();
    } catch { toast.error('Failed'); }
  };

  if (loading) return (
    <div className="space-y-4">
      <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
      {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-slate-200 rounded-xl animate-pulse" />)}
    </div>
  );

  const active = services.filter((s) => s.is_active);
  const inactive = services.filter((s) => !s.is_active);

  const togglePetType = (type) => {
    setForm(f => ({
      ...f,
      pet_types_accepted: f.pet_types_accepted.includes(type)
        ? f.pet_types_accepted.filter(t => t !== type)
        : [...f.pet_types_accepted, type],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Services & Pricing</h1>
          <p className="text-sm text-slate-500">{services.length} services configured</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2.5 bg-provider-primary text-white rounded-lg font-medium text-sm hover:bg-blue-700 shadow-sm">
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      {services.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <Plus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No services yet</p>
          <button onClick={openAdd} className="mt-4 px-4 py-2 bg-provider-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700">Create Your First Service</button>
        </div>
      ) : (
        <div className="space-y-3">
          {active.map((s) => <ServiceCard key={s.id} service={s} onEdit={openEdit} onDelete={handleDelete} onToggle={toggleActive} />)}
          {inactive.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-6 mb-2">Inactive Services</p>
              {inactive.map((s) => <ServiceCard key={s.id} service={s} onEdit={openEdit} onDelete={handleDelete} onToggle={toggleActive} />)}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Panel */}
      <SlidePanel isOpen={showPanel} onClose={() => setShowPanel(false)} title={editing ? 'Edit Service' : 'Add New Service'} subtitle={editing ? `Editing ${editing.name}` : 'Create a new service offering'} width="max-w-xl">
        <div className="space-y-4">
          <FormInput label="Service Name" required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Full Dog Grooming" />
          <FormTextarea label="Description" rows={2} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Brief description shown to customers..." />
          <FormRow>
            <FormSelect label="Category" options={CATEGORIES} value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} />
            <FormSelect label="Price Type" options={[{value:'fixed',label:'Fixed'},{value:'from',label:'Starting From'},{value:'hourly',label:'Hourly'}]} value={form.price_type} onChange={e => setForm(f => ({...f, price_type: e.target.value}))} />
          </FormRow>
          <FormRow>
            <FormInput label="Base Price (\u20AC)" required type="number" step="0.01" value={form.base_price} onChange={e => setForm(f => ({...f, base_price: e.target.value}))} />
            <FormInput label="Duration (min)" type="number" value={form.duration_minutes} onChange={e => setForm(f => ({...f, duration_minutes: e.target.value}))} placeholder="60" />
          </FormRow>
          <FormRow>
            <FormInput label="Buffer Time (min)" type="number" value={form.buffer_minutes} onChange={e => setForm(f => ({...f, buffer_minutes: e.target.value}))} />
            <FormInput label="Max Bookings/Day" type="number" value={form.max_bookings_per_day} onChange={e => setForm(f => ({...f, max_bookings_per_day: e.target.value}))} placeholder="Unlimited" />
          </FormRow>
          <FormInput label="Cancellation Notice (hours)" type="number" value={form.cancellation_hours} onChange={e => setForm(f => ({...f, cancellation_hours: parseInt(e.target.value) || 24}))} />

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Pet Types Accepted</label>
            <div className="flex flex-wrap gap-2">
              {['dog', 'cat', 'bird', 'rabbit', 'reptile', 'other'].map(type => (
                <button key={type} onClick={() => togglePetType(type)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border capitalize', form.pet_types_accepted.includes(type) ? 'bg-provider-primary text-white border-provider-primary' : 'bg-white border-slate-200 hover:bg-slate-50')}>
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-t">
            <div><p className="text-sm font-medium text-slate-700">Vaccination Required</p><p className="text-xs text-slate-500">Require proof of vaccination</p></div>
            <button onClick={() => setForm(f => ({...f, vaccination_required: !f.vaccination_required}))} className={cn('w-11 h-6 rounded-full transition-colors relative', form.vaccination_required ? 'bg-provider-primary' : 'bg-slate-300')}>
              <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform" style={{left: form.vaccination_required ? '22px' : '2px'}} />
            </button>
          </div>
          <div className="flex items-center justify-between py-2 border-t">
            <div><p className="text-sm font-medium text-slate-700">Active</p><p className="text-xs text-slate-500">Visible to customers</p></div>
            <button onClick={() => setForm(f => ({...f, is_active: !f.is_active}))} className={cn('w-11 h-6 rounded-full transition-colors relative', form.is_active ? 'bg-provider-primary' : 'bg-slate-300')}>
              <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform" style={{left: form.is_active ? '22px' : '2px'}} />
            </button>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button onClick={() => setShowPanel(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border hover:bg-slate-50">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name || !form.base_price} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-provider-primary text-white hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Service'}
            </button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}

function ServiceCard({ service: s, onEdit, onDelete, onToggle }) {
  return (
    <div className={cn("bg-white rounded-xl border border-slate-200 p-5 transition-all hover:shadow-sm", !s.is_active && "opacity-60")}>
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-sm font-semibold text-slate-900">{s.name}</p>
            <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", categoryColors[s.category] || categoryColors.other)}>{s.category}</span>
            {!s.is_active && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Inactive</span>}
          </div>
          {s.description && <p className="text-xs text-slate-500 truncate">{s.description}</p>}
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />\u20AC{(s.base_price || 0).toFixed(2)}{s.price_type === 'hourly' ? '/hr' : s.price_type === 'from' ? '+' : ''}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.duration_minutes}min</span>
            {s.pet_types_accepted && <span>{s.pet_types_accepted.join(', ')}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => onEdit(s)} className="p-2 rounded-lg hover:bg-slate-100" title="Edit"><Pencil className="w-4 h-4 text-slate-500" /></button>
          <button onClick={() => onDelete(s.id)} className="p-2 rounded-lg hover:bg-red-50" title="Delete"><Trash2 className="w-4 h-4 text-red-500" /></button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { vetAPI } from '@/api';
import { Users, Plus, Edit, Trash2, Shield, Star, Phone, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import SlidePanel from '@/components/shared/SlidePanel';
import { FormInput, FormSelect, FormTextarea, FormRow } from '@/components/shared/FormField';

const ROLES = [
  { value: 'veterinarian', label: 'Veterinarian', color: 'bg-blue-50 text-blue-700' },
  { value: 'technician', label: 'Technician', color: 'bg-green-50 text-green-700' },
  { value: 'receptionist', label: 'Front Desk', color: 'bg-amber-50 text-amber-700' },
  { value: 'manager', label: 'Manager', color: 'bg-purple-50 text-purple-700' },
  { value: 'assistant', label: 'Assistant', color: 'bg-slate-100 text-slate-700' },
];

const EMPTY_STAFF = {
  full_name: '', email: '', phone: '', role: 'veterinarian', specialization: '',
  license_number: '', color: '#0891B2', is_active: true, notes: '',
};

export default function VetStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_STAFF });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try { const { data } = await vetAPI.getStaff(); setStaff(data); } catch {} setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openEdit = (s) => {
    setEditing(s);
    setForm({ ...EMPTY_STAFF, ...s });
    setShowCreate(true);
  };

  const handleSave = async () => {
    if (!form.full_name || !form.role) { toast.error('Name and role required'); return; }
    setSaving(true);
    try {
      await vetAPI.createStaff(form);
      toast.success(editing ? 'Staff updated' : 'Staff added');
      setShowCreate(false); setEditing(null); setForm({ ...EMPTY_STAFF }); fetchData();
    } catch { toast.error('Failed'); }
    setSaving(false);
  };

  const roleMap = Object.fromEntries(ROLES.map(r => [r.value, r]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff Management</h1>
          <p className="text-sm text-slate-500">{staff.length} team members</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ ...EMPTY_STAFF }); setShowCreate(true); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-vet-primary text-white rounded-lg font-medium text-sm hover:bg-vet-secondary shadow-sm">
          <Plus className="w-4 h-4" /> Add Staff Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map(s => {
          const role = roleMap[s.role] || ROLES[0];
          return (
            <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: s.color || '#0891B2' }}>
                    {s.full_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{s.full_name}</p>
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', role.color)}>{role.label}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-slate-100"><Edit className="w-4 h-4 text-slate-500" /></button>
                </div>
              </div>
              {s.specialization && <p className="text-xs text-slate-500 mb-2"><Star className="w-3 h-3 inline mr-1" />{s.specialization}</p>}
              <div className="space-y-1 text-xs text-slate-500">
                {s.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{s.email}</div>}
                {s.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{s.phone}</div>}
                {s.license_number && <div className="flex items-center gap-1"><Shield className="w-3 h-3" />Lic: {s.license_number}</div>}
              </div>
              {!s.is_active && <span className="mt-2 inline-block text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded">Inactive</span>}
            </div>
          );
        })}
      </div>

      {staff.length === 0 && !loading && (
        <div className="py-16 text-center text-sm text-slate-400 bg-white rounded-xl border">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          No staff members yet
        </div>
      )}

      <SlidePanel isOpen={showCreate} onClose={() => { setShowCreate(false); setEditing(null); }} title={editing ? 'Edit Staff' : 'Add Staff Member'}>
        <div className="space-y-4">
          <FormInput label="Full Name" required value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} />
          <FormRow>
            <FormInput label="Email" type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
            <FormInput label="Phone" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
          </FormRow>
          <FormSelect label="Role" required options={ROLES} value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))} />
          <FormInput label="Specialization" value={form.specialization} onChange={e => setForm(f => ({...f, specialization: e.target.value}))} placeholder="e.g. Dentistry, Surgery" />
          <FormInput label="License Number" value={form.license_number} onChange={e => setForm(f => ({...f, license_number: e.target.value}))} />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Calendar Color</label>
            <div className="flex gap-2">
              {['#0891B2','#7C3AED','#059669','#DC2626','#D97706','#2563EB','#EC4899'].map(c => (
                <button key={c} onClick={() => setForm(f => ({...f, color: c}))} className={cn('w-8 h-8 rounded-full border-2 transition-transform', form.color === c ? 'border-slate-900 scale-110' : 'border-transparent')} style={{backgroundColor: c}} />
              ))}
            </div>
          </div>
          <FormTextarea label="Notes" rows={2} value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
          <div className="flex gap-3 pt-4 border-t">
            <button onClick={() => { setShowCreate(false); setEditing(null); }} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border hover:bg-slate-50">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-vet-primary text-white hover:bg-vet-secondary disabled:opacity-50">{saving ? 'Saving...' : editing ? 'Update' : 'Add Staff'}</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}

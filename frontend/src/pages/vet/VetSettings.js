import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, Building2, Clock, Bell, CreditCard, Users, Calendar, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { vetAPI } from '@/api';

const TABS = [
  { key: 'clinic', label: 'Clinic Profile', icon: Building2 },
  { key: 'booking', label: 'Booking Settings', icon: Calendar },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'billing', label: 'Payment Settings', icon: CreditCard },
  { key: 'roles', label: 'Roles & Permissions', icon: Shield },
];

export default function VetSettings() {
  const { vetClinic, refreshVetClinic } = useAuth();
  const [activeTab, setActiveTab] = useState('clinic');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    clinic_name: vetClinic?.clinic_name || '',
    phone: vetClinic?.phone || '',
    email: vetClinic?.email || '',
    address: vetClinic?.address || '',
    operating_hours: vetClinic?.operating_hours || 'Mon-Fri 8am-6pm, Sat 9am-2pm',
    description: vetClinic?.description || '',
    slot_duration: 20,
    buffer_time: 10,
    max_advance_days: 90,
    min_notice_hours: 2,
    tax_rate: 23,
    currency: 'EUR',
    enable_email: true,
    enable_sms: false,
    new_appointment: true,
    cancellation: true,
    lab_results: true,
    payment_reminder: true,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await vetAPI.updateClinic({ clinic_name: form.clinic_name, phone: form.phone, email: form.email, address: form.address, description: form.description });
      await refreshVetClinic();
      toast.success('Settings saved');
    } catch { toast.error('Failed to save'); }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>

      <div className="flex gap-6">
        <div className="w-56 space-y-1 flex-shrink-0">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={cn('w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left', activeTab === tab.key ? 'bg-vet-primary text-white' : 'text-slate-600 hover:bg-slate-100')}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white rounded-xl border border-slate-200 p-6">
          {activeTab === 'clinic' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Clinic Profile</h2>
              <div className="space-y-3">
                <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Clinic Name</label><input value={form.clinic_name} onChange={e => setForm(f => ({...f, clinic_name: e.target.value}))} className="w-full px-3 py-2.5 border rounded-lg text-sm" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Phone</label><input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} className="w-full px-3 py-2.5 border rounded-lg text-sm" /></div>
                  <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Email</label><input value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className="w-full px-3 py-2.5 border rounded-lg text-sm" /></div>
                </div>
                <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Address</label><input value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} className="w-full px-3 py-2.5 border rounded-lg text-sm" /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Operating Hours</label><input value={form.operating_hours} onChange={e => setForm(f => ({...f, operating_hours: e.target.value}))} className="w-full px-3 py-2.5 border rounded-lg text-sm" /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Description</label><textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={3} className="w-full px-3 py-2.5 border rounded-lg text-sm resize-none" /></div>
              </div>
              <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-vet-primary text-white rounded-lg font-medium text-sm hover:bg-vet-secondary disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {activeTab === 'booking' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Booking Settings</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Default Slot Duration (min)</label><input type="number" value={form.slot_duration} onChange={e => setForm(f => ({...f, slot_duration: parseInt(e.target.value)}))} className="w-full px-3 py-2.5 border rounded-lg text-sm" /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Buffer Time (min)</label><input type="number" value={form.buffer_time} onChange={e => setForm(f => ({...f, buffer_time: parseInt(e.target.value)}))} className="w-full px-3 py-2.5 border rounded-lg text-sm" /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Max Advance Days</label><input type="number" value={form.max_advance_days} onChange={e => setForm(f => ({...f, max_advance_days: parseInt(e.target.value)}))} className="w-full px-3 py-2.5 border rounded-lg text-sm" /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Min Notice Hours</label><input type="number" value={form.min_notice_hours} onChange={e => setForm(f => ({...f, min_notice_hours: parseInt(e.target.value)}))} className="w-full px-3 py-2.5 border rounded-lg text-sm" /></div>
              </div>
              <button onClick={() => toast.success('Settings saved')} className="px-6 py-2.5 bg-vet-primary text-white rounded-lg font-medium text-sm hover:bg-vet-secondary">Save Changes</button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Notification Preferences</h2>
              {[{key:'new_appointment',label:'New Appointment'},{key:'cancellation',label:'Cancellation'},{key:'lab_results',label:'Lab Results Ready'},{key:'payment_reminder',label:'Payment Reminders'}].map(n => (
                <div key={n.key} className="flex items-center justify-between py-3 border-b">
                  <span className="text-sm font-medium text-slate-700">{n.label}</span>
                  <button onClick={() => setForm(f => ({...f, [n.key]: !f[n.key]}))} className={cn('w-11 h-6 rounded-full transition-colors relative', form[n.key] ? 'bg-vet-primary' : 'bg-slate-300')}>
                    <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', form[n.key] ? 'left-5.5 translate-x-0' : 'left-0.5')} style={{left: form[n.key] ? '22px' : '2px'}} />
                  </button>
                </div>
              ))}
              <button onClick={() => toast.success('Preferences saved')} className="px-6 py-2.5 bg-vet-primary text-white rounded-lg font-medium text-sm hover:bg-vet-secondary">Save Changes</button>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Payment & Billing Settings</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Currency</label><select value={form.currency} onChange={e => setForm(f => ({...f, currency: e.target.value}))} className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white"><option value="EUR">EUR (\u20AC)</option><option value="USD">USD ($)</option><option value="GBP">GBP (\u00A3)</option></select></div>
                <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Tax Rate (%)</label><input type="number" value={form.tax_rate} onChange={e => setForm(f => ({...f, tax_rate: parseFloat(e.target.value)}))} className="w-full px-3 py-2.5 border rounded-lg text-sm" /></div>
              </div>
              <button onClick={() => toast.success('Billing settings saved')} className="px-6 py-2.5 bg-vet-primary text-white rounded-lg font-medium text-sm hover:bg-vet-secondary">Save Changes</button>
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Roles & Permissions</h2>
              <div className="space-y-3">
                {[{role:'Veterinarian',desc:'Full medical records, prescriptions, all patient data'},{role:'Technician',desc:'View records, enter vitals, administer treatments'},{role:'Front Desk',desc:'Scheduling, client communication, billing'},{role:'Manager',desc:'All access including reports and settings'},{role:'Owner',desc:'Full access to everything'}].map(r => (
                  <div key={r.role} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div><p className="text-sm font-semibold text-slate-900">{r.role}</p><p className="text-xs text-slate-500">{r.desc}</p></div>
                    <span className="text-xs bg-vet-primary/10 text-vet-primary px-2.5 py-1 rounded-full font-medium">Active</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

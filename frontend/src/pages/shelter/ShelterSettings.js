import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, Building2, Bell, Shield, Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { shelterAPI } from '@/api';

const TABS = [
  { key: 'shelter', label: 'Shelter Profile', icon: Building2 },
  { key: 'operations', label: 'Operations', icon: Clock },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'adoption', label: 'Adoption Settings', icon: Shield },
];

export default function ShelterSettings() {
  const { shelter, refreshShelter } = useAuth();
  const [activeTab, setActiveTab] = useState('shelter');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    shelter_name: shelter?.shelter_name || '',
    phone: shelter?.phone || '',
    email: shelter?.email || '',
    address: shelter?.address || '',
    operating_hours: shelter?.operating_hours || 'Mon-Sun 10am-6pm',
    description: shelter?.description || '',
    max_dogs: shelter?.capacity?.dogs?.max || 50,
    max_cats: shelter?.capacity?.cats?.max || 30,
    max_other: shelter?.capacity?.other?.max || 10,
    stray_hold_days: 5,
    application_sla_hours: 48,
    enable_auto_publish: true,
    enable_email_notifications: true,
    enable_capacity_alerts: true,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await shelterAPI.updateProfile({ shelter_name: form.shelter_name, phone: form.phone, email: form.email, address: form.address, description: form.description });
      await refreshShelter();
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
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={cn('w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left', activeTab === tab.key ? 'bg-shelter-primary text-white' : 'text-slate-600 hover:bg-slate-100')}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white rounded-xl border border-slate-200 p-6">
          {activeTab === 'shelter' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Shelter Profile</h2>
              <div className="space-y-3">
                <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Shelter Name</label><input value={form.shelter_name} onChange={e => setForm(f => ({...f, shelter_name: e.target.value}))} className="w-full px-3 py-2.5 border rounded-lg text-sm" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Phone</label><input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} className="w-full px-3 py-2.5 border rounded-lg text-sm" /></div>
                  <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Email</label><input value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className="w-full px-3 py-2.5 border rounded-lg text-sm" /></div>
                </div>
                <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Address</label><input value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} className="w-full px-3 py-2.5 border rounded-lg text-sm" /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Operating Hours</label><input value={form.operating_hours} onChange={e => setForm(f => ({...f, operating_hours: e.target.value}))} className="w-full px-3 py-2.5 border rounded-lg text-sm" /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Description</label><textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={3} className="w-full px-3 py-2.5 border rounded-lg text-sm resize-none" /></div>
              </div>
              <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-shelter-primary text-white rounded-lg font-medium text-sm hover:opacity-90 disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          )}

          {activeTab === 'operations' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Capacity & Operations</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Max Dogs</label><input type="number" value={form.max_dogs} onChange={e => setForm(f => ({...f, max_dogs: parseInt(e.target.value)}))} className="w-full px-3 py-2.5 border rounded-lg text-sm" /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Max Cats</label><input type="number" value={form.max_cats} onChange={e => setForm(f => ({...f, max_cats: parseInt(e.target.value)}))} className="w-full px-3 py-2.5 border rounded-lg text-sm" /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Max Other</label><input type="number" value={form.max_other} onChange={e => setForm(f => ({...f, max_other: parseInt(e.target.value)}))} className="w-full px-3 py-2.5 border rounded-lg text-sm" /></div>
              </div>
              <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Stray Hold Period (days)</label><input type="number" value={form.stray_hold_days} onChange={e => setForm(f => ({...f, stray_hold_days: parseInt(e.target.value)}))} className="w-full px-3 py-2.5 border rounded-lg text-sm max-w-xs" /></div>
              <button onClick={() => toast.success('Settings saved')} className="px-6 py-2.5 bg-shelter-primary text-white rounded-lg font-medium text-sm hover:opacity-90">Save Changes</button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
              {[{key:'enable_email_notifications',label:'Email Notifications'},{key:'enable_capacity_alerts',label:'Capacity Alerts'},{key:'enable_auto_publish',label:'Auto-publish Available Animals'}].map(n => (
                <div key={n.key} className="flex items-center justify-between py-3 border-b">
                  <span className="text-sm font-medium text-slate-700">{n.label}</span>
                  <button onClick={() => setForm(f => ({...f, [n.key]: !f[n.key]}))} className={cn('w-11 h-6 rounded-full transition-colors relative', form[n.key] ? 'bg-shelter-primary' : 'bg-slate-300')}>
                    <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform" style={{left: form[n.key] ? '22px' : '2px'}} />
                  </button>
                </div>
              ))}
              <button onClick={() => toast.success('Preferences saved')} className="px-6 py-2.5 bg-shelter-primary text-white rounded-lg font-medium text-sm hover:opacity-90">Save Changes</button>
            </div>
          )}

          {activeTab === 'adoption' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Adoption Settings</h2>
              <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Application SLA (hours)</label><input type="number" value={form.application_sla_hours} onChange={e => setForm(f => ({...f, application_sla_hours: parseInt(e.target.value)}))} className="w-full px-3 py-2.5 border rounded-lg text-sm max-w-xs" /></div>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">Pipeline SLAs</h3>
                {[{stage:'Submitted to Review',sla:'48 hours'},{stage:'Review to Interview',sla:'5 days'},{stage:'Interview to Home Check',sla:'7 days'},{stage:'Approved to Contact',sla:'24 hours'},{stage:'Total Processing',sla:'21 days'}].map(s => (
                  <div key={s.stage} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-700">{s.stage}</span>
                    <span className="text-sm font-medium text-slate-900">{s.sla}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => toast.success('Settings saved')} className="px-6 py-2.5 bg-shelter-primary text-white rounded-lg font-medium text-sm hover:opacity-90">Save Changes</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

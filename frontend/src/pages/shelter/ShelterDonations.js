import { useState, useEffect } from 'react';
import { shelterAPI } from '@/api';
import { DollarSign, Plus, Heart, TrendingUp, Users, Search, Gift, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import SlidePanel from '@/components/shared/SlidePanel';
import { FormInput, FormSelect, FormTextarea, FormRow } from '@/components/shared/FormField';

const DONOR_TIERS = [
  { key: 'supporter', label: 'Supporter', min: 0, icon: '\ud83d\udc9a' },
  { key: 'champion', label: 'Champion', min: 100, icon: '\ud83c\udfc6' },
  { key: 'hero', label: 'Hero', min: 500, icon: '\ud83e\uddb8' },
  { key: 'angel', label: 'Angel', min: 1000, icon: '\ud83d\udc7c' },
];

const EMPTY_DONATION = {
  donor_name: '', donor_email: '', amount: '', donation_type: 'one_time',
  payment_method: 'card', campaign_id: '', notes: '', is_anonymous: false,
};

export default function ShelterDonations() {
  const [donations, setDonations] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showCampaignCreate, setShowCampaignCreate] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_DONATION });
  const [campForm, setCampForm] = useState({ name: '', description: '', goal_amount: '', start_date: '', end_date: '', cover_image: '' });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      const [d, c] = await Promise.all([shelterAPI.getDonations(), shelterAPI.getCampaigns()]);
      setDonations(d.data); setCampaigns(c.data);
    } catch {} setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const totalDonated = donations.reduce((s, d) => s + (d.amount || 0), 0);
  const monthDonations = donations.filter(d => d.created_at && d.created_at.startsWith(new Date().toISOString().slice(0, 7)));
  const monthTotal = monthDonations.reduce((s, d) => s + (d.amount || 0), 0);
  const uniqueDonors = [...new Set(donations.map(d => d.donor_email).filter(Boolean))].length;

  const filtered = donations.filter(d => {
    if (!search) return true;
    return d.donor_name?.toLowerCase().includes(search.toLowerCase()) || d.donor_email?.toLowerCase().includes(search.toLowerCase());
  });

  const handleCreate = async () => {
    if (!form.donor_name || !form.amount) { toast.error('Name and amount required'); return; }
    setSaving(true);
    try {
      await shelterAPI.createDonation({ ...form, amount: parseFloat(form.amount) || 0 });
      toast.success('Donation recorded');
      setShowCreate(false); setForm({ ...EMPTY_DONATION }); fetchData();
    } catch { toast.error('Failed'); }
    setSaving(false);
  };

  const handleCampaignCreate = async () => {
    if (!campForm.name || !campForm.goal_amount) { toast.error('Name and goal required'); return; }
    setSaving(true);
    try {
      await shelterAPI.createCampaign({ ...campForm, goal_amount: parseFloat(campForm.goal_amount) || 0, status: 'active' });
      toast.success('Campaign created');
      setShowCampaignCreate(false); setCampForm({ name: '', description: '', goal_amount: '', start_date: '', end_date: '' }); fetchData();
    } catch { toast.error('Failed'); }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fundraising & Donations</h1>
          <p className="text-sm text-slate-500">{donations.length} donations recorded</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCampaignCreate(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-50">
            <Gift className="w-4 h-4" /> New Campaign
          </button>
          <button onClick={() => { setForm({ ...EMPTY_DONATION }); setShowCreate(true); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-shelter-primary text-white rounded-lg font-medium text-sm hover:opacity-90 shadow-sm">
            <Plus className="w-4 h-4" /> Record Donation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center"><DollarSign className="w-5 h-5 text-green-600" /></div>
          <div><p className="text-xl font-bold">\u20AC{totalDonated.toFixed(0)}</p><p className="text-xs text-slate-500">Total Raised</p></div>
        </div>
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-blue-600" /></div>
          <div><p className="text-xl font-bold">\u20AC{monthTotal.toFixed(0)}</p><p className="text-xs text-slate-500">This Month</p></div>
        </div>
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center"><Users className="w-5 h-5 text-purple-600" /></div>
          <div><p className="text-xl font-bold">{uniqueDonors}</p><p className="text-xs text-slate-500">Unique Donors</p></div>
        </div>
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"><Heart className="w-5 h-5 text-amber-600" /></div>
          <div><p className="text-xl font-bold">{campaigns.length}</p><p className="text-xs text-slate-500">Active Campaigns</p></div>
        </div>
      </div>

      {/* Campaigns */}
      {campaigns.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Campaigns</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map(c => {
              const raised = donations.filter(d => d.campaign_id === c.id).reduce((s, d) => s + (d.amount || 0), 0);
              const pct = c.goal_amount ? Math.min((raised / c.goal_amount) * 100, 100) : 0;
              return (
                <div key={c.id} className="bg-white rounded-xl border p-5">
                  <h3 className="font-semibold text-slate-900">{c.name}</h3>
                  {c.description && <p className="text-sm text-slate-500 mt-1">{c.description}</p>}
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">\u20AC{raised.toFixed(0)} raised</span>
                      <span className="text-slate-500">of \u20AC{(c.goal_amount || 0).toFixed(0)}</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-shelter-primary to-green-500 rounded-full transition-all" style={{width: `${pct}%`}} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{pct.toFixed(0)}% of goal</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Donations List */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search donors..." className="w-full pl-9 pr-4 py-2.5 bg-white border rounded-lg text-sm" />
      </div>

      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b"><tr>
            <th className="text-left px-5 py-3 font-semibold text-slate-600">Donor</th>
            <th className="text-right px-5 py-3 font-semibold text-slate-600">Amount</th>
            <th className="text-left px-5 py-3 font-semibold text-slate-600">Type</th>
            <th className="text-left px-5 py-3 font-semibold text-slate-600">Method</th>
            <th className="text-left px-5 py-3 font-semibold text-slate-600">Date</th>
          </tr></thead>
          <tbody className="divide-y">
            {filtered.map(d => (
              <tr key={d.id} className="hover:bg-slate-50">
                <td className="px-5 py-3"><p className="font-medium">{d.is_anonymous ? 'Anonymous' : d.donor_name}</p>{!d.is_anonymous && d.donor_email && <p className="text-xs text-slate-400">{d.donor_email}</p>}</td>
                <td className="px-5 py-3 text-right font-bold text-green-600">\u20AC{(d.amount || 0).toFixed(2)}</td>
                <td className="px-5 py-3"><span className="text-xs bg-slate-100 px-2 py-0.5 rounded capitalize">{d.donation_type?.replace('_', ' ') || 'one time'}</span></td>
                <td className="px-5 py-3 text-slate-500 text-xs capitalize">{d.payment_method || '-'}</td>
                <td className="px-5 py-3 text-slate-400 text-xs">{d.created_at ? new Date(d.created_at).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="py-16 text-center text-sm text-slate-400">No donations found</div>}
      </div>

      {/* Record Donation Panel */}
      <SlidePanel isOpen={showCreate} onClose={() => setShowCreate(false)} title="Record Donation">
        <div className="space-y-4">
          <FormInput label="Donor Name" required value={form.donor_name} onChange={e => setForm(f => ({...f, donor_name: e.target.value}))} />
          <FormInput label="Donor Email" type="email" value={form.donor_email} onChange={e => setForm(f => ({...f, donor_email: e.target.value}))} />
          <FormRow>
            <FormInput label="Amount (\u20AC)" required type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} />
            <FormSelect label="Type" options={[{value:'one_time',label:'One-Time'},{value:'recurring',label:'Recurring'},{value:'in_kind',label:'In-Kind'}]} value={form.donation_type} onChange={e => setForm(f => ({...f, donation_type: e.target.value}))} />
          </FormRow>
          <FormSelect label="Payment Method" options={[{value:'card',label:'Credit Card'},{value:'cash',label:'Cash'},{value:'check',label:'Check'},{value:'bank_transfer',label:'Bank Transfer'},{value:'online',label:'Online'}]} value={form.payment_method} onChange={e => setForm(f => ({...f, payment_method: e.target.value}))} />
          {campaigns.length > 0 && <FormSelect label="Campaign (optional)" options={[{value:'',label:'No campaign'}, ...campaigns.map(c => ({value:c.id,label:c.name}))]} value={form.campaign_id} onChange={e => setForm(f => ({...f, campaign_id: e.target.value}))} />}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_anonymous} onChange={e => setForm(f => ({...f, is_anonymous: e.target.checked}))} />Anonymous Donation</label>
          <FormTextarea label="Notes" rows={2} value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
          <div className="flex gap-3 pt-4 border-t">
            <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border hover:bg-slate-50">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-shelter-primary text-white hover:opacity-90 disabled:opacity-50">{saving ? 'Saving...' : 'Record Donation'}</button>
          </div>
        </div>
      </SlidePanel>

      {/* Campaign Panel */}
      <SlidePanel isOpen={showCampaignCreate} onClose={() => setShowCampaignCreate(false)} title="New Campaign">
        <div className="space-y-4">
          <FormInput label="Campaign Name" required value={campForm.name} onChange={e => setCampForm(f => ({...f, name: e.target.value}))} />
          <FormTextarea label="Description" rows={3} value={campForm.description} onChange={e => setCampForm(f => ({...f, description: e.target.value}))} />
          <FormInput label="Goal Amount (\u20AC)" required type="number" value={campForm.goal_amount} onChange={e => setCampForm(f => ({...f, goal_amount: e.target.value}))} />
          <FormRow>
            <FormInput label="Start Date" type="date" value={campForm.start_date} onChange={e => setCampForm(f => ({...f, start_date: e.target.value}))} />
            <FormInput label="End Date" type="date" value={campForm.end_date} onChange={e => setCampForm(f => ({...f, end_date: e.target.value}))} />
          </FormRow>
          <div className="flex gap-3 pt-4 border-t">
            <button onClick={() => setShowCampaignCreate(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border hover:bg-slate-50">Cancel</button>
            <button onClick={handleCampaignCreate} disabled={saving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-shelter-primary text-white hover:opacity-90 disabled:opacity-50">{saving ? 'Creating...' : 'Create Campaign'}</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}

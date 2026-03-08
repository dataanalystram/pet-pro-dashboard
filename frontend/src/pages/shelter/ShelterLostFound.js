import { useState, useEffect } from 'react';
import { shelterAPI } from '@/api';
import { Plus, Search, MapPin, Dog, Cat, Calendar, Phone, Mail, AlertCircle, CheckCircle, Eye, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import SlidePanel from '@/components/shared/SlidePanel';
import { FormInput, FormSelect, FormTextarea, FormRow } from '@/components/shared/FormField';

const STATUS_CONFIG = {
  active: { label: 'Active', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  matched: { label: 'Matched', color: 'bg-green-50 text-green-700 border-green-200' },
  resolved: { label: 'Resolved', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  expired: { label: 'Expired', color: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const EMPTY_FORM = {
  report_type: 'found', species: 'dog', breed: '', color: '', size: 'medium', sex: 'unknown',
  name: '', description: '', distinguishing_features: '', microchip_number: '', collar_description: '',
  last_seen_location: '', last_seen_address: '',
  reporter_name: '', reporter_phone: '', reporter_email: '',
};

export default function ShelterLostFound() {
  const [reports, setReports] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [showMatch, setShowMatch] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [matchForm, setMatchForm] = useState({ animal_id: '', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reportsRes, animalsRes] = await Promise.all([
        shelterAPI.getLostFound({}),
        shelterAPI.getAnimals({})
      ]);
      setReports(reportsRes.data || []);
      setAnimals(animalsRes.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.species || !form.reporter_name) { toast.error('Species and reporter name required'); return; }
    setSaving(true);
    try {
      await shelterAPI.createLostFound(form);
      toast.success('Report created');
      setShowCreate(false);
      setForm(EMPTY_FORM);
      fetchData();
    } catch (e) { toast.error('Failed'); }
    setSaving(false);
  };

  const handleResolve = async (reportId) => {
    if (!window.confirm('Mark this report as resolved?')) return;
    try {
      await shelterAPI.updateLostFound(reportId, { status: 'resolved' });
      toast.success('Report resolved');
      fetchData();
    } catch (e) { toast.error('Failed'); }
  };

  const handleMatch = async () => {
    if (!matchForm.animal_id) { toast.error('Select an animal to match'); return; }
    setSaving(true);
    try {
      await shelterAPI.matchLostFound(showMatch.id, matchForm);
      toast.success('Report matched to animal');
      setShowMatch(null);
      setMatchForm({ animal_id: '', notes: '' });
      fetchData();
    } catch (e) { toast.error('Failed'); }
    setSaving(false);
  };

  const filtered = reports.filter(r => {
    const matchSearch = !search || 
      r.species?.toLowerCase().includes(search.toLowerCase()) ||
      r.breed?.toLowerCase().includes(search.toLowerCase()) ||
      r.reporter_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.last_seen_location?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || r.report_type === typeFilter;
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const stats = {
    lost: reports.filter(r => r.report_type === 'lost' && r.status === 'active').length,
    found: reports.filter(r => r.report_type === 'found' && r.status === 'active').length,
    matched: reports.filter(r => r.status === 'matched').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lost & Found</h1>
          <p className="text-sm text-slate-500 mt-1">{stats.lost} lost · {stats.found} found · {stats.matched} matched</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-shelter-primary text-white rounded-lg font-medium text-sm hover:bg-shelter-secondary">
          <Plus className="w-4 h-4" /> New Report
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reports..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-shelter-primary/20" />
        </div>
        <div className="flex gap-2">
          {[{ key: 'all', label: 'All' }, { key: 'lost', label: 'Lost' }, { key: 'found', label: 'Found' }].map(t => (
            <button key={t.key} onClick={() => setTypeFilter(t.key)} className={cn('px-3 py-2 rounded-lg text-sm font-medium border', typeFilter === t.key ? 'bg-shelter-primary text-white border-shelter-primary' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50')}>
              {t.label}
            </button>
          ))}
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg text-sm border border-slate-200 bg-white">
            <option value="all">All Status</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-shelter-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(report => {
            const statusCfg = STATUS_CONFIG[report.status] || STATUS_CONFIG.active;
            const isLost = report.report_type === 'lost';
            return (
              <div key={report.id} className={cn('bg-white rounded-xl border-2 overflow-hidden', isLost ? 'border-red-200' : 'border-blue-200')}>
                <div className={cn('px-4 py-2 text-xs font-bold text-white flex items-center gap-2', isLost ? 'bg-red-500' : 'bg-blue-500')}>
                  <AlertCircle className="w-3.5 h-3.5" />
                  {isLost ? 'LOST PET' : 'FOUND PET'}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', report.species === 'cat' ? 'bg-purple-50' : 'bg-cyan-50')}>
                        {report.species === 'cat' ? <Cat className="w-6 h-6 text-purple-500" /> : <Dog className="w-6 h-6 text-cyan-500" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{report.breed || report.species}</h3>
                        <p className="text-sm text-slate-500">{report.color} · {report.size} · {report.sex}</p>
                      </div>
                    </div>
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium border', statusCfg.color)}>{statusCfg.label}</span>
                  </div>

                  {report.name && <p className="text-sm font-medium text-slate-700 mb-2">Name: {report.name}</p>}
                  {report.description && <p className="text-sm text-slate-600 mb-3 line-clamp-2">{report.description}</p>}

                  <div className="space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {report.last_seen_location || 'Location not specified'}</div>
                    <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> {report.last_seen_date ? new Date(report.last_seen_date).toLocaleDateString() : 'Date unknown'}</div>
                    <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {report.reporter_name} - {report.reporter_phone || report.reporter_email || 'No contact'}</div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                    <button onClick={() => setShowDetail(report)} className="flex-1 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 flex items-center justify-center gap-1">
                      <Eye className="w-3 h-3" /> View
                    </button>
                    {report.status === 'active' && (
                      <>
                        <button onClick={() => setShowMatch(report)} className="flex-1 px-3 py-2 text-xs font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 flex items-center justify-center gap-1">
                          <Link2 className="w-3 h-3" /> Match
                        </button>
                        <button onClick={() => handleResolve(report.id)} className="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {filtered.length === 0 && !loading && <div className="py-16 text-center text-sm text-slate-400 bg-white rounded-xl border">No reports found</div>}

      {/* Create Report Panel */}
      <SlidePanel isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Lost/Found Report" width="max-w-lg">
        <div className="space-y-4">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
            <button onClick={() => setForm(f => ({...f, report_type: 'lost'}))} className={cn('flex-1 py-2 rounded-md text-sm font-medium', form.report_type === 'lost' ? 'bg-red-500 text-white' : 'text-slate-600 hover:bg-white')}>Lost Pet</button>
            <button onClick={() => setForm(f => ({...f, report_type: 'found'}))} className={cn('flex-1 py-2 rounded-md text-sm font-medium', form.report_type === 'found' ? 'bg-blue-500 text-white' : 'text-slate-600 hover:bg-white')}>Found Pet</button>
          </div>
          
          <FormRow>
            <FormSelect label="Species" options={[{ value: 'dog', label: 'Dog' }, { value: 'cat', label: 'Cat' }, { value: 'other', label: 'Other' }]} value={form.species} onChange={e => setForm(f => ({...f, species: e.target.value}))} />
            <FormInput label="Breed" value={form.breed} onChange={e => setForm(f => ({...f, breed: e.target.value}))} />
          </FormRow>
          <FormRow>
            <FormInput label="Color" value={form.color} onChange={e => setForm(f => ({...f, color: e.target.value}))} />
            <FormSelect label="Size" options={[{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }]} value={form.size} onChange={e => setForm(f => ({...f, size: e.target.value}))} />
          </FormRow>
          <FormRow>
            <FormSelect label="Sex" options={[{ value: 'unknown', label: 'Unknown' }, { value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} value={form.sex} onChange={e => setForm(f => ({...f, sex: e.target.value}))} />
            <FormInput label="Name (if known)" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
          </FormRow>
          <FormTextarea label="Description" rows={2} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Physical description, behavior, etc." />
          <FormInput label="Distinguishing Features" value={form.distinguishing_features} onChange={e => setForm(f => ({...f, distinguishing_features: e.target.value}))} placeholder="Scars, markings, etc." />
          <FormRow>
            <FormInput label="Microchip #" value={form.microchip_number} onChange={e => setForm(f => ({...f, microchip_number: e.target.value}))} />
            <FormInput label="Collar Description" value={form.collar_description} onChange={e => setForm(f => ({...f, collar_description: e.target.value}))} />
          </FormRow>
          <FormInput label="Last Seen Location" value={form.last_seen_location} onChange={e => setForm(f => ({...f, last_seen_location: e.target.value}))} placeholder="Area, landmark, etc." />
          <FormInput label="Address" value={form.last_seen_address} onChange={e => setForm(f => ({...f, last_seen_address: e.target.value}))} />
          
          <div className="border-t pt-4 mt-4">
            <h4 className="font-medium text-sm text-slate-700 mb-3">Reporter Contact</h4>
            <FormInput label="Name" required value={form.reporter_name} onChange={e => setForm(f => ({...f, reporter_name: e.target.value}))} />
            <FormRow>
              <FormInput label="Phone" value={form.reporter_phone} onChange={e => setForm(f => ({...f, reporter_phone: e.target.value}))} />
              <FormInput label="Email" type="email" value={form.reporter_email} onChange={e => setForm(f => ({...f, reporter_email: e.target.value}))} />
            </FormRow>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border hover:bg-slate-50">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-shelter-primary text-white hover:opacity-90 disabled:opacity-50">{saving ? 'Creating...' : 'Create Report'}</button>
          </div>
        </div>
      </SlidePanel>

      {/* Detail Panel */}
      <SlidePanel isOpen={!!showDetail} onClose={() => setShowDetail(null)} title="Report Details" subtitle={showDetail?.report_type === 'lost' ? 'Lost Pet' : 'Found Pet'}>
        {showDetail && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg space-y-2">
              <p><strong>Species:</strong> {showDetail.species}</p>
              <p><strong>Breed:</strong> {showDetail.breed || 'Unknown'}</p>
              <p><strong>Color:</strong> {showDetail.color || 'Unknown'}</p>
              <p><strong>Size:</strong> {showDetail.size}</p>
              <p><strong>Sex:</strong> {showDetail.sex}</p>
              {showDetail.name && <p><strong>Name:</strong> {showDetail.name}</p>}
              {showDetail.microchip_number && <p><strong>Microchip:</strong> {showDetail.microchip_number}</p>}
            </div>
            {showDetail.description && <div className="p-4 bg-slate-50 rounded-lg"><p className="text-sm">{showDetail.description}</p></div>}
            <div className="p-4 bg-amber-50 rounded-lg">
              <h4 className="font-medium text-amber-800 mb-2">Last Seen</h4>
              <p className="text-sm text-amber-700">{showDetail.last_seen_location || 'Location not specified'}</p>
              {showDetail.last_seen_address && <p className="text-sm text-amber-700">{showDetail.last_seen_address}</p>}
              <p className="text-xs text-amber-600 mt-1">{showDetail.last_seen_date ? new Date(showDetail.last_seen_date).toLocaleDateString() : ''}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Reporter Contact</h4>
              <p className="text-sm text-blue-700">{showDetail.reporter_name}</p>
              {showDetail.reporter_phone && <p className="text-sm text-blue-700">{showDetail.reporter_phone}</p>}
              {showDetail.reporter_email && <p className="text-sm text-blue-700">{showDetail.reporter_email}</p>}
            </div>
          </div>
        )}
      </SlidePanel>

      {/* Match Panel */}
      <SlidePanel isOpen={!!showMatch} onClose={() => setShowMatch(null)} title="Match to Animal" subtitle={showMatch?.breed}>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Select an animal from your shelter to match with this report:</p>
          <FormSelect label="Animal" required options={[{ value: '', label: 'Select animal...' }, ...animals.filter(a => a.species === showMatch?.species && !a.outcome_date).map(a => ({ value: a.id, label: `${a.name} (${a.breed || a.species})` }))]} value={matchForm.animal_id} onChange={e => setMatchForm(f => ({...f, animal_id: e.target.value}))} />
          <FormTextarea label="Notes" rows={3} value={matchForm.notes} onChange={e => setMatchForm(f => ({...f, notes: e.target.value}))} placeholder="Any notes about the match..." />
          <div className="flex gap-3 pt-4 border-t">
            <button onClick={() => setShowMatch(null)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border hover:bg-slate-50">Cancel</button>
            <button onClick={handleMatch} disabled={saving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-green-500 text-white hover:bg-green-600 disabled:opacity-50">{saving ? 'Matching...' : 'Confirm Match'}</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}

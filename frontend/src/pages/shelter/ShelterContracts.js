import { useState, useEffect } from 'react';
import { shelterAPI } from '@/api';
import { Plus, FileText, Edit3, Trash2, Send, CheckCircle, PenTool, Eye, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import SlidePanel from '@/components/shared/SlidePanel';
import { FormInput, FormSelect, FormTextarea } from '@/components/shared/FormField';
import SignatureCanvas from 'react-signature-canvas';
import { useRef } from 'react';

const CONTRACT_TYPES = [
  { value: 'adoption', label: 'Adoption Agreement' },
  { value: 'foster', label: 'Foster Agreement' },
  { value: 'volunteer', label: 'Volunteer Agreement' },
  { value: 'surrender', label: 'Surrender Agreement' },
];

const DEFAULT_ADOPTION_CONTRACT = `ADOPTION AGREEMENT

This adoption agreement ("Agreement") is entered into between:

Shelter: {{shelter_name}}
Adopter: {{adopter_name}}
Animal: {{animal_name}} (ID: {{animal_id}})
Date: {{date}}

TERMS AND CONDITIONS:

1. The Adopter agrees to provide proper care, food, shelter, and veterinary attention for the adopted animal.

2. The Adopter agrees to keep current identification on the animal at all times.

3. The Adopter agrees not to sell, give away, or transfer ownership of the animal without prior written consent from the Shelter.

4. The Adopter understands that the Shelter may conduct follow-up visits to ensure the animal's welfare.

5. If for any reason the Adopter can no longer care for the animal, they agree to return the animal to the Shelter.

Adoption Fee: €{{adoption_fee}}

By signing below, both parties agree to the terms and conditions outlined in this Agreement.

_________________________
Adopter Signature

_________________________
Shelter Representative`;

export default function ShelterContracts() {
  const [templates, setTemplates] = useState([]);
  const [signedContracts, setSignedContracts] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [people, setPeople] = useState([]);
  const [activeTab, setActiveTab] = useState('templates');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showSign, setShowSign] = useState(null);
  const [showView, setShowView] = useState(null);
  const [form, setForm] = useState({ name: '', contract_type: 'adoption', content: DEFAULT_ADOPTION_CONTRACT });
  const [signForm, setSignForm] = useState({ contract_id: '', entity_type: 'animal', entity_id: '', signer_name: '', signer_email: '', signature_data: '' });
  const [saving, setSaving] = useState(false);
  const sigPad = useRef(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [templatesRes, signedRes, animalsRes, peopleRes] = await Promise.all([
        shelterAPI.getContracts(),
        shelterAPI.getSignedContracts({}),
        shelterAPI.getAnimals({}),
        shelterAPI.getPeople({})
      ]);
      setTemplates(templatesRes.data || []);
      setSignedContracts(signedRes.data || []);
      setAnimals(animalsRes.data || []);
      setPeople(peopleRes.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleCreateTemplate = async () => {
    if (!form.name || !form.content) { toast.error('Name and content required'); return; }
    setSaving(true);
    try {
      await shelterAPI.createContract(form);
      toast.success('Contract template created');
      setShowCreate(false);
      setForm({ name: '', contract_type: 'adoption', content: DEFAULT_ADOPTION_CONTRACT });
      fetchData();
    } catch (e) { toast.error('Failed'); }
    setSaving(false);
  };

  const handleSign = async () => {
    if (!signForm.signer_name || !signForm.signer_email) { toast.error('Signer info required'); return; }
    if (sigPad.current && sigPad.current.isEmpty()) { toast.error('Signature required'); return; }
    
    setSaving(true);
    try {
      const signatureData = sigPad.current ? sigPad.current.toDataURL() : '';
      
      // Fill in template variables
      const template = templates.find(t => t.id === signForm.contract_id);
      const animal = animals.find(a => a.id === signForm.entity_id);
      let filledContent = template?.content || '';
      filledContent = filledContent.replace(/{{adopter_name}}/g, signForm.signer_name);
      filledContent = filledContent.replace(/{{animal_name}}/g, animal?.name || '');
      filledContent = filledContent.replace(/{{animal_id}}/g, animal?.animal_id_code || '');
      filledContent = filledContent.replace(/{{adoption_fee}}/g, animal?.adoption_fee || '0');
      filledContent = filledContent.replace(/{{date}}/g, new Date().toLocaleDateString());
      filledContent = filledContent.replace(/{{shelter_name}}/g, 'Dublin Animal Rescue');

      await shelterAPI.signContract({
        ...signForm,
        signature_data: signatureData,
        filled_content: filledContent,
      });
      toast.success('Contract signed successfully!');
      setShowSign(null);
      setSignForm({ contract_id: '', entity_type: 'animal', entity_id: '', signer_name: '', signer_email: '', signature_data: '' });
      if (sigPad.current) sigPad.current.clear();
      fetchData();
    } catch (e) { toast.error('Failed to sign'); }
    setSaving(false);
  };

  const clearSignature = () => {
    if (sigPad.current) sigPad.current.clear();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">E-Contracts</h1>
          <p className="text-sm text-slate-500 mt-1">{templates.length} templates · {signedContracts.length} signed</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-shelter-primary text-white rounded-lg font-medium text-sm hover:bg-shelter-secondary">
          <Plus className="w-4 h-4" /> New Template
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
        <button onClick={() => setActiveTab('templates')} className={cn('flex-1 py-2 rounded-lg text-sm font-medium', activeTab === 'templates' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>Contract Templates</button>
        <button onClick={() => setActiveTab('signed')} className={cn('flex-1 py-2 rounded-lg text-sm font-medium', activeTab === 'signed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>Signed Contracts</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-shelter-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : activeTab === 'templates' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <div key={template.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{template.name}</h3>
                    <span className="text-xs text-slate-500 capitalize">{template.contract_type}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-500 line-clamp-3 mb-4">{template.content?.substring(0, 150)}...</p>
              <div className="flex gap-2">
                <button onClick={() => { setSignForm(f => ({...f, contract_id: template.id})); setShowSign(template); }} className="flex-1 px-3 py-2 text-xs font-medium text-white bg-shelter-primary rounded-lg hover:opacity-90 flex items-center justify-center gap-1">
                  <PenTool className="w-3 h-3" /> Sign Contract
                </button>
              </div>
            </div>
          ))}
          {templates.length === 0 && <div className="col-span-full py-16 text-center text-sm text-slate-400 bg-white rounded-xl border">No templates yet. Create one to get started.</div>}
        </div>
      ) : (
        <div className="space-y-3">
          {signedContracts.map(contract => (
            <div key={contract.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{contract.contract_name}</h3>
                    <p className="text-sm text-slate-500">Signed by {contract.signer_name} · {contract.signer_email}</p>
                    <p className="text-xs text-slate-400">{contract.signed_at ? new Date(contract.signed_at).toLocaleString() : ''}</p>
                  </div>
                </div>
                <button onClick={() => setShowView(contract)} className="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 flex items-center gap-1">
                  <Eye className="w-3 h-3" /> View
                </button>
              </div>
            </div>
          ))}
          {signedContracts.length === 0 && <div className="py-16 text-center text-sm text-slate-400 bg-white rounded-xl border">No signed contracts yet</div>}
        </div>
      )}

      {/* Create Template Panel */}
      <SlidePanel isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Contract Template" width="max-w-2xl">
        <div className="space-y-4">
          <FormInput label="Template Name" required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Standard Adoption Agreement" />
          <FormSelect label="Contract Type" options={CONTRACT_TYPES} value={form.contract_type} onChange={e => setForm(f => ({...f, contract_type: e.target.value}))} />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contract Content</label>
            <p className="text-xs text-slate-500 mb-2">Use variables: {'{{'}{'{'}adopter_name{'}'}{'}'}, {'{{'}{'{'}animal_name{'}'}{'}'}, {'{{'}{'{'}animal_id{'}'}{'}'}, {'{{'}{'{'}adoption_fee{'}'}{'}'}, {'{{'}{'{'}date{'}'}{'}'}, {'{{'}{'{'}shelter_name{'}'}{'}'}</p>
            <textarea value={form.content} onChange={e => setForm(f => ({...f, content: e.target.value}))} rows={15} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-shelter-primary/20" />
          </div>
          <div className="flex gap-3 pt-4 border-t">
            <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border hover:bg-slate-50">Cancel</button>
            <button onClick={handleCreateTemplate} disabled={saving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-shelter-primary text-white hover:opacity-90 disabled:opacity-50">{saving ? 'Creating...' : 'Create Template'}</button>
          </div>
        </div>
      </SlidePanel>

      {/* Sign Contract Panel */}
      <SlidePanel isOpen={!!showSign} onClose={() => { setShowSign(null); if (sigPad.current) sigPad.current.clear(); }} title="Sign Contract" subtitle={showSign?.name} width="max-w-xl">
        <div className="space-y-4">
          <FormSelect label="Animal (for adoption contracts)" options={[{ value: '', label: 'Select animal...' }, ...animals.filter(a => !a.outcome_date).map(a => ({ value: a.id, label: `${a.name} (${a.animal_id_code})` }))]} value={signForm.entity_id} onChange={e => setSignForm(f => ({...f, entity_id: e.target.value}))} />
          <FormInput label="Signer Name" required value={signForm.signer_name} onChange={e => setSignForm(f => ({...f, signer_name: e.target.value}))} placeholder="Full legal name" />
          <FormInput label="Signer Email" type="email" required value={signForm.signer_email} onChange={e => setSignForm(f => ({...f, signer_email: e.target.value}))} />
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Signature</label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg bg-white">
              <SignatureCanvas ref={sigPad} canvasProps={{ className: 'w-full h-40' }} backgroundColor="white" />
            </div>
            <button onClick={clearSignature} className="mt-2 text-xs text-slate-500 hover:text-slate-700">Clear signature</button>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg max-h-60 overflow-y-auto">
            <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans">{showSign?.content}</pre>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button onClick={() => setShowSign(null)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border hover:bg-slate-50">Cancel</button>
            <button onClick={handleSign} disabled={saving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-green-500 text-white hover:bg-green-600 disabled:opacity-50">{saving ? 'Signing...' : 'Sign Contract'}</button>
          </div>
        </div>
      </SlidePanel>

      {/* View Signed Contract Panel */}
      <SlidePanel isOpen={!!showView} onClose={() => setShowView(null)} title="Signed Contract" subtitle={showView?.contract_name} width="max-w-xl">
        {showView && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800"><strong>Signed by:</strong> {showView.signer_name}</p>
              <p className="text-sm text-green-800"><strong>Email:</strong> {showView.signer_email}</p>
              <p className="text-sm text-green-800"><strong>Date:</strong> {showView.signed_at ? new Date(showView.signed_at).toLocaleString() : ''}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg max-h-80 overflow-y-auto">
              <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">{showView.filled_content}</pre>
            </div>
            {showView.signature_data && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Signature</label>
                <img src={showView.signature_data} alt="Signature" className="border rounded-lg max-h-24" />
              </div>
            )}
          </div>
        )}
      </SlidePanel>
    </div>
  );
}

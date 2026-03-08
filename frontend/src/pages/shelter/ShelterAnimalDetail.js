import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { shelterAPI } from '@/api';
import { ArrowLeft, Dog, Cat, MapPin, Clock, Heart, Stethoscope, FileCheck, Calendar, Weight, Edit3, AlertCircle, Plus, Trash2, Download, FileText, MessageSquare, Paperclip, Home, Syringe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import SlidePanel from '@/components/shared/SlidePanel';
import { FormInput, FormSelect, FormTextarea, FormRow } from '@/components/shared/FormField';

const STATUS_CONFIG = {
  available: { label: 'Available', color: 'bg-green-50 text-green-700' },
  pending_application: { label: 'Pending Application', color: 'bg-amber-50 text-amber-700' },
  hold_behavioral: { label: 'Behavioral Hold', color: 'bg-red-50 text-red-700' },
  hold_medical: { label: 'Medical Hold', color: 'bg-orange-50 text-orange-700' },
  not_available: { label: 'Not Available', color: 'bg-slate-100 text-slate-600' },
  foster: { label: 'In Foster', color: 'bg-purple-50 text-purple-700' },
  adopted: { label: 'Adopted', color: 'bg-blue-50 text-blue-700' },
};

const TABS = [
  { key: 'overview', label: 'Overview', icon: FileText },
  { key: 'medical', label: 'Medical', icon: Stethoscope },
  { key: 'notes', label: 'Notes', icon: MessageSquare },
  { key: 'applications', label: 'Applications', icon: FileCheck },
];

const NOTE_TYPES = [
  { value: 'general', label: 'General' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'medical', label: 'Medical' },
  { value: 'foster', label: 'Foster Update' },
  { value: 'adoption', label: 'Adoption Interest' },
];

const MEDICAL_TYPES = [
  { value: 'vaccine', label: 'Vaccination' },
  { value: 'exam', label: 'Wellness Exam' },
  { value: 'surgery', label: 'Surgery' },
  { value: 'treatment', label: 'Treatment' },
  { value: 'medication', label: 'Medication' },
  { value: 'test', label: 'Lab Test' },
];

export default function ShelterAnimalDetail() {
  const { animalId } = useParams();
  const navigate = useNavigate();
  const [animal, setAnimal] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [showAddNote, setShowAddNote] = useState(false);
  const [showAddMedical, setShowAddMedical] = useState(false);
  const [showOutcome, setShowOutcome] = useState(false);
  const [noteForm, setNoteForm] = useState({ content: '', note_type: 'general' });
  const [medicalForm, setMedicalForm] = useState({ title: '', record_type: 'treatment', description: '', diagnosis: '', veterinarian_name: '', cost: '' });
  const [outcomeForm, setOutcomeForm] = useState({ outcome_type: 'adoption', adopter_name: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [animalRes, notesRes] = await Promise.all([
        shelterAPI.getAnimal(animalId),
        shelterAPI.getAnimalNotes(animalId)
      ]);
      setAnimal(animalRes.data);
      setNotes(notesRes.data || []);
      setLoading(false);
    } catch {
      setLoading(false);
      navigate('/shelter/animals');
    }
  };

  useEffect(() => { fetchData(); }, [animalId]);

  const updateStatus = async (newStatus) => {
    try {
      await shelterAPI.updateAnimal(animalId, { adoption_status: newStatus });
      const { data } = await shelterAPI.getAnimal(animalId);
      setAnimal(data);
      toast.success('Status updated');
    } catch { toast.error('Failed'); }
  };

  const handleAddNote = async () => {
    if (!noteForm.content.trim()) { toast.error('Note content required'); return; }
    setSaving(true);
    try {
      await shelterAPI.createAnimalNote(animalId, noteForm);
      toast.success('Note added');
      setShowAddNote(false);
      setNoteForm({ content: '', note_type: 'general' });
      const { data } = await shelterAPI.getAnimalNotes(animalId);
      setNotes(data || []);
    } catch { toast.error('Failed to add note'); }
    setSaving(false);
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await shelterAPI.deleteAnimalNote(animalId, noteId);
      toast.success('Note deleted');
      const { data } = await shelterAPI.getAnimalNotes(animalId);
      setNotes(data || []);
    } catch { toast.error('Failed'); }
  };

  const handleAddMedical = async () => {
    if (!medicalForm.title.trim()) { toast.error('Title required'); return; }
    setSaving(true);
    try {
      await shelterAPI.createMedical({ ...medicalForm, animal_id: animalId, cost: parseFloat(medicalForm.cost) || 0 });
      toast.success('Medical record added');
      setShowAddMedical(false);
      setMedicalForm({ title: '', record_type: 'treatment', description: '', diagnosis: '', veterinarian_name: '', cost: '' });
      fetchData();
    } catch { toast.error('Failed'); }
    setSaving(false);
  };

  const handleOutcome = async () => {
    if (!outcomeForm.outcome_type) { toast.error('Select outcome type'); return; }
    setSaving(true);
    try {
      await shelterAPI.createOutcome(animalId, outcomeForm);
      toast.success('Outcome recorded');
      setShowOutcome(false);
      fetchData();
    } catch { toast.error('Failed'); }
    setSaving(false);
  };

  const exportPDF = () => {
    // Generate printable HTML and open in new window
    const medRecords = animal.medical_records || [];
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${animal.name} - Animal Record</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 30px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .info-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e5e7eb; }
          .label { color: #6b7280; }
          .value { font-weight: 600; }
          .badges { display: flex; gap: 8px; flex-wrap: wrap; margin: 15px 0; }
          .badge { background: #d1fae5; color: #047857; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
          .medical-record { background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 10px; }
          .note { background: #fef3c7; padding: 10px; border-radius: 6px; margin-bottom: 8px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>${animal.name}</h1>
        <p style="color: #6b7280; margin-top: -10px;">ID: ${animal.animal_id_code || 'N/A'} | ${animal.species} | ${animal.breed || 'Unknown breed'}</p>
        
        <div class="badges">
          ${animal.good_with_dogs ? '<span class="badge">Good with dogs</span>' : ''}
          ${animal.good_with_cats ? '<span class="badge">Good with cats</span>' : ''}
          ${animal.good_with_children ? '<span class="badge">Good with children</span>' : ''}
          ${animal.house_trained ? '<span class="badge">House trained</span>' : ''}
        </div>

        <h2>Details</h2>
        <div class="info-grid">
          <div class="info-row"><span class="label">Sex</span><span class="value">${animal.sex || 'Unknown'}</span></div>
          <div class="info-row"><span class="label">Age</span><span class="value">${animal.estimated_age_months ? (animal.estimated_age_months >= 12 ? Math.floor(animal.estimated_age_months / 12) + ' years ' + (animal.estimated_age_months % 12) + ' months' : animal.estimated_age_months + ' months') : 'Unknown'}</span></div>
          <div class="info-row"><span class="label">Weight</span><span class="value">${animal.weight_kg ? animal.weight_kg + ' kg' : 'Unknown'}</span></div>
          <div class="info-row"><span class="label">Size</span><span class="value">${animal.size || 'Unknown'}</span></div>
          <div class="info-row"><span class="label">Color</span><span class="value">${animal.color || 'Unknown'}</span></div>
          <div class="info-row"><span class="label">Microchip</span><span class="value">${animal.microchip_number || 'None'}</span></div>
          <div class="info-row"><span class="label">Location</span><span class="value">${animal.current_location || 'N/A'}</span></div>
          <div class="info-row"><span class="label">Intake Date</span><span class="value">${animal.intake_date ? new Date(animal.intake_date).toLocaleDateString() : 'N/A'}</span></div>
          <div class="info-row"><span class="label">Intake Type</span><span class="value">${animal.intake_type?.replace(/_/g, ' ') || 'N/A'}</span></div>
          <div class="info-row"><span class="label">Spay/Neuter</span><span class="value">${animal.spay_neuter_status?.replace(/_/g, ' ') || 'Unknown'}</span></div>
          <div class="info-row"><span class="label">Vaccination</span><span class="value">${animal.vaccination_status || 'Unknown'}</span></div>
          <div class="info-row"><span class="label">Temperament</span><span class="value">${animal.temperament || 'N/A'}</span></div>
          <div class="info-row"><span class="label">Energy Level</span><span class="value">${animal.energy_level?.replace(/_/g, ' ') || 'N/A'}</span></div>
          <div class="info-row"><span class="label">Adoption Fee</span><span class="value">${animal.adoption_fee ? '€' + animal.adoption_fee : 'N/A'}</span></div>
        </div>

        ${animal.behavioral_notes ? `<h2>Behavioral Notes</h2><p>${animal.behavioral_notes}</p>` : ''}
        ${animal.ideal_home_description ? `<h2>Ideal Home</h2><p>${animal.ideal_home_description}</p>` : ''}

        <h2>Medical Records</h2>
        ${medRecords.length > 0 ? medRecords.map(r => `
          <div class="medical-record">
            <strong>${r.title}</strong> <span style="color:#6b7280">(${r.record_type?.replace(/_/g, ' ')})</span>
            <p>${r.description || ''}</p>
            ${r.diagnosis ? `<p><strong>Diagnosis:</strong> ${r.diagnosis}</p>` : ''}
            <p style="color:#9ca3af; font-size:12px">${r.created_at ? new Date(r.created_at).toLocaleDateString() : ''} ${r.veterinarian_name ? '• By ' + r.veterinarian_name : ''}</p>
          </div>
        `).join('') : '<p style="color:#9ca3af">No medical records</p>'}

        <h2>Notes</h2>
        ${notes.length > 0 ? notes.map(n => `
          <div class="note">
            <strong>${n.note_type?.replace(/_/g, ' ')}</strong>
            <p>${n.content}</p>
            <p style="color:#9ca3af; font-size:12px">${n.created_at ? new Date(n.created_at).toLocaleDateString() : ''} ${n.author_name ? '• By ' + n.author_name : ''}</p>
          </div>
        `).join('') : '<p style="color:#9ca3af">No notes</p>'}

        <div class="footer">
          <p>Generated on ${new Date().toLocaleDateString()} by Paw Paradise Shelter Management</p>
        </div>
      </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-shelter-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!animal) return null;

  const SpeciesIcon = animal.species === 'cat' ? Cat : Dog;
  const statusCfg = STATUS_CONFIG[animal.adoption_status] || STATUS_CONFIG.not_available;
  const medRecords = animal.medical_records || [];
  const applications = animal.applications || [];
  const ageText = animal.estimated_age_months ? (animal.estimated_age_months >= 12 ? `${Math.floor(animal.estimated_age_months / 12)}y ${animal.estimated_age_months % 12}m` : `${animal.estimated_age_months}m`) : 'Unknown';

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/shelter/animals')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft className="w-4 h-4" /> Back to Animals</button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-5">
          <div className={cn('w-24 h-24 rounded-2xl flex items-center justify-center flex-shrink-0', animal.species === 'cat' ? 'bg-purple-50' : 'bg-cyan-50')}>
            <SpeciesIcon className={cn('w-12 h-12', animal.species === 'cat' ? 'text-purple-400' : 'text-cyan-500')} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">{animal.name}</h1>
              <span className="text-sm text-slate-400 font-mono">{animal.animal_id_code}</span>
              <span className={cn('px-3 py-1 rounded-full text-xs font-semibold', statusCfg.color)}>{statusCfg.label}</span>
              {animal.featured && <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">★ Featured</span>}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-slate-500">
              <span>{animal.breed || animal.species}</span>
              <span className="capitalize">{animal.sex}</span>
              <span>{ageText}</span>
              {animal.weight_kg && <span className="flex items-center gap-1"><Weight className="w-3.5 h-3.5" />{animal.weight_kg}kg</span>}
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{animal.current_location}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{animal.days_in_shelter} days in shelter</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {animal.good_with_dogs && <Badge color="green">Good with dogs</Badge>}
              {animal.good_with_cats && <Badge color="green">Good with cats</Badge>}
              {animal.good_with_children && <Badge color="green">Good with children</Badge>}
              {animal.house_trained && <Badge color="blue">House trained</Badge>}
              {animal.good_with_dogs === false && <Badge color="red">Not dog-friendly</Badge>}
              {animal.good_with_cats === false && <Badge color="red">Not cat-friendly</Badge>}
            </div>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <select value={animal.adoption_status} onChange={e => updateStatus(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium">
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={exportPDF} className="flex-1 px-3 py-2 text-xs font-medium text-slate-600 bg-white border rounded-lg hover:bg-slate-50 flex items-center justify-center gap-1">
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
              {!animal.outcome_type && (
                <button onClick={() => setShowOutcome(true)} className="flex-1 px-3 py-2 text-xs font-medium text-white bg-shelter-primary rounded-lg hover:opacity-90 flex items-center justify-center gap-1">
                  <Home className="w-3.5 h-3.5" /> Outcome
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap', tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.key === 'notes' && notes.length > 0 && <span className="ml-1 text-xs bg-slate-200 px-1.5 py-0.5 rounded-full">{notes.length}</span>}
            {t.key === 'medical' && medRecords.length > 0 && <span className="ml-1 text-xs bg-slate-200 px-1.5 py-0.5 rounded-full">{medRecords.length}</span>}
            {t.key === 'applications' && applications.length > 0 && <span className="ml-1 text-xs bg-slate-200 px-1.5 py-0.5 rounded-full">{applications.length}</span>}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Animal Details</h3>
            <dl className="space-y-3 text-sm">
              <IRow label="Intake Type" value={animal.intake_type?.replace(/_/g, ' ')} />
              <IRow label="Intake Date" value={animal.intake_date ? new Date(animal.intake_date).toLocaleDateString() : null} />
              <IRow label="Intake Condition" value={animal.intake_condition} />
              <IRow label="Spay/Neuter" value={animal.spay_neuter_status?.replace(/_/g, ' ')} />
              <IRow label="Vaccination" value={animal.vaccination_status} />
              <IRow label="Microchip" value={animal.microchip_number} />
              <IRow label="Size" value={animal.size} />
              <IRow label="Color" value={animal.color} />
              <IRow label="Temperament" value={animal.temperament} />
              <IRow label="Energy Level" value={animal.energy_level?.replace(/_/g, ' ')} />
              <IRow label="Adoption Fee" value={animal.adoption_fee ? `€${animal.adoption_fee}` : null} />
            </dl>
          </div>
          <div className="space-y-6">
            {animal.behavioral_notes && <div className="bg-white rounded-xl border border-slate-200 p-5"><h3 className="text-base font-semibold text-slate-900 mb-2">Behavioral Notes</h3><p className="text-sm text-slate-600">{animal.behavioral_notes}</p></div>}
            {animal.ideal_home_description && <div className="bg-white rounded-xl border border-slate-200 p-5"><h3 className="text-base font-semibold text-slate-900 mb-2">Ideal Home</h3><p className="text-sm text-slate-600">{animal.ideal_home_description}</p></div>}
            {animal.intake_notes && <div className="bg-white rounded-xl border border-slate-200 p-5"><h3 className="text-base font-semibold text-slate-900 mb-2">Intake Notes</h3><p className="text-sm text-slate-600">{animal.intake_notes}</p></div>}
            {animal.outcome_type && (
              <div className="bg-green-50 rounded-xl border border-green-200 p-5">
                <h3 className="text-base font-semibold text-green-800 mb-2 flex items-center gap-2"><Home className="w-4 h-4" /> Outcome Recorded</h3>
                <p className="text-sm text-green-700">
                  <strong>{animal.outcome_type.replace(/_/g, ' ')}</strong>
                  {animal.adopter_name && ` to ${animal.adopter_name}`}
                  {animal.outcome_date && ` on ${new Date(animal.outcome_date).toLocaleDateString()}`}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'medical' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-900">Medical Records</h3>
            <button onClick={() => setShowAddMedical(true)} className="inline-flex items-center gap-2 px-3 py-2 bg-shelter-primary text-white rounded-lg text-sm font-medium hover:opacity-90">
              <Plus className="w-4 h-4" /> Add Record
            </button>
          </div>
          {medRecords.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-semibold text-slate-900">{r.title}</span>
                  <span className={cn('ml-2 text-xs px-2 py-0.5 rounded capitalize', 
                    r.record_type === 'vaccine' ? 'bg-blue-50 text-blue-700' : 
                    r.record_type === 'surgery' ? 'bg-red-50 text-red-700' : 
                    'bg-slate-100 text-slate-600'
                  )}>{r.record_type?.replace(/_/g, ' ')}</span>
                </div>
                <span className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-slate-600 mt-2">{r.description}</p>
              {r.diagnosis && <p className="text-sm text-slate-500 mt-1"><strong>Diagnosis:</strong> {r.diagnosis}</p>}
              {r.next_due_date && <p className="text-sm text-amber-600 mt-1 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Due: {new Date(r.next_due_date).toLocaleDateString()}</p>}
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                {r.veterinarian_name && <span>By {r.veterinarian_name}</span>}
                {r.cost > 0 && <span>• €{r.cost.toFixed(2)}</span>}
              </div>
            </div>
          ))}
          {medRecords.length === 0 && <div className="py-16 text-center text-sm text-slate-400 bg-white rounded-xl border">No medical records yet</div>}
        </div>
      )}

      {tab === 'notes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-900">Notes & Updates</h3>
            <button onClick={() => setShowAddNote(true)} className="inline-flex items-center gap-2 px-3 py-2 bg-shelter-primary text-white rounded-lg text-sm font-medium hover:opacity-90">
              <Plus className="w-4 h-4" /> Add Note
            </button>
          </div>
          {notes.map(n => (
            <div key={n.id} className={cn('bg-white rounded-xl border border-slate-200 p-5', 
              n.note_type === 'behavioral' && 'border-l-4 border-l-amber-400',
              n.note_type === 'medical' && 'border-l-4 border-l-red-400',
              n.note_type === 'foster' && 'border-l-4 border-l-purple-400',
              n.note_type === 'adoption' && 'border-l-4 border-l-green-400'
            )}>
              <div className="flex items-start justify-between">
                <div>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium capitalize',
                    n.note_type === 'general' && 'bg-slate-100 text-slate-600',
                    n.note_type === 'behavioral' && 'bg-amber-100 text-amber-700',
                    n.note_type === 'medical' && 'bg-red-100 text-red-700',
                    n.note_type === 'foster' && 'bg-purple-100 text-purple-700',
                    n.note_type === 'adoption' && 'bg-green-100 text-green-700'
                  )}>{n.note_type?.replace(/_/g, ' ')}</span>
                </div>
                <button onClick={() => handleDeleteNote(n.id)} className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-slate-700 mt-3 whitespace-pre-wrap">{n.content}</p>
              <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                <span>{n.author_name || n.author || 'Staff'}</span>
                <span>•</span>
                <span>{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</span>
              </div>
            </div>
          ))}
          {notes.length === 0 && <div className="py-16 text-center text-sm text-slate-400 bg-white rounded-xl border">No notes yet. Click "Add Note" to create one.</div>}
        </div>
      )}

      {tab === 'applications' && (
        <div className="space-y-4">
          {applications.map(app => (
            <div key={app.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <div><p className="font-semibold text-slate-900">{app.applicant_name}</p><p className="text-sm text-slate-500">{app.applicant_email} · {app.applicant_phone}</p></div>
                <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium capitalize', app.status === 'approved' ? 'bg-green-50 text-green-700' : app.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700')}>{app.status?.replace(/_/g, ' ')}</span>
              </div>
              <div className="mt-2 text-sm text-slate-500">
                <span>{app.housing_type}</span>
                {app.has_yard && <span> · Has yard</span>}
                {app.yard_fenced && <span> (fenced)</span>}
              </div>
              <p className="mt-2 text-xs text-slate-400">{app.created_at ? `Applied ${new Date(app.created_at).toLocaleDateString()}` : ''}</p>
            </div>
          ))}
          {applications.length === 0 && <div className="py-16 text-center text-sm text-slate-400 bg-white rounded-xl border">No applications for this animal</div>}
        </div>
      )}

      {/* Add Note Panel */}
      <SlidePanel isOpen={showAddNote} onClose={() => setShowAddNote(false)} title="Add Note" subtitle={animal.name}>
        <div className="space-y-4">
          <FormSelect label="Note Type" options={NOTE_TYPES} value={noteForm.note_type} onChange={e => setNoteForm(f => ({...f, note_type: e.target.value}))} />
          <FormTextarea label="Note" required rows={5} value={noteForm.content} onChange={e => setNoteForm(f => ({...f, content: e.target.value}))} placeholder="Enter your note..." />
          <div className="flex gap-3 pt-4 border-t">
            <button onClick={() => setShowAddNote(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border hover:bg-slate-50">Cancel</button>
            <button onClick={handleAddNote} disabled={saving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-shelter-primary text-white hover:opacity-90 disabled:opacity-50">{saving ? 'Saving...' : 'Save Note'}</button>
          </div>
        </div>
      </SlidePanel>

      {/* Add Medical Panel */}
      <SlidePanel isOpen={showAddMedical} onClose={() => setShowAddMedical(false)} title="Add Medical Record" subtitle={animal.name}>
        <div className="space-y-4">
          <FormInput label="Title" required value={medicalForm.title} onChange={e => setMedicalForm(f => ({...f, title: e.target.value}))} placeholder="e.g. Rabies Vaccination" />
          <FormSelect label="Record Type" options={MEDICAL_TYPES} value={medicalForm.record_type} onChange={e => setMedicalForm(f => ({...f, record_type: e.target.value}))} />
          <FormTextarea label="Description" rows={3} value={medicalForm.description} onChange={e => setMedicalForm(f => ({...f, description: e.target.value}))} />
          <FormInput label="Diagnosis" value={medicalForm.diagnosis} onChange={e => setMedicalForm(f => ({...f, diagnosis: e.target.value}))} />
          <FormRow>
            <FormInput label="Veterinarian" value={medicalForm.veterinarian_name} onChange={e => setMedicalForm(f => ({...f, veterinarian_name: e.target.value}))} />
            <FormInput label="Cost (€)" type="number" step="0.01" value={medicalForm.cost} onChange={e => setMedicalForm(f => ({...f, cost: e.target.value}))} />
          </FormRow>
          <div className="flex gap-3 pt-4 border-t">
            <button onClick={() => setShowAddMedical(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border hover:bg-slate-50">Cancel</button>
            <button onClick={handleAddMedical} disabled={saving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-shelter-primary text-white hover:opacity-90 disabled:opacity-50">{saving ? 'Saving...' : 'Save Record'}</button>
          </div>
        </div>
      </SlidePanel>

      {/* Outcome Panel */}
      <SlidePanel isOpen={showOutcome} onClose={() => setShowOutcome(false)} title="Record Outcome" subtitle={animal.name}>
        <div className="space-y-4">
          <FormSelect label="Outcome Type" required options={[
            {value: 'adoption', label: 'Adoption'},
            {value: 'transfer', label: 'Transfer to another org'},
            {value: 'return_to_owner', label: 'Return to Owner'},
            {value: 'foster', label: 'Foster'},
            {value: 'euthanasia', label: 'Euthanasia'},
            {value: 'died_in_care', label: 'Died in Care'},
          ]} value={outcomeForm.outcome_type} onChange={e => setOutcomeForm(f => ({...f, outcome_type: e.target.value}))} />
          {(outcomeForm.outcome_type === 'adoption' || outcomeForm.outcome_type === 'return_to_owner') && (
            <FormInput label="Adopter/Owner Name" value={outcomeForm.adopter_name} onChange={e => setOutcomeForm(f => ({...f, adopter_name: e.target.value}))} />
          )}
          <FormTextarea label="Notes" rows={3} value={outcomeForm.notes} onChange={e => setOutcomeForm(f => ({...f, notes: e.target.value}))} />
          <div className="flex gap-3 pt-4 border-t">
            <button onClick={() => setShowOutcome(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border hover:bg-slate-50">Cancel</button>
            <button onClick={handleOutcome} disabled={saving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-shelter-primary text-white hover:opacity-90 disabled:opacity-50">{saving ? 'Saving...' : 'Record Outcome'}</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}

function IRow({ label, value }) {
  if (!value) return null;
  return <div className="flex justify-between"><dt className="text-slate-500">{label}</dt><dd className="font-medium text-slate-900 capitalize">{value}</dd></div>;
}

function Badge({ children, color }) {
  const colors = { green: 'bg-green-50 text-green-700', red: 'bg-red-50 text-red-700', blue: 'bg-blue-50 text-blue-700', amber: 'bg-amber-50 text-amber-700' };
  return <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', colors[color] || colors.green)}>{children}</span>;
}

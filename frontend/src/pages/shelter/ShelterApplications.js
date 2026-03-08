import { useState, useEffect, useCallback } from 'react';
import { shelterAPI } from '@/api';
import { FileCheck, ChevronRight, User, Home, PawPrint, Plus, GripVertical, Eye, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { DndContext, closestCenter, DragOverlay, useDroppable, useDraggable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import SlidePanel from '@/components/shared/SlidePanel';
import { FormInput, FormSelect, FormTextarea, FormRow } from '@/components/shared/FormField';

const PIPELINE_STAGES = [
  { key: 'submitted', label: 'Submitted', color: 'bg-blue-500', bg: 'bg-blue-50' },
  { key: 'under_review', label: 'Under Review', color: 'bg-amber-500', bg: 'bg-amber-50' },
  { key: 'interview_completed', label: 'Interview', color: 'bg-purple-500', bg: 'bg-purple-50' },
  { key: 'home_check_scheduled', label: 'Home Check', color: 'bg-cyan-500', bg: 'bg-cyan-50' },
  { key: 'approved', label: 'Approved', color: 'bg-green-500', bg: 'bg-green-50' },
  { key: 'completed', label: 'Completed', color: 'bg-emerald-600', bg: 'bg-emerald-50' },
];

const EMPTY_APP = {
  animal_id: '', applicant_name: '', applicant_email: '', applicant_phone: '',
  housing_type: 'house', has_yard: false, has_fence: false, other_pets: '',
  household_members: '', experience: '', daily_schedule: '', reason: '', notes: '',
};

function DraggableCard({ app, onView }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: app.id });
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)`, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 1000 : 1 } : undefined;

  return (
    <div ref={setNodeRef} style={style} className={cn('bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow', isDragging && 'shadow-lg')}>
      <div className="flex items-start gap-2">
        <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing mt-1 text-slate-300 hover:text-slate-500">
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-shelter-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-shelter-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{app.applicant_name}</p>
              <p className="text-xs text-slate-400 truncate">{app.applicant_email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-2 text-xs text-slate-500">
            <PawPrint className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-medium truncate">{app.animal_name}</span>
            {app.animal_species && <span className="truncate">{app.animal_species}</span>}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
            {app.housing_type && <span className="flex items-center gap-1"><Home className="w-3 h-3" />{app.housing_type}</span>}
            {app.has_yard && <span className="text-green-600 bg-green-50 px-1.5 py-0.5 rounded">Yard</span>}
            {app.has_fence && <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Fenced</span>}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-400">{app.created_at ? new Date(app.created_at).toLocaleDateString() : ''}</span>
            <button onClick={() => onView(app)} className="text-xs text-shelter-primary hover:underline flex items-center gap-1"><Eye className="w-3 h-3" />View</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DroppableColumn({ stage, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.key });
  return (
    <div ref={setNodeRef} className={cn('flex-1 min-w-[220px] transition-colors rounded-xl', isOver && 'ring-2 ring-shelter-primary/40')}>
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={cn('w-3 h-3 rounded-full', stage.color)} />
        <span className="text-sm font-semibold text-slate-700">{stage.label}</span>
        <span className="ml-auto text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{children?.length || 0}</span>
      </div>
      <div className={cn('space-y-3 min-h-[200px] p-2 rounded-xl border-2 border-dashed transition-colors', isOver ? 'border-shelter-primary/40 bg-shelter-primary/5' : 'border-slate-200 bg-slate-50/50')}>
        {children}
        {(!children || children.length === 0) && <div className="flex items-center justify-center h-24 text-xs text-slate-400">Drop here</div>}
      </div>
    </div>
  );
}

export default function ShelterApplications() {
  const [applications, setApplications] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_APP });
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [view, setView] = useState('kanban');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      const [a, an] = await Promise.all([shelterAPI.getApplications({}), shelterAPI.getAnimals({})]);
      setApplications(a.data); setAnimals(an.data);
    } catch {} setLoading(false);
  }, []);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const app = applications.find(a => a.id === active.id);
    if (!app || app.status === over.id) return;
    // Optimistic update
    setApplications(prev => prev.map(a => a.id === active.id ? { ...a, status: over.id } : a));
    try {
      await shelterAPI.updateApplication(active.id, { status: over.id });
      toast.success(`Moved to ${over.id.replace(/_/g, ' ')}`);
    } catch {
      toast.error('Failed to update');
      fetchApps();
    }
  };

  const handleCreate = async () => {
    if (!form.animal_id || !form.applicant_name || !form.applicant_email) { toast.error('Fill in required fields'); return; }
    setSaving(true);
    try {
      await shelterAPI.createApplication({ ...form, status: 'submitted' });
      toast.success('Application submitted');
      setShowCreate(false); setForm({ ...EMPTY_APP }); fetchApps();
    } catch { toast.error('Failed'); }
    setSaving(false);
  };

  const activeApp = activeId ? applications.find(a => a.id === activeId) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Adoption Applications</h1>
          <p className="text-sm text-slate-500">{applications.length} total · Drag cards between stages</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button onClick={() => setView('kanban')} className={cn('px-3 py-1.5 rounded-md text-xs font-medium', view === 'kanban' ? 'bg-white shadow text-slate-900' : 'text-slate-500')}>Kanban</button>
            <button onClick={() => setView('list')} className={cn('px-3 py-1.5 rounded-md text-xs font-medium', view === 'list' ? 'bg-white shadow text-slate-900' : 'text-slate-500')}>List</button>
          </div>
          <button onClick={() => { setForm({ ...EMPTY_APP }); setShowCreate(true); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-shelter-primary text-white rounded-lg font-medium text-sm hover:opacity-90 shadow-sm">
            <Plus className="w-4 h-4" /> New Application
          </button>
        </div>
      </div>

      {/* Pipeline Stats */}
      <div className="flex gap-2 flex-wrap">
        {PIPELINE_STAGES.map(stage => {
          const count = applications.filter(a => a.status === stage.key).length;
          return (
            <span key={stage.key} className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold', stage.bg, 'text-slate-700')}>
              <span className={cn('w-2 h-2 rounded-full', stage.color)} />
              {stage.label}: {count}
            </span>
          );
        })}
      </div>

      {view === 'kanban' ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-[1200px]">
              {PIPELINE_STAGES.map(stage => {
                const stageApps = applications.filter(a => a.status === stage.key);
                return (
                  <DroppableColumn key={stage.key} stage={stage}>
                    {stageApps.map(app => (
                      <DraggableCard key={app.id} app={app} onView={setShowDetail} />
                    ))}
                  </DroppableColumn>
                );
              })}
            </div>
          </div>
          <DragOverlay>
            {activeApp && (
              <div className="bg-white rounded-xl border-2 border-shelter-primary shadow-2xl p-4 w-[220px] opacity-90">
                <p className="font-semibold text-sm">{activeApp.applicant_name}</p>
                <p className="text-xs text-slate-500">{activeApp.animal_name}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="bg-white rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b"><tr>
              <th className="text-left px-5 py-3 font-semibold text-slate-600">Applicant</th>
              <th className="text-left px-5 py-3 font-semibold text-slate-600">Animal</th>
              <th className="text-left px-5 py-3 font-semibold text-slate-600">Housing</th>
              <th className="text-left px-5 py-3 font-semibold text-slate-600">Status</th>
              <th className="text-left px-5 py-3 font-semibold text-slate-600">Date</th>
              <th className="text-right px-5 py-3 font-semibold text-slate-600">Actions</th>
            </tr></thead>
            <tbody className="divide-y">
              {applications.map(app => (
                <tr key={app.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3"><p className="font-medium">{app.applicant_name}</p><p className="text-xs text-slate-400">{app.applicant_email}</p></td>
                  <td className="px-5 py-3 text-slate-600">{app.animal_name}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{app.housing_type}{app.has_yard ? ' + yard' : ''}</td>
                  <td className="px-5 py-3">
                    {(() => { const s = PIPELINE_STAGES.find(s => s.key === app.status); return s ? <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', s.bg)}>{s.label}</span> : app.status; })()}
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{app.created_at ? new Date(app.created_at).toLocaleDateString() : '-'}</td>
                  <td className="px-5 py-3 text-right"><button onClick={() => setShowDetail(app)} className="text-xs text-shelter-primary hover:underline">View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Application Panel */}
      <SlidePanel isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Application" subtitle="Submit an adoption application" width="max-w-xl">
        <div className="space-y-4">
          <FormSelect label="Animal" required options={[{value:'',label:'Select animal...'}, ...animals.filter(a => a.status === 'available').map(a => ({value: a.id, label: `${a.name} (${a.species} - ${a.breed || ''})`}))]} value={form.animal_id} onChange={e => setForm(f => ({...f, animal_id: e.target.value}))} />
          <FormInput label="Applicant Name" required value={form.applicant_name} onChange={e => setForm(f => ({...f, applicant_name: e.target.value}))} />
          <FormRow>
            <FormInput label="Email" required type="email" value={form.applicant_email} onChange={e => setForm(f => ({...f, applicant_email: e.target.value}))} />
            <FormInput label="Phone" value={form.applicant_phone} onChange={e => setForm(f => ({...f, applicant_phone: e.target.value}))} />
          </FormRow>
          <FormRow>
            <FormSelect label="Housing Type" options={[{value:'house',label:'House'},{value:'apartment',label:'Apartment'},{value:'condo',label:'Condo'},{value:'farm',label:'Farm'}]} value={form.housing_type} onChange={e => setForm(f => ({...f, housing_type: e.target.value}))} />
            <div className="flex gap-4 items-end pb-1">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.has_yard} onChange={e => setForm(f => ({...f, has_yard: e.target.checked}))} />Yard</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.has_fence} onChange={e => setForm(f => ({...f, has_fence: e.target.checked}))} />Fenced</label>
            </div>
          </FormRow>
          <FormInput label="Other Pets" value={form.other_pets} onChange={e => setForm(f => ({...f, other_pets: e.target.value}))} placeholder="Describe other pets in household" />
          <FormInput label="Household Members" value={form.household_members} onChange={e => setForm(f => ({...f, household_members: e.target.value}))} placeholder="Adults, children, ages" />
          <FormTextarea label="Pet Experience" rows={2} value={form.experience} onChange={e => setForm(f => ({...f, experience: e.target.value}))} />
          <FormTextarea label="Reason for Adoption" rows={2} value={form.reason} onChange={e => setForm(f => ({...f, reason: e.target.value}))} />
          <div className="flex gap-3 pt-4 border-t">
            <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border hover:bg-slate-50">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-shelter-primary text-white hover:opacity-90 disabled:opacity-50">{saving ? 'Submitting...' : 'Submit Application'}</button>
          </div>
        </div>
      </SlidePanel>

      {/* Detail Panel */}
      <SlidePanel isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={showDetail?.applicant_name || ''} subtitle="Application Details" width="max-w-xl">
        {showDetail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-500">Email:</span> <span className="font-medium">{showDetail.applicant_email}</span></div>
              <div><span className="text-slate-500">Phone:</span> <span className="font-medium">{showDetail.applicant_phone || '-'}</span></div>
              <div><span className="text-slate-500">Animal:</span> <span className="font-medium">{showDetail.animal_name}</span></div>
              <div><span className="text-slate-500">Housing:</span> <span className="font-medium">{showDetail.housing_type}</span></div>
              <div><span className="text-slate-500">Yard:</span> <span className="font-medium">{showDetail.has_yard ? 'Yes' : 'No'}</span></div>
              <div><span className="text-slate-500">Fenced:</span> <span className="font-medium">{showDetail.has_fence ? 'Yes' : 'No'}</span></div>
            </div>
            {showDetail.experience && <div><h4 className="text-sm font-semibold text-slate-700">Experience</h4><p className="text-sm text-slate-600">{showDetail.experience}</p></div>}
            {showDetail.reason && <div><h4 className="text-sm font-semibold text-slate-700">Reason</h4><p className="text-sm text-slate-600">{showDetail.reason}</p></div>}
            <div className="border-t pt-3">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Move to Stage</h4>
              <div className="flex flex-wrap gap-2">
                {PIPELINE_STAGES.map(stage => (
                  <button key={stage.key} disabled={showDetail.status === stage.key} onClick={async () => {
                    try { await shelterAPI.updateApplication(showDetail.id, { status: stage.key }); toast.success('Updated'); setShowDetail(null); fetchApps(); } catch { toast.error('Failed'); }
                  }} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border', showDetail.status === stage.key ? 'bg-shelter-primary text-white' : 'bg-white hover:bg-slate-50 text-slate-600')}>{stage.label}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </SlidePanel>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { shelterAPI } from '@/api';
import { CheckCircle, Circle, Plus, Clock, AlertTriangle, Filter, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import SlidePanel from '@/components/shared/SlidePanel';
import { FormInput, FormSelect, FormTextarea, FormRow } from '@/components/shared/FormField';

const TASK_CATEGORIES = [
  { key: 'feeding', label: 'Feeding', icon: '\ud83c\udf56', color: 'bg-amber-100 text-amber-700' },
  { key: 'cleaning', label: 'Cleaning', icon: '\ud83e\uddf9', color: 'bg-blue-100 text-blue-700' },
  { key: 'medical', label: 'Medical', icon: '\ud83d\udc8a', color: 'bg-red-100 text-red-700' },
  { key: 'safety', label: 'Safety', icon: '\ud83d\udd12', color: 'bg-green-100 text-green-700' },
  { key: 'admin', label: 'Admin', icon: '\ud83d\udccb', color: 'bg-purple-100 text-purple-700' },
  { key: 'enrichment', label: 'Enrichment', icon: '\ud83c\udfbe', color: 'bg-cyan-100 text-cyan-700' },
  { key: 'other', label: 'Other', icon: '\ud83d\udce6', color: 'bg-slate-100 text-slate-700' },
];

const PRIORITY_COLORS = { critical: 'text-red-600 bg-red-50 border-red-200', high: 'text-orange-600 bg-orange-50 border-orange-200', normal: 'text-slate-600 bg-slate-50 border-slate-200' };

const EMPTY_TASK = {
  title: '', category: 'other', priority: 'normal', assigned_to: '',
  due_time: '', description: '', is_recurring: false, recurrence: 'daily',
};

export default function ShelterDailyOps() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_TASK });
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchTasks = async () => {
    setLoading(true);
    try { const { data } = await shelterAPI.getTasks({ date: selectedDate }); setTasks(data); }
    catch {} setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, [selectedDate]);

  const toggleComplete = async (task) => {
    try {
      await shelterAPI.updateTask(task.id, { status: task.status === 'completed' ? 'pending' : 'completed', completed_at: task.status === 'completed' ? null : new Date().toISOString() });
      toast.success(task.status === 'completed' ? 'Reopened' : 'Completed!');
      fetchTasks();
    } catch { toast.error('Failed'); }
  };

  const handleCreate = async () => {
    if (!form.title) { toast.error('Title required'); return; }
    setSaving(true);
    try {
      await shelterAPI.createTask({ ...form, status: 'pending', task_date: selectedDate });
      toast.success('Task created');
      setShowCreate(false); setForm({ ...EMPTY_TASK }); fetchTasks();
    } catch { toast.error('Failed'); }
    setSaving(false);
  };

  const completed = tasks.filter(t => t.status === 'completed').length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const grouped = TASK_CATEGORIES.map(cat => ({
    ...cat,
    tasks: tasks.filter(t => t.category === cat.key && (filterCat === 'all' || t.category === filterCat)),
  })).filter(g => filterCat === 'all' ? g.tasks.length > 0 : g.key === filterCat);

  const ungrouped = tasks.filter(t => !TASK_CATEGORIES.some(c => c.key === t.category) && (filterCat === 'all'));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Daily Operations</h1>
          <p className="text-sm text-slate-500">{new Date(selectedDate + 'T12:00').toLocaleDateString('en-IE', {weekday:'long', day:'numeric', month:'long'})}</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
          <button onClick={() => { setForm({ ...EMPTY_TASK }); setShowCreate(true); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-shelter-primary text-white rounded-lg font-medium text-sm hover:opacity-90 shadow-sm">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-shelter-primary" />
            <span className="font-semibold text-slate-900">{completed} of {total} tasks completed</span>
          </div>
          <span className="text-sm font-bold" style={{color: pct === 100 ? '#059669' : pct > 50 ? '#D97706' : '#DC2626'}}>{pct}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{width:`${pct}%`, backgroundColor: pct === 100 ? '#059669' : pct > 50 ? '#D97706' : '#0891B2'}} />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterCat('all')} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium', filterCat === 'all' ? 'bg-shelter-primary text-white' : 'bg-white border text-slate-600 hover:bg-slate-50')}>All</button>
        {TASK_CATEGORIES.map(cat => (
          <button key={cat.key} onClick={() => setFilterCat(cat.key)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium', filterCat === cat.key ? 'bg-shelter-primary text-white' : 'bg-white border text-slate-600 hover:bg-slate-50')}>
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Task Groups */}
      <div className="space-y-4">
        {grouped.map(group => (
          <div key={group.key}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{group.icon}</span>
              <span className="text-sm font-semibold text-slate-700">{group.label}</span>
              <span className="text-xs text-slate-400">{group.tasks.filter(t=>t.status==='completed').length}/{group.tasks.length}</span>
            </div>
            <div className="space-y-2">
              {group.tasks.map(task => (
                <div key={task.id} className={cn('flex items-center gap-3 bg-white rounded-xl border p-4 hover:shadow-sm transition-shadow', task.status === 'completed' && 'opacity-60')}>
                  <button onClick={() => toggleComplete(task)} className="flex-shrink-0">
                    {task.status === 'completed' ? <CheckCircle className="w-6 h-6 text-green-500" /> : <Circle className="w-6 h-6 text-slate-300 hover:text-shelter-primary transition-colors" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('text-sm font-medium', task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900')}>{task.title}</span>
                      {task.priority && task.priority !== 'normal' && (
                        <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.normal)}>{task.priority}</span>
                      )}
                    </div>
                    {task.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{task.description}</p>}
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      {task.assigned_to && <span>{task.assigned_to}</span>}
                      {task.due_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{task.due_time}</span>}
                      {task.completed_at && <span className="text-green-600">Done {new Date(task.completed_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {ungrouped.length > 0 && (
          <div>
            <span className="text-sm font-semibold text-slate-700 mb-2 block">Other Tasks</span>
            {ungrouped.map(task => (
              <div key={task.id} className="flex items-center gap-3 bg-white rounded-xl border p-4 mb-2">
                <button onClick={() => toggleComplete(task)} className="flex-shrink-0">
                  {task.status === 'completed' ? <CheckCircle className="w-6 h-6 text-green-500" /> : <Circle className="w-6 h-6 text-slate-300" />}
                </button>
                <div className="flex-1"><span className={cn('text-sm font-medium', task.status === 'completed' && 'line-through text-slate-400')}>{task.title}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {tasks.length === 0 && !loading && <div className="py-16 text-center text-sm text-slate-400 bg-white rounded-xl border">No tasks for this date</div>}

      {/* Create Task Panel */}
      <SlidePanel isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Task">
        <div className="space-y-4">
          <FormInput label="Title" required value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="e.g. Morning feeding - Dog Ward A" />
          <FormRow>
            <FormSelect label="Category" options={TASK_CATEGORIES.map(c => ({value:c.key,label:`${c.icon} ${c.label}`}))} value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} />
            <FormSelect label="Priority" options={[{value:'normal',label:'Normal'},{value:'high',label:'High'},{value:'critical',label:'Critical'}]} value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value}))} />
          </FormRow>
          <FormRow>
            <FormInput label="Assigned To" value={form.assigned_to} onChange={e => setForm(f => ({...f, assigned_to: e.target.value}))} placeholder="Staff name" />
            <FormInput label="Due Time" type="time" value={form.due_time} onChange={e => setForm(f => ({...f, due_time: e.target.value}))} />
          </FormRow>
          <FormTextarea label="Description" rows={2} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_recurring} onChange={e => setForm(f => ({...f, is_recurring: e.target.checked}))} />Recurring Task</label>
          {form.is_recurring && <FormSelect label="Recurrence" options={[{value:'daily',label:'Daily'},{value:'weekly',label:'Weekly'},{value:'monthly',label:'Monthly'}]} value={form.recurrence} onChange={e => setForm(f => ({...f, recurrence: e.target.value}))} />}
          <div className="flex gap-3 pt-4 border-t">
            <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border hover:bg-slate-50">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-shelter-primary text-white hover:opacity-90 disabled:opacity-50">{saving ? 'Creating...' : 'Create Task'}</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { vetAPI } from '@/api';
import { Package, Plus, Search, AlertTriangle, Edit, Trash2, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import SlidePanel from '@/components/shared/SlidePanel';
import { FormInput, FormSelect, FormTextarea, FormRow } from '@/components/shared/FormField';

const CATEGORIES = ['Medication', 'Vaccine', 'Surgical Supply', 'Food', 'Supplement', 'Cleaning', 'Equipment', 'Retail', 'Other'];

const EMPTY_ITEM = {
  name: '', category: 'Medication', sku: '', quantity_on_hand: 0, reorder_point: 10,
  unit_cost: '', selling_price: '', unit: 'units', manufacturer: '', supplier: '',
  expiry_date: '', lot_number: '', is_controlled: false, description: '', location: '',
};

export default function VetInventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_ITEM });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showAdjust, setShowAdjust] = useState(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');

  const fetchData = async () => {
    try { const { data } = await vetAPI.getInventory(); setItems(data); } catch {} setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const lowStock = items.filter(i => i.quantity_on_hand <= (i.reorder_point || 10));
  const expiringSoon = items.filter(i => i.expiry_date && new Date(i.expiry_date) <= new Date(Date.now() + 30*86400000));
  const totalValue = items.reduce((s, i) => s + (i.quantity_on_hand || 0) * (i.unit_cost || 0), 0);

  const filtered = items.filter(i => {
    if (filter === 'low_stock' && i.quantity_on_hand > (i.reorder_point || 10)) return false;
    if (filter === 'expiring' && !(i.expiry_date && new Date(i.expiry_date) <= new Date(Date.now() + 30*86400000))) return false;
    if (filter === 'controlled' && !i.is_controlled) return false;
    if (search && !i.name?.toLowerCase().includes(search.toLowerCase()) && !i.sku?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openEdit = (item) => {
    setEditing(item);
    setForm({ ...EMPTY_ITEM, ...item, unit_cost: item.unit_cost?.toString() || '', selling_price: item.selling_price?.toString() || '' });
    setShowCreate(true);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error('Name required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, unit_cost: parseFloat(form.unit_cost) || 0, selling_price: parseFloat(form.selling_price) || 0, quantity_on_hand: parseInt(form.quantity_on_hand) || 0, reorder_point: parseInt(form.reorder_point) || 10 };
      await vetAPI.createInventory(payload);
      toast.success(editing ? 'Item updated' : 'Item created');
      setShowCreate(false); setEditing(null); setForm({ ...EMPTY_ITEM }); fetchData();
    } catch { toast.error('Failed'); }
    setSaving(false);
  };

  const handleAdjust = async () => {
    if (!showAdjust) return;
    try {
      await vetAPI.createInventory({ ...showAdjust, quantity_on_hand: (showAdjust.quantity_on_hand || 0) + adjustQty });
      toast.success(`Stock adjusted by ${adjustQty > 0 ? '+' : ''}${adjustQty}`);
      setShowAdjust(null); setAdjustQty(0); setAdjustReason(''); fetchData();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory & Pharmacy</h1>
          <p className="text-sm text-slate-500">{items.length} items tracked</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ ...EMPTY_ITEM }); setShowCreate(true); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-vet-primary text-white rounded-lg font-medium text-sm hover:bg-vet-secondary shadow-sm">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><Package className="w-5 h-5 text-blue-600" /></div>
          <div><p className="text-xl font-bold">{items.length}</p><p className="text-xs text-slate-500">Total Items</p></div>
        </div>
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
          <div><p className="text-xl font-bold text-red-600">{lowStock.length}</p><p className="text-xs text-slate-500">Low Stock</p></div>
        </div>
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-amber-600" /></div>
          <div><p className="text-xl font-bold text-amber-600">{expiringSoon.length}</p><p className="text-xs text-slate-500">Expiring Soon</p></div>
        </div>
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center"><Package className="w-5 h-5 text-green-600" /></div>
          <div><p className="text-xl font-bold">\u20AC{totalValue.toFixed(0)}</p><p className="text-xs text-slate-500">Total Value</p></div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search inventory..." className="w-full pl-9 pr-4 py-2.5 bg-white border rounded-lg text-sm" />
        </div>
        {['all','low_stock','expiring','controlled'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={cn('px-3 py-2 rounded-lg text-xs font-medium capitalize', filter === f ? 'bg-vet-primary text-white' : 'bg-white border text-slate-600 hover:bg-slate-50')}>{f.replace('_',' ')}</button>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b"><tr>
            <th className="text-left px-5 py-3 font-semibold text-slate-600">Item</th>
            <th className="text-left px-5 py-3 font-semibold text-slate-600">Category</th>
            <th className="text-center px-5 py-3 font-semibold text-slate-600">Stock</th>
            <th className="text-right px-5 py-3 font-semibold text-slate-600">Cost</th>
            <th className="text-right px-5 py-3 font-semibold text-slate-600">Price</th>
            <th className="text-left px-5 py-3 font-semibold text-slate-600 hidden lg:table-cell">Expiry</th>
            <th className="text-right px-5 py-3 font-semibold text-slate-600">Actions</th>
          </tr></thead>
          <tbody className="divide-y">
            {filtered.map(item => {
              const isLow = item.quantity_on_hand <= (item.reorder_point || 10);
              const isExpiring = item.expiry_date && new Date(item.expiry_date) <= new Date(Date.now() + 30*86400000);
              return (
                <tr key={item.id} className={cn('hover:bg-slate-50', isLow && 'bg-red-50/30')}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900">{item.name}</p>
                    {item.sku && <p className="text-xs text-slate-400 font-mono">{item.sku}</p>}
                    {item.is_controlled && <span className="text-xs bg-red-50 text-red-700 px-1.5 py-0.5 rounded mt-1 inline-block">Controlled</span>}
                  </td>
                  <td className="px-5 py-3 text-slate-500">{item.category}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={cn('font-semibold', isLow ? 'text-red-600' : 'text-slate-900')}>{item.quantity_on_hand || 0}</span>
                    <span className="text-xs text-slate-400"> /{item.reorder_point || 10}</span>
                  </td>
                  <td className="px-5 py-3 text-right">\u20AC{(item.unit_cost || 0).toFixed(2)}</td>
                  <td className="px-5 py-3 text-right">\u20AC{(item.selling_price || 0).toFixed(2)}</td>
                  <td className={cn('px-5 py-3 text-xs hidden lg:table-cell', isExpiring ? 'text-red-600 font-medium' : 'text-slate-500')}>{item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '-'}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setShowAdjust(item); setAdjustQty(0); }} className="p-1.5 rounded hover:bg-slate-100" title="Adjust Stock"><ArrowUpDown className="w-4 h-4 text-slate-500" /></button>
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-slate-100" title="Edit"><Edit className="w-4 h-4 text-slate-500" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="py-16 text-center text-sm text-slate-400">No inventory items found</div>}
      </div>

      {/* Create/Edit Panel */}
      <SlidePanel isOpen={showCreate} onClose={() => { setShowCreate(false); setEditing(null); }} title={editing ? 'Edit Item' : 'Add Item'} subtitle="Inventory management">
        <div className="space-y-4">
          <FormInput label="Name" required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
          <FormRow>
            <FormSelect label="Category" options={CATEGORIES.map(c => ({value:c,label:c}))} value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} />
            <FormInput label="SKU" value={form.sku} onChange={e => setForm(f => ({...f, sku: e.target.value}))} />
          </FormRow>
          <FormRow>
            <FormInput label="Quantity" type="number" value={form.quantity_on_hand} onChange={e => setForm(f => ({...f, quantity_on_hand: parseInt(e.target.value) || 0}))} />
            <FormInput label="Reorder Point" type="number" value={form.reorder_point} onChange={e => setForm(f => ({...f, reorder_point: parseInt(e.target.value) || 10}))} />
          </FormRow>
          <FormRow>
            <FormInput label="Unit Cost (\u20AC)" type="number" step="0.01" value={form.unit_cost} onChange={e => setForm(f => ({...f, unit_cost: e.target.value}))} />
            <FormInput label="Selling Price (\u20AC)" type="number" step="0.01" value={form.selling_price} onChange={e => setForm(f => ({...f, selling_price: e.target.value}))} />
          </FormRow>
          <FormRow>
            <FormInput label="Manufacturer" value={form.manufacturer} onChange={e => setForm(f => ({...f, manufacturer: e.target.value}))} />
            <FormInput label="Supplier" value={form.supplier} onChange={e => setForm(f => ({...f, supplier: e.target.value}))} />
          </FormRow>
          <FormRow>
            <FormInput label="Lot Number" value={form.lot_number} onChange={e => setForm(f => ({...f, lot_number: e.target.value}))} />
            <FormInput label="Expiry Date" type="date" value={form.expiry_date} onChange={e => setForm(f => ({...f, expiry_date: e.target.value}))} />
          </FormRow>
          <FormInput label="Location" value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))} placeholder="e.g. Shelf A-3" />
          <FormTextarea label="Description" rows={2} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
          <div className="flex gap-3 pt-4 border-t">
            <button onClick={() => { setShowCreate(false); setEditing(null); }} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 border hover:bg-slate-50">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-vet-primary text-white hover:bg-vet-secondary disabled:opacity-50">{saving ? 'Saving...' : editing ? 'Update Item' : 'Add Item'}</button>
          </div>
        </div>
      </SlidePanel>

      {/* Adjust Stock Modal */}
      {showAdjust && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Adjust Stock: {showAdjust.name}</h3>
            <p className="text-sm text-slate-500">Current: {showAdjust.quantity_on_hand} {showAdjust.unit}</p>
            <div className="space-y-3">
              <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Adjustment (+/-)</label><input type="number" value={adjustQty} onChange={e => setAdjustQty(parseInt(e.target.value) || 0)} className="w-full px-3 py-2.5 border rounded-lg text-sm text-center text-lg font-bold" /></div>
              <p className="text-sm text-center">New quantity: <span className="font-bold">{(showAdjust.quantity_on_hand || 0) + adjustQty}</span></p>
              <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">Reason</label><input value={adjustReason} onChange={e => setAdjustReason(e.target.value)} className="w-full px-3 py-2.5 border rounded-lg text-sm" placeholder="e.g. Received shipment" /></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAdjust(null)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border hover:bg-slate-50">Cancel</button>
              <button onClick={handleAdjust} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-vet-primary text-white hover:bg-vet-secondary">Adjust</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

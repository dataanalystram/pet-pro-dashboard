import { useState, useEffect } from 'react';
import { inventoryAPI } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Package, Plus, Search, AlertTriangle, ArrowUpDown,
  Pencil, Trash2, Minus, PlusIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

const categoryLabels = {
  grooming_supplies: 'Grooming Supplies', equipment: 'Equipment', retail: 'Retail',
  cleaning: 'Cleaning', medical: 'Medical', other: 'Other',
};

const categoryColors = {
  grooming_supplies: 'bg-blue-100 text-blue-700', equipment: 'bg-slate-100 text-slate-700',
  retail: 'bg-emerald-100 text-emerald-700', cleaning: 'bg-amber-100 text-amber-700',
  medical: 'bg-red-100 text-red-700', other: 'bg-slate-100 text-slate-600',
};

const EMPTY_FORM = {
  name: '', category: 'grooming_supplies', quantity_in_stock: '0',
  reorder_point: '5', cost_per_unit: '', retail_price: '', supplier_name: '',
};

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [adjustDialog, setAdjustDialog] = useState({ open: false, item: null });
  const [adjustQty, setAdjustQty] = useState('');

  const load = async () => {
    try { const { data } = await inventoryAPI.list(); setItems(data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ ...EMPTY_FORM }); setDialogOpen(true); };
  const openEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name || '', category: item.category || 'other',
      quantity_in_stock: (item.quantity_in_stock || 0).toString(),
      reorder_point: (item.reorder_point || 5).toString(),
      cost_per_unit: item.cost_per_unit?.toString() || '',
      retail_price: item.retail_price?.toString() || '',
      supplier_name: item.supplier_name || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      quantity_in_stock: parseInt(form.quantity_in_stock) || 0,
      reorder_point: parseInt(form.reorder_point) || 5,
      cost_per_unit: form.cost_per_unit ? parseFloat(form.cost_per_unit) : null,
      retail_price: form.retail_price ? parseFloat(form.retail_price) : null,
    };
    try {
      if (editing) await inventoryAPI.update(editing.id, payload);
      else await inventoryAPI.create(payload);
      await load();
      setDialogOpen(false);
    } catch (e) { console.error(e); }
  };

  const handleAdjust = async (direction) => {
    const qty = parseInt(adjustQty) || 0;
    if (qty <= 0) return;
    const change = direction === 'add' ? qty : -qty;
    await inventoryAPI.adjust(adjustDialog.item.id, { quantity_change: change, reason: 'manual' });
    await load();
    setAdjustDialog({ open: false, item: null });
    setAdjustQty('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    await inventoryAPI.remove(id);
    await load();
  };

  const lowStockCount = items.filter((i) => i.is_low_stock).length;

  const filtered = items.filter((i) => {
    if (catFilter !== 'all' && i.category !== catFilter) return false;
    if (search && !i.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return (
    <div className="space-y-4" data-testid="inventory-skeleton">
      <Skeleton className="h-8 w-48" />{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
    </div>
  );

  return (
    <div className="space-y-6" data-testid="inventory-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory</h1>
          <p className="text-sm text-slate-500">{items.length} items tracked</p>
        </div>
        <Button onClick={openAdd} className="bg-provider-primary hover:bg-blue-700" data-testid="add-inventory-btn">
          <Plus className="w-4 h-4 mr-2" /> Add Item
        </Button>
      </div>

      {/* Low stock alert */}
      {lowStockCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3" data-testid="low-stock-alert">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-700"><span className="font-semibold">{lowStockCount} items</span> are below reorder point</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search inventory..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" data-testid="search-inventory" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Inventory table */}
      <Card className="border-slate-200" data-testid="inventory-table">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Item</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Category</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Stock</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Cost</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Retail</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Supplier</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-sm text-slate-500">No items found</td></tr>
                ) : filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50" data-testid={`inv-row-${item.id}`}>
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-slate-900">{item.name}</p>
                    </td>
                    <td className="px-5 py-3">
                      <Badge className={cn("text-[10px]", categoryColors[item.category] || categoryColors.other)}>
                        {categoryLabels[item.category] || item.category}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-sm font-semibold", item.is_low_stock ? "text-red-600" : "text-slate-900")}>
                          {item.quantity_in_stock}
                        </span>
                        {item.is_low_stock && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                      </div>
                      <p className="text-[10px] text-slate-400">Reorder at {item.reorder_point}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">{item.cost_per_unit ? `€${item.cost_per_unit.toFixed(2)}` : '-'}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{item.retail_price ? `€${item.retail_price.toFixed(2)}` : '-'}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{item.supplier_name || '-'}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setAdjustDialog({ open: true, item }); setAdjustQty(''); }}>
                          <ArrowUpDown className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" data-testid="inventory-dialog">
          <DialogHeader><DialogTitle>{editing ? 'Edit Item' : 'Add Inventory Item'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Item Name *</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({...f, name: e.target.value}))} data-testid="inv-name-input" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm(f => ({...f, category: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select></div>
              <div className="space-y-1.5"><Label>In Stock</Label>
                <Input type="number" value={form.quantity_in_stock} onChange={(e) => setForm(f => ({...f, quantity_in_stock: e.target.value}))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Cost (€)</Label>
                <Input type="number" value={form.cost_per_unit} onChange={(e) => setForm(f => ({...f, cost_per_unit: e.target.value}))} /></div>
              <div className="space-y-1.5"><Label>Retail (€)</Label>
                <Input type="number" value={form.retail_price} onChange={(e) => setForm(f => ({...f, retail_price: e.target.value}))} /></div>
              <div className="space-y-1.5"><Label>Reorder Point</Label>
                <Input type="number" value={form.reorder_point} onChange={(e) => setForm(f => ({...f, reorder_point: e.target.value}))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Supplier</Label>
              <Input value={form.supplier_name} onChange={(e) => setForm(f => ({...f, supplier_name: e.target.value}))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-provider-primary hover:bg-blue-700" disabled={!form.name} data-testid="save-inv-btn">
              {editing ? 'Save Changes' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Adjustment Dialog */}
      <Dialog open={adjustDialog.open} onOpenChange={(o) => { if (!o) setAdjustDialog({ open: false, item: null }); }}>
        <DialogContent className="max-w-sm" data-testid="adjust-dialog">
          <DialogHeader><DialogTitle>Adjust Stock: {adjustDialog.item?.name}</DialogTitle></DialogHeader>
          <div className="py-3">
            <p className="text-sm text-slate-500 mb-3">Current stock: <span className="font-semibold text-slate-900">{adjustDialog.item?.quantity_in_stock}</span></p>
            <Input type="number" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} placeholder="Quantity" data-testid="adjust-qty-input" />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button onClick={() => handleAdjust('remove')} variant="outline" className="flex-1 text-red-600" disabled={!adjustQty} data-testid="adjust-remove">
              <Minus className="w-4 h-4 mr-1" /> Remove {adjustQty || 0}
            </Button>
            <Button onClick={() => handleAdjust('add')} className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={!adjustQty} data-testid="adjust-add">
              <PlusIcon className="w-4 h-4 mr-1" /> Add {adjustQty || 0}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

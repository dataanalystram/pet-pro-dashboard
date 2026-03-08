import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Package, Plus, Search, AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { mockInventory } from '@/lib/mock-data';

const categoryLabels: Record<string, string> = {
  grooming_supplies: 'Grooming Supplies', equipment: 'Equipment', retail: 'Retail',
  cleaning: 'Cleaning', medical: 'Medical', other: 'Other',
};

const categoryColors: Record<string, string> = {
  grooming_supplies: 'bg-blue-100 text-blue-700', equipment: 'bg-slate-100 text-slate-700',
  retail: 'bg-emerald-100 text-emerald-700', cleaning: 'bg-amber-100 text-amber-700',
  medical: 'bg-red-100 text-red-700', other: 'bg-slate-100 text-slate-600',
};

export default function InventoryPage() {
  const [items, setItems] = useState(mockInventory);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', category: 'grooming_supplies', quantity_in_stock: '0', reorder_point: '5', cost_per_unit: '', retail_price: '', supplier_name: '' });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', category: 'grooming_supplies', quantity_in_stock: '0', reorder_point: '5', cost_per_unit: '', retail_price: '', supplier_name: '' });
    setDialogOpen(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({ name: item.name, category: item.category, quantity_in_stock: item.quantity_in_stock.toString(), reorder_point: item.reorder_point.toString(), cost_per_unit: item.cost_per_unit?.toString() || '', retail_price: item.retail_price?.toString() || '', supplier_name: item.supplier_name || '' });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const parsed = { ...form, quantity_in_stock: parseInt(form.quantity_in_stock), reorder_point: parseInt(form.reorder_point), cost_per_unit: form.cost_per_unit ? parseFloat(form.cost_per_unit) : null, retail_price: form.retail_price ? parseFloat(form.retail_price) : null };
    if (editing) {
      setItems(prev => prev.map(i => i.id === editing.id ? { ...i, ...parsed } : i));
      toast.success('Item updated');
    } else {
      setItems(prev => [...prev, { id: `inv${Date.now()}`, ...parsed }]);
      toast.success('Item added');
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this item?')) return;
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success('Item deleted');
  };

  const filtered = items.filter(i => {
    if (catFilter !== 'all' && i.category !== catFilter) return false;
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const lowStock = items.filter(i => i.quantity_in_stock <= i.reorder_point);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Inventory</h1>
          <p className="text-sm text-muted-foreground">{items.length} items tracked</p>
        </div>
        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" /> Add Item</Button>
      </div>

      {lowStock.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">Low Stock Alert</p>
              <p className="text-xs text-amber-600">{lowStock.map(i => i.name).join(', ')} need restocking</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Item</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Category</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Stock</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Cost</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Supplier</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge className={cn("text-[10px]", categoryColors[item.category])}>{categoryLabels[item.category]}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn("text-sm font-semibold", item.quantity_in_stock <= item.reorder_point ? "text-red-600" : "")}>
                        {item.quantity_in_stock}
                      </span>
                      {item.quantity_in_stock <= item.reorder_point && <AlertTriangle className="w-3 h-3 text-amber-500 inline ml-1" />}
                    </td>
                    <td className="px-5 py-3 text-sm">{item.cost_per_unit ? `$${item.cost_per_unit}` : '-'}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{item.supplier_name || '-'}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}><Pencil className="w-3 h-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit Item' : 'Add Item'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Quantity</Label>
                <Input type="number" value={form.quantity_in_stock} onChange={(e) => setForm(f => ({ ...f, quantity_in_stock: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Reorder Point</Label>
                <Input type="number" value={form.reorder_point} onChange={(e) => setForm(f => ({ ...f, reorder_point: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Cost Per Unit ($)</Label>
                <Input type="number" value={form.cost_per_unit} onChange={(e) => setForm(f => ({ ...f, cost_per_unit: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Retail Price ($)</Label>
                <Input type="number" value={form.retail_price} onChange={(e) => setForm(f => ({ ...f, retail_price: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Supplier</Label>
              <Input value={form.supplier_name} onChange={(e) => setForm(f => ({ ...f, supplier_name: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name}>{editing ? 'Save Changes' : 'Add Item'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

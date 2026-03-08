import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package, Plus, Search, AlertTriangle, LayoutGrid, List, Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useInventory, useUpdate, useDelete } from '@/hooks/use-supabase-data';
import ProductCard from './components/ProductCard';
import ProductFormDialog from './components/ProductFormDialog';
import ProductDetailPanel from './components/ProductDetailPanel';

const categoryLabels: Record<string, string> = {
  grooming_supplies: 'Grooming Supplies', equipment: 'Equipment', retail: 'Retail',
  cleaning: 'Cleaning', medical: 'Medical', food: 'Food & Treats', toys: 'Toys', accessories: 'Accessories', other: 'Other',
};

const sortOptions = [
  { value: 'name', label: 'Name' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'stock', label: 'Stock' },
  { value: 'newest', label: 'Newest' },
];

export default function InventoryPage() {
  const { data: items = [], isLoading } = useInventory();
  const updateItem = useUpdate('inventory');
  const deleteItem = useDelete('inventory');

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [tab, setTab] = useState('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [detailProduct, setDetailProduct] = useState<any>(null);

  // Unique brands
  const brands = Array.from(new Set(items.map((i: any) => i.brand).filter(Boolean)));

  // Filter
  const filtered = items.filter((i: any) => {
    const status = i.status || 'active';
    if (tab === 'active' && status !== 'active') return false;
    if (tab === 'draft' && status !== 'draft') return false;
    if (tab === 'archived' && status !== 'archived') return false;
    if (tab === 'low_stock' && i.quantity_in_stock > i.reorder_point) return false;
    if (catFilter !== 'all' && i.category !== catFilter) return false;
    if (brandFilter !== 'all' && i.brand !== brandFilter) return false;
    if (search && !i.name.toLowerCase().includes(search.toLowerCase()) && !(i.sku || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a: any, b: any) => {
    switch (sortBy) {
      case 'price_high': return Number(b.retail_price || b.cost_per_unit || 0) - Number(a.retail_price || a.cost_per_unit || 0);
      case 'price_low': return Number(a.retail_price || a.cost_per_unit || 0) - Number(b.retail_price || b.cost_per_unit || 0);
      case 'stock': return a.quantity_in_stock - b.quantity_in_stock;
      case 'newest': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      default: return a.name.localeCompare(b.name);
    }
  });

  const lowStockCount = items.filter((i: any) => i.quantity_in_stock <= i.reorder_point).length;
  const tabCounts = {
    all: items.length,
    active: items.filter((i: any) => (i.status || 'active') === 'active').length,
    draft: items.filter((i: any) => i.status === 'draft').length,
    archived: items.filter((i: any) => i.status === 'archived').length,
    low_stock: lowStockCount,
  };

  const handleEdit = (product: any) => { setEditingProduct(product); setFormOpen(true); };
  const handleAdd = () => { setEditingProduct(null); setFormOpen(true); };
  const handleDuplicate = (product: any) => {
    const { id, created_at, updated_at, sku, ...rest } = product;
    setEditingProduct(null);
    // Pre-fill by opening form with the product data but no id
    setEditingProduct({ ...rest, name: `${product.name} (Copy)`, sku: '' });
    setFormOpen(true);
  };
  const handleArchive = (product: any) => {
    updateItem.mutate({ id: product.id, status: product.status === 'archived' ? 'active' : 'archived' }, {
      onSuccess: () => toast.success(product.status === 'archived' ? 'Product restored' : 'Product archived'),
    });
  };

  if (isLoading) return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading products...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Product Catalog</h1>
          <p className="text-sm text-muted-foreground">{items.length} products · {lowStockCount} low stock</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex border rounded-lg overflow-hidden">
            <Button variant={view === 'grid' ? 'default' : 'ghost'} size="icon" className="h-9 w-9 rounded-none" onClick={() => setView('grid')}>
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button variant={view === 'list' ? 'default' : 'ghost'} size="icon" className="h-9 w-9 rounded-none" onClick={() => setView('list')}>
              <List className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={handleAdd}><Plus className="w-4 h-4 mr-2" /> Add Product</Button>
        </div>
      </div>

      {/* Low stock alert */}
      {lowStockCount > 0 && (
        <Card className="border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">{lowStockCount} product{lowStockCount > 1 ? 's' : ''} low on stock</p>
              <p className="text-xs text-muted-foreground">Review and reorder to avoid stockouts</p>
            </div>
            <Button variant="outline" size="sm" className="ml-auto" onClick={() => setTab('low_stock')}>View</Button>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full sm:w-auto overflow-x-auto">
          {Object.entries(tabCounts).map(([key, count]) => (
            <TabsTrigger key={key} value={key} className="capitalize text-xs px-3">
              {key === 'low_stock' ? 'Low Stock' : key === 'all' ? 'All Products' : key}
              <span className="ml-1.5 text-[10px] text-muted-foreground">{count}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 min-w-0 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search products or SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        {brands.length > 0 && (
          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Brand" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brands.map((b: any) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Sort by" /></SelectTrigger>
          <SelectContent>
            {sortOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Grid View */}
      {view === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map((product: any) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onArchive={handleArchive}
              onClick={setDetailProduct}
            />
          ))}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Product</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">SKU</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Category</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Stock</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Price</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((item: any) => (
                    <tr key={item.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => setDetailProduct(item)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-muted border flex items-center justify-center overflow-hidden flex-shrink-0">
                            {item.images?.[0] ? (
                              <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              {item.featured && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                              <span className="text-sm font-medium">{item.name}</span>
                            </div>
                            {item.brand && <p className="text-xs text-muted-foreground">{item.brand}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{item.sku || '-'}</td>
                      <td className="px-4 py-3"><Badge variant="secondary" className="text-[10px]">{categoryLabels[item.category] || item.category}</Badge></td>
                      <td className="px-4 py-3">
                        <span className={cn('text-sm font-semibold', item.quantity_in_stock <= item.reorder_point ? 'text-destructive' : '')}>
                          {item.quantity_in_stock}
                        </span>
                        {item.quantity_in_stock <= item.reorder_point && <AlertTriangle className="w-3 h-3 text-amber-500 inline ml-1" />}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold">${Number(item.retail_price || item.cost_per_unit || 0).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={item.status === 'active' ? 'default' : 'secondary'} className="text-[10px] capitalize">{item.status || 'active'}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No products found</p>
          <p className="text-sm mt-1">Try adjusting your filters or add a new product</p>
        </div>
      )}

      <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} product={editingProduct} />
      <ProductDetailPanel product={detailProduct} open={!!detailProduct} onOpenChange={open => !open && setDetailProduct(null)} onEdit={handleEdit} />
    </div>
  );
}

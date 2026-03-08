import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Trash2 } from 'lucide-react';
import MediaUploader from '@/components/MediaUploader';
import { toast } from 'sonner';
import { useInsert, useUpdate } from '@/hooks/use-supabase-data';

const categories = [
  'grooming_supplies', 'equipment', 'retail', 'cleaning', 'medical', 'food', 'toys', 'accessories', 'other',
];
const categoryLabels: Record<string, string> = {
  grooming_supplies: 'Grooming Supplies', equipment: 'Equipment', retail: 'Retail',
  cleaning: 'Cleaning', medical: 'Medical', food: 'Food & Treats', toys: 'Toys', accessories: 'Accessories', other: 'Other',
};

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: any;
}

const emptyForm = {
  name: '', sku: '', category: 'retail', brand: '', short_description: '', description: '',
  images: [] as string[], video_url: '', cost_per_unit: '', retail_price: '',
  quantity_in_stock: '0', reorder_point: '5', supplier_name: '', weight_grams: '',
  tags: [] as string[], status: 'active', featured: false,
  variants: [] as { name: string; price: string; stock: string }[],
};

export default function ProductFormDialog({ open, onOpenChange, product }: ProductFormDialogProps) {
  const [form, setForm] = useState(emptyForm);
  const [tagInput, setTagInput] = useState('');
  const insertItem = useInsert('inventory');
  const updateItem = useUpdate('inventory');

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '', sku: product.sku || '', category: product.category || 'retail',
        brand: product.brand || '', short_description: product.short_description || '',
        description: product.description || '', images: product.images || [],
        video_url: product.video_url || '', cost_per_unit: product.cost_per_unit?.toString() || '',
        retail_price: product.retail_price?.toString() || '',
        quantity_in_stock: product.quantity_in_stock?.toString() || '0',
        reorder_point: product.reorder_point?.toString() || '5',
        supplier_name: product.supplier_name || '', weight_grams: product.weight_grams?.toString() || '',
        tags: product.tags || [], status: product.status || 'active',
        featured: product.featured || false,
        variants: (product.variants || []).map((v: any) => ({
          name: v.name || '', price: v.price?.toString() || '', stock: v.stock?.toString() || '',
        })),
      });
    } else {
      setForm(emptyForm);
    }
  }, [product, open]);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) {
      setForm(f => ({ ...f, tags: [...f.tags, t] }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));

  const addVariant = () => setForm(f => ({ ...f, variants: [...f.variants, { name: '', price: '', stock: '' }] }));
  const removeVariant = (i: number) => setForm(f => ({ ...f, variants: f.variants.filter((_, idx) => idx !== i) }));
  const updateVariant = (i: number, key: string, val: string) =>
    setForm(f => ({ ...f, variants: f.variants.map((v, idx) => idx === i ? { ...v, [key]: val } : v) }));

  const handleSave = () => {
    if (!form.name) { toast.error('Product name is required'); return; }
    const payload = {
      name: form.name, sku: form.sku || null, category: form.category, brand: form.brand || null,
      short_description: form.short_description || null, description: form.description || null,
      images: form.images, video_url: form.video_url || null,
      cost_per_unit: form.cost_per_unit ? parseFloat(form.cost_per_unit) : 0,
      retail_price: form.retail_price ? parseFloat(form.retail_price) : null,
      quantity_in_stock: parseInt(form.quantity_in_stock) || 0,
      reorder_point: parseInt(form.reorder_point) || 0,
      supplier_name: form.supplier_name || null,
      weight_grams: form.weight_grams ? parseFloat(form.weight_grams) : null,
      tags: form.tags, status: form.status, featured: form.featured,
      variants: form.variants.map(v => ({
        name: v.name, price: parseFloat(v.price) || 0, stock: parseInt(v.stock) || 0,
      })),
    };

    if (product) {
      updateItem.mutate({ id: product.id, ...payload }, {
        onSuccess: () => { toast.success('Product updated'); onOpenChange(false); },
      });
    } else {
      insertItem.mutate(payload, {
        onSuccess: () => { toast.success('Product created'); onOpenChange(false); },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="w-full grid grid-cols-5 mb-4">
            <TabsTrigger value="basic" className="text-xs">Basic Info</TabsTrigger>
            <TabsTrigger value="media" className="text-xs">Media</TabsTrigger>
            <TabsTrigger value="pricing" className="text-xs">Pricing</TabsTrigger>
            <TabsTrigger value="inventory" className="text-xs">Inventory</TabsTrigger>
            <TabsTrigger value="tags" className="text-xs">Tags</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Product Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Premium Dog Shampoo" /></div>
              <div className="space-y-1.5"><Label>SKU</Label><Input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="e.g. PDS-001" className="font-mono" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{categoryLabels[c] || c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Brand</Label><Input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="e.g. PetCare Plus" /></div>
            </div>
            <div className="space-y-1.5"><Label>Short Description</Label><Input value={form.short_description} onChange={e => setForm(f => ({ ...f, short_description: e.target.value }))} placeholder="Brief tagline for the product" /></div>
            <div className="space-y-1.5"><Label>Full Description</Label><Textarea rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detailed product description..." /></div>
            <div className="flex items-center gap-3">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 ml-auto">
                <Switch checked={form.featured} onCheckedChange={v => setForm(f => ({ ...f, featured: v }))} />
                <Label className="text-sm">Featured</Label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="media" className="space-y-4">
            <div className="space-y-1.5">
              <Label>Product Images</Label>
              <p className="text-xs text-muted-foreground">Upload high-quality images, GIFs, or product photos. First image is the cover.</p>
              <MediaUploader bucket="product-media" folder="products" value={form.images} onChange={urls => setForm(f => ({ ...f, images: urls }))} maxFiles={8} accept="image/*,.gif" />
            </div>
            <div className="space-y-1.5">
              <Label>Video URL</Label>
              <Input value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} placeholder="https://youtube.com/watch?v=..." />
              {form.video_url && (
                <div className="mt-2 rounded-lg overflow-hidden border aspect-video bg-muted">
                  <iframe src={form.video_url.replace('watch?v=', 'embed/')} className="w-full h-full" allowFullScreen title="Product video" />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Cost Per Unit ($)</Label><Input type="number" value={form.cost_per_unit} onChange={e => setForm(f => ({ ...f, cost_per_unit: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Retail Price ($)</Label><Input type="number" value={form.retail_price} onChange={e => setForm(f => ({ ...f, retail_price: e.target.value }))} /></div>
            </div>
            {form.cost_per_unit && form.retail_price && (
              <div className="p-3 rounded-lg bg-muted text-sm">
                Margin: <span className="font-semibold text-emerald-600">${(parseFloat(form.retail_price) - parseFloat(form.cost_per_unit)).toFixed(2)}</span>
                {' '}({((1 - parseFloat(form.cost_per_unit) / parseFloat(form.retail_price)) * 100).toFixed(1)}%)
              </div>
            )}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Variants (Size / Color / Type)</Label>
                <Button variant="outline" size="sm" onClick={addVariant}><Plus className="w-3 h-3 mr-1" /> Add Variant</Button>
              </div>
              {form.variants.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input placeholder="Variant name" value={v.name} onChange={e => updateVariant(i, 'name', e.target.value)} className="flex-1" />
                  <Input placeholder="Price" type="number" value={v.price} onChange={e => updateVariant(i, 'price', e.target.value)} className="w-24" />
                  <Input placeholder="Stock" type="number" value={v.stock} onChange={e => updateVariant(i, 'stock', e.target.value)} className="w-20" />
                  <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0" onClick={() => removeVariant(i)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Quantity in Stock</Label><Input type="number" value={form.quantity_in_stock} onChange={e => setForm(f => ({ ...f, quantity_in_stock: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Reorder Point</Label><Input type="number" value={form.reorder_point} onChange={e => setForm(f => ({ ...f, reorder_point: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Supplier</Label><Input value={form.supplier_name} onChange={e => setForm(f => ({ ...f, supplier_name: e.target.value }))} placeholder="Supplier name" /></div>
            <div className="space-y-1.5"><Label>Weight (grams)</Label><Input type="number" value={form.weight_grams} onChange={e => setForm(f => ({ ...f, weight_grams: e.target.value }))} placeholder="Product weight for shipping" /></div>
          </TabsContent>

          <TabsContent value="tags" className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Type a tag and press Enter" />
                <Button variant="outline" onClick={addTag}>Add</Button>
              </div>
            </div>
            {form.tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {form.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="ml-0.5 hover:bg-muted rounded-full p-0.5"><X className="w-3 h-3" /></button>
                  </Badge>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!form.name || insertItem.isPending || updateItem.isPending}>
            {product ? 'Save Changes' : 'Create Product'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

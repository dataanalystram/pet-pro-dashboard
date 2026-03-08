import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, X, Trash2, ChevronDown } from 'lucide-react';
import MediaUploader from '@/components/MediaUploader';
import { toast } from 'sonner';
import { useInsert, useUpdate } from '@/hooks/use-supabase-data';
import { cn } from '@/lib/utils';

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

function SectionHeader({ title, open, count }: { title: string; open: boolean; count?: number }) {
  return (
    <div className="flex items-center gap-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
      <ChevronDown className={cn('w-4 h-4 transition-transform', open && 'rotate-180')} />
      {title}
      {count !== undefined && count > 0 && (
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{count}</Badge>
      )}
    </div>
  );
}

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

  const cost = parseFloat(form.cost_per_unit) || 0;
  const retail = parseFloat(form.retail_price) || 0;
  const marginDollar = retail > 0 ? (retail - cost).toFixed(2) : null;
  const marginPct = retail > 0 ? ((1 - cost / retail) * 100).toFixed(1) : null;

  const handleSave = () => {
    if (!form.name) { toast.error('Product name is required'); return; }
    const payload = {
      name: form.name, sku: form.sku || null, category: form.category, brand: form.brand || null,
      short_description: form.short_description || null, description: form.description || null,
      images: form.images, video_url: form.video_url || null,
      cost_per_unit: cost,
      retail_price: retail > 0 ? retail : null,
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

        <div className="space-y-4">
          {/* === ESSENTIAL FIELDS === */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Product Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Premium Dog Shampoo" /></div>
            <div className="space-y-1"><Label>SKU</Label><Input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="e.g. PDS-001" className="font-mono" /></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{categoryLabels[c] || c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Brand</Label><Input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="e.g. PetCare Plus" /></div>
          </div>

          <div className="space-y-1"><Label>Short Description</Label><Input value={form.short_description} onChange={e => setForm(f => ({ ...f, short_description: e.target.value }))} placeholder="Brief tagline for the product" /></div>

          {/* Pricing row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1"><Label>Cost ($)</Label><Input type="number" value={form.cost_per_unit} onChange={e => setForm(f => ({ ...f, cost_per_unit: e.target.value }))} placeholder="0.00" /></div>
            <div className="space-y-1"><Label>Retail Price ($)</Label><Input type="number" value={form.retail_price} onChange={e => setForm(f => ({ ...f, retail_price: e.target.value }))} placeholder="0.00" /></div>
            <div className="space-y-1">
              <Label>Margin</Label>
              <div className="h-10 flex items-center px-3 rounded-md border bg-muted text-sm">
                {marginDollar && marginPct ? (
                  <span className="text-emerald-600 font-medium">${marginDollar} ({marginPct}%)</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            </div>
          </div>

          {/* Stock row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Quantity in Stock</Label><Input type="number" value={form.quantity_in_stock} onChange={e => setForm(f => ({ ...f, quantity_in_stock: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Reorder Point</Label><Input type="number" value={form.reorder_point} onChange={e => setForm(f => ({ ...f, reorder_point: e.target.value }))} /></div>
          </div>

          {/* Status row */}
          <div className="flex items-center gap-3">
            <div className="space-y-1 flex-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <Switch checked={form.featured} onCheckedChange={v => setForm(f => ({ ...f, featured: v }))} />
              <Label className="text-sm">Featured</Label>
            </div>
          </div>

          {/* === COLLAPSIBLE SECTIONS === */}
          <div className="border-t pt-2 space-y-1">
            {/* Description */}
            <Collapsible>
              <CollapsibleTrigger className="w-full">
                <SectionHeader title="Full Description" open={false} count={form.description ? 1 : 0} />
              </CollapsibleTrigger>
              <CollapsibleContent className="pb-3">
                <Textarea rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detailed product description..." />
              </CollapsibleContent>
            </Collapsible>

            {/* Media */}
            <Collapsible>
              <CollapsibleTrigger className="w-full">
                <SectionHeader title="Media" open={false} count={form.images.length + (form.video_url ? 1 : 0)} />
              </CollapsibleTrigger>
              <CollapsibleContent className="pb-3 space-y-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Upload images, GIFs, or product photos. First image is the cover.</p>
                  <MediaUploader bucket="product-media" folder="products" value={form.images} onChange={urls => setForm(f => ({ ...f, images: urls }))} maxFiles={8} accept="image/*,.gif" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Video URL</Label>
                  <Input value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} placeholder="https://youtube.com/watch?v=..." />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Supplier & Shipping */}
            <Collapsible>
              <CollapsibleTrigger className="w-full">
                <SectionHeader title="Supplier & Shipping" open={false} count={form.supplier_name ? 1 : 0} />
              </CollapsibleTrigger>
              <CollapsibleContent className="pb-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">Supplier</Label><Input value={form.supplier_name} onChange={e => setForm(f => ({ ...f, supplier_name: e.target.value }))} placeholder="Supplier name" /></div>
                  <div className="space-y-1"><Label className="text-xs">Weight (grams)</Label><Input type="number" value={form.weight_grams} onChange={e => setForm(f => ({ ...f, weight_grams: e.target.value }))} placeholder="For shipping" /></div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Variants */}
            <Collapsible>
              <CollapsibleTrigger className="w-full">
                <SectionHeader title="Variants" open={false} count={form.variants.length} />
              </CollapsibleTrigger>
              <CollapsibleContent className="pb-3 space-y-2">
                {form.variants.map((v, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input placeholder="Variant name" value={v.name} onChange={e => updateVariant(i, 'name', e.target.value)} className="flex-1" />
                    <Input placeholder="Price" type="number" value={v.price} onChange={e => updateVariant(i, 'price', e.target.value)} className="w-24" />
                    <Input placeholder="Stock" type="number" value={v.stock} onChange={e => updateVariant(i, 'stock', e.target.value)} className="w-20" />
                    <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0" onClick={() => removeVariant(i)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addVariant}><Plus className="w-3 h-3 mr-1" /> Add Variant</Button>
              </CollapsibleContent>
            </Collapsible>

            {/* Tags */}
            <Collapsible>
              <CollapsibleTrigger className="w-full">
                <SectionHeader title="Tags" open={false} count={form.tags.length} />
              </CollapsibleTrigger>
              <CollapsibleContent className="pb-3 space-y-2">
                <div className="flex gap-2">
                  <Input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Type a tag and press Enter" />
                  <Button variant="outline" size="sm" onClick={addTag}>Add</Button>
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
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

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

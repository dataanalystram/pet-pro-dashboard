import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Package, Star, Pencil, ExternalLink, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useOrders } from '@/hooks/use-supabase-data';

interface ProductDetailPanelProps {
  product: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (product: any) => void;
}

export default function ProductDetailPanel({ product, open, onOpenChange, onEdit }: ProductDetailPanelProps) {
  const { data: orders = [] } = useOrders();
  const [selectedImage, setSelectedImage] = useState(0);

  if (!product) return null;

  const images = product.images || [];
  const price = product.retail_price ?? product.cost_per_unit ?? 0;
  const margin = product.retail_price && product.retail_price > 0 && product.cost_per_unit != null
    ? ((1 - product.cost_per_unit / product.retail_price) * 100).toFixed(1) : null;

  // Orders containing this product
  const productOrders = orders.filter((o: any) =>
    (o.items || []).some((item: any) => item.inventory_id === product.id)
  ).slice(0, 5);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">Product Details</SheetTitle>
            <Button variant="outline" size="sm" onClick={() => { onEdit(product); onOpenChange(false); }}>
              <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
            </Button>
          </div>
        </SheetHeader>

        {/* Image Gallery */}
        {images.length > 0 ? (
          <div className="space-y-2 mb-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted border">
              <img src={images[selectedImage] || images[0]} alt={product.name} className="w-full h-full object-cover" />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={cn(
                      'w-14 h-14 rounded-md overflow-hidden border-2 flex-shrink-0 transition-colors',
                      i === selectedImage ? 'border-primary' : 'border-transparent hover:border-muted-foreground/30'
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-video rounded-lg bg-muted flex items-center justify-center mb-4">
            <Package className="w-16 h-16 text-muted-foreground/20" />
          </div>
        )}

        {/* Video */}
        {product.video_url && (
          <div className="mb-4 rounded-lg overflow-hidden border aspect-video bg-muted">
            <iframe src={product.video_url.replace('watch?v=', 'embed/')} className="w-full h-full" allowFullScreen title="Product video" />
          </div>
        )}

        {/* Info */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {product.featured && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
              <Badge variant="secondary" className="text-[10px]">{product.category}</Badge>
              {product.brand && <Badge variant="outline" className="text-[10px]">{product.brand}</Badge>}
              <Badge variant={product.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">{product.status}</Badge>
            </div>
            <h2 className="text-xl font-bold">{product.name}</h2>
            {product.sku && <p className="text-xs text-muted-foreground font-mono mt-0.5">SKU: {product.sku}</p>}
          </div>

          {product.short_description && <p className="text-sm text-muted-foreground">{product.short_description}</p>}
          {product.description && <p className="text-sm">{product.description}</p>}

          <Separator />

          {/* Pricing */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Retail Price</p>
              <p className="text-lg font-bold">${Number(price).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cost</p>
              <p className="text-sm font-medium">${Number(product.cost_per_unit || 0).toFixed(2)}</p>
            </div>
            {margin && (
              <div>
                <p className="text-xs text-muted-foreground">Margin</p>
                <p className="text-sm font-medium text-emerald-600">{margin}%</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Stock */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">In Stock</p>
              <p className={cn('text-lg font-bold', product.quantity_in_stock <= product.reorder_point ? 'text-destructive' : '')}>
                {product.quantity_in_stock}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Reorder At</p>
              <p className="text-sm font-medium">{product.reorder_point}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Sold</p>
              <p className="text-sm font-medium">{product.total_sold || 0}</p>
            </div>
          </div>

          {product.supplier_name && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">Supplier</p>
                <p className="text-sm font-medium">{product.supplier_name}</p>
              </div>
            </>
          )}

          {/* Variants */}
          {product.variants?.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-2">Variants</p>
                <div className="space-y-1.5">
                  {product.variants.map((v: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm p-2 rounded bg-muted">
                      <span className="font-medium">{v.name}</span>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span>${Number(v.price).toFixed(2)}</span>
                        <span>{v.stock} units</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Tags */}
          {product.tags?.length > 0 && (
            <>
              <Separator />
              <div className="flex gap-1.5 flex-wrap">
                {product.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                ))}
              </div>
            </>
          )}

          {/* Recent Orders */}
          {productOrders.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-2">Recent Orders</p>
                <div className="space-y-1.5">
                  {productOrders.map((o: any) => (
                    <div key={o.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted">
                      <span className="font-mono text-xs">{o.order_number}</span>
                      <Badge variant="secondary" className="text-[10px]">{o.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Pencil, Copy, Archive, Package, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: any;
  onEdit: (product: any) => void;
  onDuplicate: (product: any) => void;
  onArchive: (product: any) => void;
  onClick: (product: any) => void;
}

const stockColor = (qty: number, reorder: number) =>
  qty <= 0 ? 'bg-destructive/10 text-destructive' :
  qty <= reorder ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';

export default function ProductCard({ product, onEdit, onDuplicate, onArchive, onClick }: ProductCardProps) {
  const firstImage = product.images?.[0];
  const price = product.retail_price ?? product.cost_per_unit ?? 0;

  return (
    <Card
      className="group cursor-pointer hover:shadow-md transition-all duration-200 overflow-hidden"
      onClick={() => onClick(product)}
    >
      {/* Image */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        {firstImage ? (
          <img src={firstImage} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}
        {product.featured && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-amber-500 text-white border-0 gap-1 text-[10px]">
              <Star className="w-3 h-3 fill-current" /> Featured
            </Badge>
          </div>
        )}
        {product.status === 'draft' && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="text-[10px]">Draft</Badge>
          </div>
        )}
        {product.status === 'archived' && (
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className="text-[10px] bg-background/80">Archived</Badge>
          </div>
        )}
        {/* Quick actions on hover */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button size="icon" variant="secondary" className="h-8 w-8 shadow-md">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(product); }}>
                <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(product); }}>
                <Copy className="w-3.5 h-3.5 mr-2" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive(product); }}>
                <Archive className="w-3.5 h-3.5 mr-2" /> Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CardContent className="p-3 space-y-2">
        {/* Category & Brand */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="secondary" className="text-[10px] font-normal">{product.category}</Badge>
          {product.brand && <Badge variant="outline" className="text-[10px] font-normal">{product.brand}</Badge>}
        </div>

        {/* Name */}
        <h3 className="text-sm font-semibold leading-tight line-clamp-2">{product.name}</h3>

        {/* SKU */}
        {product.sku && <p className="text-[10px] text-muted-foreground font-mono">SKU: {product.sku}</p>}

        {/* Price + Stock */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-base font-bold text-foreground">${Number(price).toFixed(2)}</span>
          <Badge className={cn('text-[10px] border-0', stockColor(product.quantity_in_stock, product.reorder_point))}>
            {product.quantity_in_stock <= 0 ? 'Out of stock' :
             product.quantity_in_stock <= product.reorder_point ? `Low: ${product.quantity_in_stock}` :
             `${product.quantity_in_stock} in stock`}
          </Badge>
        </div>

        {/* Tags */}
        {product.tags?.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {product.tags.slice(0, 3).map((tag: string) => (
              <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{tag}</span>
            ))}
            {product.tags.length > 3 && <span className="text-[9px] text-muted-foreground">+{product.tags.length - 3}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

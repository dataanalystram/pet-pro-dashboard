import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Clock, Eye, Copy, Sparkles, MapPin, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const categoryGradients: Record<string, string> = {
  grooming: 'from-blue-400 to-indigo-500', dental: 'from-emerald-400 to-teal-500',
  medical: 'from-red-400 to-rose-500', walking: 'from-amber-400 to-orange-500',
  boarding: 'from-violet-400 to-purple-500', training: 'from-orange-400 to-red-500',
  sitting: 'from-pink-400 to-rose-500', other: 'from-gray-400 to-slate-500',
};

const categoryColors: Record<string, string> = {
  grooming: 'bg-blue-100 text-blue-700', dental: 'bg-emerald-100 text-emerald-700',
  medical: 'bg-red-100 text-red-700', walking: 'bg-amber-100 text-amber-700',
  boarding: 'bg-violet-100 text-violet-700', training: 'bg-orange-100 text-orange-700',
  sitting: 'bg-pink-100 text-pink-700', other: 'bg-secondary text-secondary-foreground',
};

const currencySymbol = (c: string) => c === 'EUR' ? '€' : c === 'GBP' ? '£' : c === 'USD' ? '$' : c + ' ';

const locationLabels: Record<string, string> = {
  in_store: 'In-Store', mobile: 'Mobile', both: 'In-Store & Mobile',
};

interface Props {
  service: any;
  onEdit: () => void;
  onDelete: () => void;
  onPreview: () => void;
  onDuplicate: () => void;
}

export default function ServiceCard({ service: s, onEdit, onDelete, onPreview, onDuplicate }: Props) {
  const allPets = [...(s.pet_types_accepted || []), ...(s.custom_pet_types || [])];

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow group">
      <div className={cn('h-32 relative', !s.cover_image_url && `bg-gradient-to-br ${categoryGradients[s.category] || categoryGradients.other}`)}>
        {s.cover_image_url ? (
          <img src={s.cover_image_url} alt={s.name} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white/80 text-3xl font-bold">{s.name.charAt(0)}</span>
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
          <Badge className={cn('text-[10px] border-0', categoryColors[s.category] || categoryColors.other)}>{s.custom_category || s.category}</Badge>
          {s.featured && <Badge className="text-[10px] bg-amber-100 text-amber-700 border-0"><Sparkles className="w-3 h-3 mr-0.5" />Featured</Badge>}
          {s.difficulty_level && s.difficulty_level !== 'standard' && (
            <Badge className="text-[10px] bg-purple-100 text-purple-700 border-0 capitalize">{s.difficulty_level}</Badge>
          )}
        </div>
        {!s.is_active && <Badge variant="secondary" className="absolute top-2 right-2 text-[10px]">Inactive</Badge>}
      </div>

      <CardContent className="p-3 sm:p-4 space-y-2">
        <div>
          <p className="font-semibold text-sm">{s.name}</p>
          {s.short_description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.short_description}</p>}
        </div>

        <div className="flex items-center gap-3 text-sm">
          <span className="font-semibold text-foreground">
            {s.price_type === 'starting_from' ? 'From ' : ''}
            {currencySymbol(s.currency || 'EUR')}{Number(s.base_price).toFixed(2)}
            {s.price_type === 'hourly' ? '/hr' : ''}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground text-xs">
            <Clock className="w-3.5 h-3.5" />{s.duration_minutes}min
          </span>
        </div>

        {/* Location */}
        {s.service_location && s.service_location !== 'in_store' && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" /> {locationLabels[s.service_location] || s.service_location}
            {s.service_area_km && <span>({s.service_area_km}km)</span>}
          </div>
        )}

        {/* Add-ons count */}
        {s.service_addons && s.service_addons.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Plus className="w-3 h-3" /> {s.service_addons.length} add-on{s.service_addons.length !== 1 ? 's' : ''} available
          </div>
        )}

        {/* Highlights */}
        {s.highlights && s.highlights.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {s.highlights.slice(0, 3).map((h: string, i: number) => (
              <span key={i} className="inline-flex items-center gap-0.5 text-[10px] text-primary bg-accent rounded-full px-2 py-0.5">✓ {h}</span>
            ))}
            {s.highlights.length > 3 && <span className="text-[10px] text-muted-foreground">+{s.highlights.length - 3} more</span>}
          </div>
        )}

        {/* Pet types */}
        {allPets.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {allPets.slice(0, 5).map((p: string) => (
              <span key={p} className="text-[10px] bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 capitalize">{p}</span>
            ))}
            {allPets.length > 5 && <span className="text-[10px] text-muted-foreground">+{allPets.length - 5} more</span>}
          </div>
        )}

        <div className="flex gap-1.5 pt-1">
          <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={onEdit}><Pencil className="w-3 h-3 mr-1" />Edit</Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onPreview}><Eye className="w-3 h-3" /></Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onDuplicate}><Copy className="w-3 h-3" /></Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onDelete}><Trash2 className="w-3 h-3 text-destructive" /></Button>
        </div>
      </CardContent>
    </Card>
  );
}

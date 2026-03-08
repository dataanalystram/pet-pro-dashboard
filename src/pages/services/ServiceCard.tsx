import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Clock, Eye, Copy, Sparkles, MapPin, Plus, Star, Share2 } from 'lucide-react';
import { toast } from 'sonner';
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
  staffCount?: number;
  onEdit: () => void;
  onDelete: () => void;
  onPreview: () => void;
  onDuplicate: () => void;
}

export default function ServiceCard({ service: s, staffCount = 0, onEdit, onDelete, onPreview, onDuplicate }: Props) {
  const allPets = [...(s.pet_types_accepted || []), ...(s.custom_pet_types || [])];

  return (
    <Card className="overflow-hidden group hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      {/* Image with overlay */}
      <div className={cn('h-36 relative overflow-hidden', !s.cover_image_url && `bg-gradient-to-br ${categoryGradients[s.category] || categoryGradients.other}`)}>
        {s.cover_image_url ? (
          <img src={s.cover_image_url} alt={s.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white/60 text-4xl font-bold">{s.name.charAt(0)}</span>
          </div>
        )}
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
          <Badge className={cn('text-[10px] border-0', categoryColors[s.category] || categoryColors.other)}>{s.custom_category || s.category}</Badge>
          {s.featured && <Badge className="text-[10px] bg-amber-400/90 text-amber-900 border-0 backdrop-blur-sm"><Sparkles className="w-3 h-3 mr-0.5" />Featured</Badge>}
          {s.difficulty_level && s.difficulty_level !== 'standard' && (
            <Badge className="text-[10px] bg-purple-100 text-purple-700 border-0 capitalize">{s.difficulty_level}</Badge>
          )}
        </div>
        {!s.is_active && <Badge variant="secondary" className="absolute top-2 right-2 text-[10px]">Inactive</Badge>}

        {/* Price overlay on image */}
        <div className="absolute bottom-2 right-2 bg-background/20 backdrop-blur-md rounded-full px-2.5 py-1 border border-white/20">
          <span className="text-xs font-bold text-white">
            {s.price_type === 'starting_from' ? 'From ' : ''}
            {currencySymbol(s.currency || 'EUR')}{Number(s.base_price).toFixed(2)}
          </span>
        </div>

        {/* Duration pill */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-background/20 backdrop-blur-md rounded-full px-2 py-0.5 border border-white/20">
          <Clock className="w-3 h-3 text-white" />
          <span className="text-[10px] font-medium text-white">{s.duration_minutes}min</span>
        </div>
      </div>

      <CardContent className="p-3 sm:p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">{s.name}</p>
            {s.short_description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.short_description}</p>}
          </div>
          {/* Star rating */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {[1,2,3,4,5].map(i => <Star key={i} className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />)}
          </div>
        </div>

        {/* Location */}
        {s.service_location && s.service_location !== 'in_store' && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" /> {locationLabels[s.service_location] || s.service_location}
            {s.service_area_km && <span>({s.service_area_km}km)</span>}
          </div>
        )}

        {/* Add-ons & Staff count */}
        <div className="flex flex-wrap gap-3">
          {s.service_addons && s.service_addons.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Plus className="w-3 h-3" /> {s.service_addons.length} add-on{s.service_addons.length !== 1 ? 's' : ''}
            </div>
          )}
          {staffCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="w-3 h-3 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">{staffCount}</span>
              staff assigned
            </div>
          )}
        </div>

        {/* Highlights */}
        {s.highlights && s.highlights.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {s.highlights.slice(0, 3).map((h: string, i: number) => (
              <span key={i} className="inline-flex items-center gap-0.5 text-[10px] text-accent-foreground bg-accent rounded-full px-2 py-0.5">✓ {h}</span>
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

        <div className="flex gap-1 sm:gap-1.5 pt-1">
          <Button variant="outline" size="sm" className="flex-1 h-7 sm:h-8 text-[10px] sm:text-xs px-2" onClick={onEdit}><Pencil className="w-3 h-3 mr-0.5 sm:mr-1" />Edit</Button>
          <Button variant="outline" size="sm" className="h-7 sm:h-8 text-[10px] sm:text-xs px-1.5" onClick={onPreview}><Eye className="w-3 h-3" /></Button>
          <Button variant="outline" size="sm" className="h-7 sm:h-8 text-[10px] sm:text-xs px-1.5" onClick={onDuplicate}><Copy className="w-3 h-3" /></Button>
          <Button variant="outline" size="sm" className="h-7 sm:h-8 text-[10px] sm:text-xs px-1.5" onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(`${window.location.origin}/book/${s.id}`);
            toast.success('Booking link copied to clipboard!');
          }}><Share2 className="w-3 h-3 text-primary" /></Button>
          <Button variant="outline" size="sm" className="h-7 sm:h-8 text-[10px] sm:text-xs px-1.5" onClick={onDelete}><Trash2 className="w-3 h-3 text-destructive" /></Button>
        </div>
      </CardContent>
    </Card>
  );
}

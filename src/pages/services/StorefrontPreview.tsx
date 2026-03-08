import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Monitor, Tablet, Clock, Sparkles, ChevronUp, ChevronDown, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

const currencySymbol = (c: string) => c === 'EUR' ? '€' : c === 'GBP' ? '£' : c === 'USD' ? '$' : c + ' ';

const categoryGradients: Record<string, string> = {
  grooming: 'from-blue-400 to-indigo-500', dental: 'from-emerald-400 to-teal-500',
  medical: 'from-red-400 to-rose-500', walking: 'from-amber-400 to-orange-500',
  boarding: 'from-violet-400 to-purple-500', training: 'from-orange-400 to-red-500',
  sitting: 'from-pink-400 to-rose-500', other: 'from-gray-400 to-slate-500',
};

const locationLabels: Record<string, string> = {
  in_store: 'In-Store', mobile: 'Mobile', both: 'In-Store & Mobile',
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: any[];
  onReorder: (id: string, newOrder: number) => void;
}

export default function StorefrontPreview({ open, onOpenChange, services, onReorder }: Props) {
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  const activeServices = useMemo(() => {
    return services
      .filter((s: any) => s.is_active)
      .sort((a: any, b: any) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return (a.display_order || 0) - (b.display_order || 0);
      });
  }, [services]);

  const featured = activeServices.filter((s: any) => s.featured);
  const categories = useMemo(() => {
    const cats: Record<string, any[]> = {};
    activeServices.forEach((s: any) => {
      const catName = s.custom_category || s.category;
      if (!cats[catName]) cats[catName] = [];
      cats[catName].push(s);
    });
    return cats;
  }, [activeServices]);

  const frameWidth = device === 'mobile' ? 'max-w-[375px]' : device === 'tablet' ? 'max-w-[768px]' : 'max-w-[1200px]';

  const moveUp = (s: any) => {
    const idx = activeServices.findIndex((srv: any) => srv.id === s.id);
    if (idx <= 0) return;
    const prevOrder = activeServices[idx - 1].display_order || 0;
    onReorder(s.id, prevOrder - 1);
  };

  const moveDown = (s: any) => {
    const idx = activeServices.findIndex((srv: any) => srv.id === s.id);
    if (idx >= activeServices.length - 1) return;
    const nextOrder = activeServices[idx + 1].display_order || 0;
    onReorder(s.id, nextOrder + 1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Customer Storefront Preview</span>
            <div className="flex gap-1">
              {([['mobile', Smartphone], ['tablet', Tablet], ['desktop', Monitor]] as const).map(([key, Icon]) => (
                <Button key={key} variant={device === key ? 'default' : 'outline'} size="sm" className="h-8" onClick={() => setDevice(key)}>
                  <Icon className="w-4 h-4" />
                </Button>
              ))}
            </div>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">Use arrows to reorder services. Changes save automatically.</p>
        </DialogHeader>

        <div className="flex justify-center py-4">
          <div className={cn(
            'w-full border rounded-2xl overflow-hidden bg-background shadow-lg transition-all',
            frameWidth,
            device === 'mobile' && 'border-[8px] border-foreground/10 rounded-[2rem]'
          )}>
            {/* Storefront Header */}
            <div className="bg-primary text-primary-foreground px-6 py-8 text-center">
              <h1 className="text-2xl font-bold">Our Services</h1>
              <p className="text-sm mt-1 opacity-80">Professional pet care tailored to your furry, feathered, or scaly friend</p>
            </div>

            {/* Featured Banner */}
            {featured.length > 0 && (
              <div className="px-4 py-6">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-5 h-5 text-amber-500" /> Featured Services
                </h2>
                <div className={cn('grid gap-3', device === 'mobile' ? 'grid-cols-1' : device === 'tablet' ? 'grid-cols-2' : 'grid-cols-3')}>
                  {featured.map((s: any) => (
                    <ServiceStorefrontCard key={s.id} service={s} onMoveUp={() => moveUp(s)} onMoveDown={() => moveDown(s)} featured />
                  ))}
                </div>
              </div>
            )}

            {/* By Category */}
            <div className="px-4 pb-8 space-y-6">
              {Object.entries(categories).map(([cat, svcs]) => (
                <div key={cat}>
                  <h2 className="text-lg font-semibold capitalize mb-3 border-b pb-2">{cat}</h2>
                  <div className={cn('grid gap-3', device === 'mobile' ? 'grid-cols-1' : device === 'tablet' ? 'grid-cols-2' : 'grid-cols-3')}>
                    {svcs.map((s: any) => (
                      <ServiceStorefrontCard key={s.id} service={s} onMoveUp={() => moveUp(s)} onMoveDown={() => moveDown(s)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {activeServices.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-lg font-medium">No active services</p>
                <p className="text-sm mt-1">Activate services to see them in your storefront</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ServiceStorefrontCard({ service: s, onMoveUp, onMoveDown, featured = false }: { service: any; onMoveUp: () => void; onMoveDown: () => void; featured?: boolean }) {
  const curr = currencySymbol(s.currency || 'EUR');
  const allPets = [...(s.pet_types_accepted || []), ...(s.custom_pet_types || [])];
  const addons = s.service_addons || [];

  return (
    <div className={cn(
      'rounded-xl border overflow-hidden bg-card hover:shadow-md transition-shadow relative group',
      featured && 'ring-2 ring-amber-400/50'
    )}>
      {/* Reorder Controls */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="secondary" size="icon" className="h-6 w-6" onClick={onMoveUp}><ChevronUp className="w-3 h-3" /></Button>
        <Button variant="secondary" size="icon" className="h-6 w-6" onClick={onMoveDown}><ChevronDown className="w-3 h-3" /></Button>
      </div>

      {/* Image */}
      <div className={cn('h-36 relative', !s.cover_image_url && `bg-gradient-to-br ${categoryGradients[s.category] || categoryGradients.other}`)}>
        {s.cover_image_url ? (
          <img src={s.cover_image_url} alt={s.name} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white/60 text-4xl font-bold">{s.name.charAt(0)}</span>
          </div>
        )}
        {featured && (
          <Badge className="absolute top-2 left-2 text-[10px] bg-amber-100 text-amber-700 border-0">
            <Sparkles className="w-3 h-3 mr-0.5" />Featured
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <div>
          <p className="font-semibold text-sm">{s.name}</p>
          {s.short_description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.short_description}</p>}
        </div>

        <div className="flex items-center gap-3 text-sm">
          <span className="font-bold text-foreground">
            {s.price_type === 'starting_from' ? 'From ' : ''}{curr}{Number(s.base_price).toFixed(2)}
            {s.price_type === 'hourly' ? '/hr' : ''}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground text-xs">
            <Clock className="w-3.5 h-3.5" />{s.duration_minutes}min
          </span>
        </div>

        {s.service_location && s.service_location !== 'in_store' && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" /> {locationLabels[s.service_location] || s.service_location}
          </div>
        )}

        {s.highlights && s.highlights.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {s.highlights.slice(0, 2).map((h: string, i: number) => (
              <span key={i} className="inline-flex items-center text-[10px] text-primary bg-accent rounded-full px-2 py-0.5">✓ {h}</span>
            ))}
            {s.highlights.length > 2 && <span className="text-[10px] text-muted-foreground">+{s.highlights.length - 2} more</span>}
          </div>
        )}

        {allPets.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {allPets.slice(0, 4).map((p: string) => (
              <span key={p} className="text-[10px] bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 capitalize">{p}</span>
            ))}
            {allPets.length > 4 && <span className="text-[10px] text-muted-foreground">+{allPets.length - 4}</span>}
          </div>
        )}

        {addons.length > 0 && (
          <p className="text-[10px] text-muted-foreground">+ {addons.length} optional add-on{addons.length !== 1 ? 's' : ''}</p>
        )}

        <Button className="w-full mt-2" size="sm">Book Now</Button>
      </div>
    </div>
  );
}

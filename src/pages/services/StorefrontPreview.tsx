import { useState, useMemo, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Monitor, Tablet, Clock, Sparkles, ChevronUp, ChevronDown, MapPin, Star, ChevronLeft, ChevronRight, X, Shield, Heart, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

const currencySymbol = (c: string) => c === 'EUR' ? '€' : c === 'GBP' ? '£' : c === 'USD' ? '$' : c + ' ';

const categoryGradients: Record<string, string> = {
  grooming: 'from-blue-400 to-indigo-500', dental: 'from-emerald-400 to-teal-500',
  medical: 'from-red-400 to-rose-500', walking: 'from-amber-400 to-orange-500',
  boarding: 'from-violet-400 to-purple-500', training: 'from-orange-400 to-red-500',
  sitting: 'from-pink-400 to-rose-500', other: 'from-gray-400 to-slate-500',
};

const categoryEmojis: Record<string, string> = {
  grooming: '✂️', dental: '🦷', medical: '🏥', walking: '🐕', boarding: '🏠',
  training: '🎓', sitting: '🐾', other: '🌟',
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
  const [selectedService, setSelectedService] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const catScrollRef = useRef<HTMLDivElement>(null);

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

  const categoryList = useMemo(() => {
    const cats = new Map<string, number>();
    activeServices.forEach((s: any) => {
      const cat = s.custom_category || s.category;
      cats.set(cat, (cats.get(cat) || 0) + 1);
    });
    return Array.from(cats.entries()).map(([name, count]) => ({ name, count }));
  }, [activeServices]);

  const filteredServices = useMemo(() => {
    if (activeCategory === 'all') return activeServices;
    return activeServices.filter((s: any) => (s.custom_category || s.category) === activeCategory);
  }, [activeServices, activeCategory]);

  const frameWidth = device === 'mobile' ? 'max-w-[390px]' : device === 'tablet' ? 'max-w-[768px]' : 'max-w-[1200px]';

  const moveUp = (s: any) => {
    const idx = activeServices.findIndex((srv: any) => srv.id === s.id);
    if (idx <= 0) return;
    onReorder(s.id, (activeServices[idx - 1].display_order || 0) - 1);
  };
  const moveDown = (s: any) => {
    const idx = activeServices.findIndex((srv: any) => srv.id === s.id);
    if (idx >= activeServices.length - 1) return;
    onReorder(s.id, (activeServices[idx + 1].display_order || 0) + 1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] max-h-[98vh] overflow-y-auto p-0 gap-0">
        {/* Toolbar */}
        <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-sm">Customer Storefront Preview</h2>
            <p className="text-[11px] text-muted-foreground">Hover cards to reorder • Click to view detail</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5 bg-muted rounded-lg p-0.5">
              {([['mobile', Smartphone], ['tablet', Tablet], ['desktop', Monitor]] as const).map(([key, Icon]) => (
                <button key={key} onClick={() => setDevice(key)} className={cn(
                  'p-1.5 rounded-md transition-all',
                  device === key ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}>
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex justify-center py-6 px-4 bg-muted/30">
          <div className={cn(
            'w-full transition-all duration-300 overflow-hidden',
            frameWidth,
            device === 'mobile' ? 'border-[6px] border-foreground/10 rounded-[2.5rem] shadow-2xl' : 'rounded-2xl border shadow-lg',
            'bg-background'
          )}>
            {/* Hero Banner */}
            <div className="relative overflow-hidden">
              <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/70 px-6 py-10 sm:py-14 text-center relative">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                <h1 className={cn('font-extrabold text-primary-foreground relative', device === 'mobile' ? 'text-2xl' : 'text-4xl')}>
                  Our Services
                </h1>
                <p className={cn('text-primary-foreground/80 mt-2 relative', device === 'mobile' ? 'text-xs' : 'text-sm')}>
                  Premium pet care tailored to every furry, feathered & scaly friend
                </p>
                {/* Trust Badges */}
                <div className={cn('flex items-center justify-center gap-3 mt-5 relative', device === 'mobile' ? 'gap-2' : 'gap-4')}>
                  {[
                    { icon: Star, text: '4.9★ Rated' },
                    { icon: Heart, text: '500+ Happy Pets' },
                    { icon: Award, text: 'Certified Pros' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-1 bg-primary-foreground/15 backdrop-blur-sm rounded-full px-3 py-1.5">
                      <Icon className="w-3 h-3 text-primary-foreground" />
                      <span className="text-[10px] font-semibold text-primary-foreground">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Category Navigation */}
            {categoryList.length > 0 && (
              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
                <div ref={catScrollRef} className="flex gap-1.5 px-4 py-3 overflow-x-auto scrollbar-hide">
                  <button
                    onClick={() => setActiveCategory('all')}
                    className={cn(
                      'flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all',
                      activeCategory === 'all'
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-muted text-muted-foreground hover:bg-accent'
                    )}
                  >
                    All Services
                  </button>
                  {categoryList.map(({ name, count }) => (
                    <button
                      key={name}
                      onClick={() => setActiveCategory(name)}
                      className={cn(
                        'flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap',
                        activeCategory === name
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'bg-muted text-muted-foreground hover:bg-accent'
                      )}
                    >
                      {categoryEmojis[name] || '🌟'} {name} ({count})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Featured Section */}
            {featured.length > 0 && activeCategory === 'all' && (
              <div className="px-4 pt-6 pb-2">
                <h2 className={cn('font-bold flex items-center gap-1.5 mb-4', device === 'mobile' ? 'text-base' : 'text-lg')}>
                  <Sparkles className="w-5 h-5 text-amber-500" /> Featured
                </h2>
                <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory">
                  {featured.map((s: any) => (
                    <FeaturedCard key={s.id} service={s} device={device} onClick={() => setSelectedService(s)} onMoveUp={() => moveUp(s)} onMoveDown={() => moveDown(s)} />
                  ))}
                </div>
              </div>
            )}

            {/* Service Grid */}
            <div className="px-4 pb-8 pt-4">
              <div className={cn('grid gap-4',
                device === 'mobile' ? 'grid-cols-1' : device === 'tablet' ? 'grid-cols-2' : 'grid-cols-3'
              )}>
                {filteredServices.map((s: any) => (
                  <StorefrontCard key={s.id} service={s} onClick={() => setSelectedService(s)} onMoveUp={() => moveUp(s)} onMoveDown={() => moveDown(s)} />
                ))}
              </div>
            </div>

            {activeServices.length === 0 && (
              <div className="text-center py-20 text-muted-foreground">
                <p className="text-lg font-medium">No active services</p>
                <p className="text-sm mt-1">Activate services to see them in your storefront</p>
              </div>
            )}
          </div>
        </div>

        {/* Inline Service Detail Overlay */}
        {selectedService && (
          <StorefrontDetailOverlay service={selectedService} allServices={activeServices} onClose={() => setSelectedService(null)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ─── Featured Card (larger, hero-style) ─── */
function FeaturedCard({ service: s, device, onClick, onMoveUp, onMoveDown }: { service: any; device: string; onClick: () => void; onMoveUp: () => void; onMoveDown: () => void }) {
  const curr = currencySymbol(s.currency || 'EUR');
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex-shrink-0 snap-center rounded-2xl overflow-hidden relative group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl',
        device === 'mobile' ? 'w-[85%]' : 'w-72'
      )}
    >
      {/* Reorder */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="secondary" size="icon" className="h-6 w-6 bg-background/80 backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); onMoveUp(); }}><ChevronUp className="w-3 h-3" /></Button>
        <Button variant="secondary" size="icon" className="h-6 w-6 bg-background/80 backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); onMoveDown(); }}><ChevronDown className="w-3 h-3" /></Button>
      </div>

      <div className={cn('h-48 relative', !s.cover_image_url && `bg-gradient-to-br ${categoryGradients[s.category] || categoryGradients.other}`)}>
        {s.cover_image_url ? (
          <img src={s.cover_image_url} alt={s.name} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white/40 text-5xl font-bold">{s.name.charAt(0)}</span>
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* Featured badge */}
        <Badge className="absolute top-3 left-3 text-[10px] bg-amber-400/90 text-amber-900 border-0 backdrop-blur-sm">
          <Sparkles className="w-3 h-3 mr-0.5" />Featured
        </Badge>
        
        {/* Price badge - glassmorphism */}
        <div className="absolute top-3 right-3 bg-background/20 backdrop-blur-md rounded-full px-3 py-1 border border-white/20 opacity-0 group-hover:opacity-0">
          <span className="text-sm font-bold text-white">{curr}{Number(s.base_price).toFixed(2)}</span>
        </div>
        
        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-white font-bold text-base">{s.name}</p>
          {s.short_description && <p className="text-white/70 text-xs mt-0.5 line-clamp-1">{s.short_description}</p>}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-white font-bold text-sm">{curr}{Number(s.base_price).toFixed(2)}</span>
            <span className="flex items-center gap-1 text-white/70 text-xs">
              <Clock className="w-3 h-3" />{s.duration_minutes}min
            </span>
            <div className="flex items-center gap-0.5 text-amber-400">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-2.5 h-2.5 fill-current" />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Standard Storefront Card ─── */
function StorefrontCard({ service: s, onClick, onMoveUp, onMoveDown }: { service: any; onClick: () => void; onMoveUp: () => void; onMoveDown: () => void }) {
  const curr = currencySymbol(s.currency || 'EUR');
  const allPets = [...(s.pet_types_accepted || []), ...(s.custom_pet_types || [])];
  const addons = s.service_addons || [];

  return (
    <div
      onClick={onClick}
      className="rounded-2xl overflow-hidden bg-card border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group relative"
    >
      {/* Reorder */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="secondary" size="icon" className="h-6 w-6 bg-background/80 backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); onMoveUp(); }}><ChevronUp className="w-3 h-3" /></Button>
        <Button variant="secondary" size="icon" className="h-6 w-6 bg-background/80 backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); onMoveDown(); }}><ChevronDown className="w-3 h-3" /></Button>
      </div>

      {/* Image */}
      <div className={cn('h-44 relative overflow-hidden', !s.cover_image_url && `bg-gradient-to-br ${categoryGradients[s.category] || categoryGradients.other}`)}>
        {s.cover_image_url ? (
          <img src={s.cover_image_url} alt={s.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white/40 text-5xl font-bold">{s.name.charAt(0)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Badges on image */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          {s.featured && (
            <Badge className="text-[10px] bg-amber-400/90 text-amber-900 border-0 backdrop-blur-sm">
              <Sparkles className="w-3 h-3 mr-0.5" />Featured
            </Badge>
          )}
        </div>

        {/* Duration pill */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-background/20 backdrop-blur-md rounded-full px-2.5 py-1 border border-white/20">
          <Clock className="w-3 h-3 text-white" />
          <span className="text-[11px] font-medium text-white">{s.duration_minutes}min</span>
        </div>

        {/* Price on image */}
        <div className="absolute bottom-3 right-3 bg-background/20 backdrop-blur-md rounded-full px-3 py-1 border border-white/20">
          <span className="text-sm font-bold text-white">
            {s.price_type === 'starting_from' ? 'From ' : ''}{curr}{Number(s.base_price).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2.5">
        <div>
          <div className="flex items-center justify-between">
            <p className="font-bold text-sm">{s.name}</p>
            <div className="flex items-center gap-0.5 text-amber-500">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-current" />)}
            </div>
          </div>
          {s.short_description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.short_description}</p>}
        </div>

        {s.service_location && s.service_location !== 'in_store' && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" /> {locationLabels[s.service_location] || s.service_location}
          </div>
        )}

        {/* Highlights */}
        {s.highlights && s.highlights.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {s.highlights.slice(0, 2).map((h: string, i: number) => (
              <span key={i} className="inline-flex items-center text-[10px] text-accent-foreground bg-accent rounded-full px-2 py-0.5">✓ {h}</span>
            ))}
            {s.highlights.length > 2 && <span className="text-[10px] text-muted-foreground">+{s.highlights.length - 2}</span>}
          </div>
        )}

        {/* Pet types row */}
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

        <Button className="w-full mt-1 rounded-xl font-semibold" size="sm">Book Now</Button>
      </div>
    </div>
  );
}

/* ─── Detail Overlay (shown when clicking a card) ─── */
function StorefrontDetailOverlay({ service: s, allServices, onClose }: { service: any; allServices: any[]; onClose: () => void }) {
  const [selectedAddons, setSelectedAddons] = useState<Set<number>>(new Set());
  const curr = currencySymbol(s.currency || 'EUR');
  const addons = s.service_addons || [];
  const allPets = [...(s.pet_types_accepted || []), ...(s.custom_pet_types || [])];
  
  const addonTotal = addons.reduce((sum: number, a: any, i: number) => selectedAddons.has(i) ? sum + Number(a.price) : sum, 0);
  const total = Number(s.base_price) + addonTotal;

  const recs = allServices.filter((srv: any) => s.recommended_services?.includes(srv.id) && srv.id !== s.id);

  const toggleAddon = (i: number) => {
    setSelectedAddons(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-start justify-center sm:overflow-y-auto">
      <div className="w-full sm:max-w-4xl bg-background rounded-t-2xl sm:rounded-2xl sm:my-8 shadow-2xl border overflow-hidden max-h-[95vh] sm:max-h-none overflow-y-auto pb-20 sm:pb-0">
        {/* Hero */}
        <div className="relative h-44 sm:h-72">
          {s.cover_image_url ? (
            <img src={s.cover_image_url} alt={s.name} className="w-full h-full object-cover" />
          ) : (
            <div className={cn('w-full h-full bg-gradient-to-br', categoryGradients[s.category] || categoryGradients.other)} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <Button variant="ghost" size="icon" className="absolute top-4 right-4 bg-background/20 backdrop-blur-sm text-white hover:bg-background/40 rounded-full" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <Badge className="text-[10px] mb-2 capitalize bg-primary/90 text-primary-foreground">{s.custom_category || s.category}</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{s.name}</h2>
            {s.short_description && <p className="text-white/80 text-sm mt-1">{s.short_description}</p>}
          </div>
        </div>

        {/* Gallery */}
        {s.gallery_urls && s.gallery_urls.length > 0 && (
          <div className="flex gap-2 p-4 overflow-x-auto">
            {s.gallery_urls.map((url: string, i: number) => (
              <img key={i} src={url} alt="" className="w-20 h-20 rounded-xl object-cover flex-shrink-0 border-2 border-transparent hover:border-primary transition-all cursor-pointer" />
            ))}
          </div>
        )}

        {/* Two-column layout */}
        <div className="flex flex-col sm:flex-row gap-6 p-6">
          {/* Left: Content */}
          <div className="flex-1 space-y-6 min-w-0">
            {/* Highlights */}
            {s.highlights && s.highlights.length > 0 && (
              <div className="bg-accent/50 rounded-2xl p-5 space-y-3">
                <h3 className="font-bold text-sm">What's Included</h3>
                <div className="grid gap-2">
                  {s.highlights.map((h: string, i: number) => (
                    <div key={i} className="flex items-start gap-2.5 text-sm">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-primary text-xs">✓</span>
                      </div>
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {(s.long_description || s.description) && (
              <div className="space-y-2">
                <h3 className="font-bold text-sm">About This Service</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{s.long_description || s.description}</p>
              </div>
            )}

            {/* Pet Requirements */}
            {(s.vaccination_required || allPets.length > 0) && (
              <div className="space-y-3">
                <h3 className="font-bold text-sm">Pet Requirements</h3>
                {s.vaccination_required && (
                  <div className="flex items-center gap-2 text-sm"><Shield className="w-4 h-4 text-emerald-500" /> Vaccinations required</div>
                )}
                {allPets.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {allPets.map((p: string) => (
                      <Badge key={p} variant="secondary" className="text-xs capitalize">{p}</Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Customer Reviews */}
            <div className="space-y-5">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Customer Reviews
              </h3>
              
              {/* Rating Summary */}
              <div className="bg-accent/50 rounded-2xl p-5 flex items-center gap-6">
                <div className="text-center">
                  <div className="text-4xl font-extrabold">4.9</div>
                  <div className="flex items-center gap-0.5 mt-1">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">128 reviews</p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {[
                    { stars: 5, pct: 85 },
                    { stars: 4, pct: 10 },
                    { stars: 3, pct: 3 },
                    { stars: 2, pct: 1 },
                    { stars: 1, pct: 1 },
                  ].map(({ stars, pct }) => (
                    <div key={stars} className="flex items-center gap-2 text-xs">
                      <span className="w-3 text-muted-foreground">{stars}</span>
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-8 text-right text-muted-foreground">{pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Individual Reviews */}
              <div className="space-y-3">
                {[
                  { name: 'Sarah M.', rating: 5, date: '2 weeks ago', text: 'Amazing grooming service! My poodle looks absolutely fantastic. The staff was so gentle and caring.', pet: '🐩 Poodle' },
                  { name: 'James K.', rating: 5, date: '1 month ago', text: 'Very professional and caring staff. They took the time to explain everything. Highly recommend!', pet: '🐕 Golden Retriever' },
                  { name: 'Emily R.', rating: 4, date: '1 month ago', text: 'Great service overall, my cat was calm the whole time. Will definitely come back for another session.', pet: '🐱 Persian Cat' },
                  { name: 'Michael T.', rating: 5, date: '2 months ago', text: 'Best pet care in town. Been coming here for 2 years and the quality has always been consistently excellent.', pet: '🐕 Labrador' },
                ].map((review, i) => (
                  <div key={i} className="bg-card border rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {review.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{review.name}</p>
                          <p className="text-[11px] text-muted-foreground">{review.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(j => (
                          <Star key={j} className={cn('w-3 h-3', j <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-muted')} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{review.text}</p>
                    <span className="inline-block text-[10px] bg-secondary text-secondary-foreground rounded-full px-2 py-0.5">{review.pet}</span>
                  </div>
                ))}
              </div>

              <button className="text-sm text-primary font-medium hover:underline">See all 128 reviews →</button>
            </div>

            {/* FAQ */}
            {s.faq && s.faq.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-sm">Frequently Asked Questions</h3>
                <div className="space-y-2">
                  {s.faq.map((f: any, i: number) => (
                    <details key={i} className="group bg-muted/50 rounded-xl">
                      <summary className="px-4 py-3 text-sm font-medium cursor-pointer list-none flex items-center justify-between">
                        {f.question}
                        <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180" />
                      </summary>
                      <p className="px-4 pb-3 text-sm text-muted-foreground">{f.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Sticky Booking Card */}
          <div className="sm:w-80 flex-shrink-0">
            <div className="sm:sticky sm:top-4 bg-card border rounded-2xl p-5 space-y-4 shadow-lg">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold">{curr}{total.toFixed(2)}</span>
                  {s.price_type === 'hourly' && <span className="text-muted-foreground text-sm">/hr</span>}
                </div>
                {Number(s.tax_rate) > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">{s.tax_inclusive ? 'Incl.' : 'Excl.'} {s.tax_rate}% VAT</p>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {s.duration_minutes}min</span>
                {s.service_location && (
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {locationLabels[s.service_location] || s.service_location}</span>
                )}
              </div>

              {/* Availability */}
              {s.available_days && (
                <div className="flex flex-wrap gap-1">
                  {s.available_days.map((d: string) => (
                    <span key={d} className="text-[10px] bg-muted rounded px-1.5 py-0.5 capitalize">{d.slice(0, 3)}</span>
                  ))}
                </div>
              )}

              {/* Interactive Add-ons */}
              {addons.length > 0 && (
                <div className="space-y-2 border-t pt-3">
                  <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">Add-ons</h4>
                  {addons.map((a: any, i: number) => (
                    <label key={i} className={cn(
                      'flex items-center justify-between rounded-xl px-3 py-2.5 text-sm cursor-pointer transition-all border',
                      selectedAddons.has(i) ? 'bg-primary/5 border-primary/30' : 'bg-muted/50 border-transparent hover:bg-muted'
                    )}>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={selectedAddons.has(i)} onChange={() => toggleAddon(i)} className="rounded border-primary text-primary focus:ring-primary w-4 h-4" />
                        <span>{a.name}</span>
                      </div>
                      <span className="font-semibold text-xs">+{curr}{Number(a.price).toFixed(2)}</span>
                    </label>
                  ))}
                </div>
              )}

              {s.deposit_required && s.deposit_amount && (
                <p className="text-xs text-muted-foreground">
                  {s.deposit_type === 'percentage' ? `${s.deposit_amount}%` : `${curr}${Number(s.deposit_amount).toFixed(2)}`} deposit required
                </p>
              )}

              <Button className="w-full rounded-xl h-12 font-bold text-base" size="lg">Book Now</Button>
              
              {/* Social proof */}
              <div className="flex items-center gap-2 justify-center pt-1">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full bg-muted border-2 border-card" />
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">120+ booked this month</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {recs.length > 0 && (
          <div className="px-6 pb-8">
            <h3 className="font-bold text-base mb-4">You Might Also Like</h3>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {recs.map((r: any) => (
                <div key={r.id} className="flex-shrink-0 w-52 rounded-2xl border overflow-hidden bg-card hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer">
                  <div className={cn('h-28 relative', !r.cover_image_url && `bg-gradient-to-br ${categoryGradients[r.category] || categoryGradients.other}`)}>
                    {r.cover_image_url ? (
                      <img src={r.cover_image_url} alt={r.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-white/40 font-bold text-2xl">{r.name.charAt(0)}</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-2 right-2 bg-background/20 backdrop-blur-md rounded-full px-2 py-0.5 border border-white/20">
                      <span className="text-xs font-bold text-white">{currencySymbol(r.currency || 'EUR')}{Number(r.base_price).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold truncate">{r.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{r.duration_minutes}min</span>
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(i => <Star key={i} className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />)}
                        <span className="text-[10px] text-muted-foreground ml-0.5">4.9</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

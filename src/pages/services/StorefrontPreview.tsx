import { useState, useMemo, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Monitor, Tablet, Clock, Sparkles, ChevronUp, ChevronDown, MapPin, Star, ChevronLeft, ChevronRight, X, Shield, Heart, Award, Crown, Package as PackageIcon, Tag, Flame, CheckCircle2, Gift, Palette, Phone, Mail, Instagram, Facebook, Youtube, MessageCircle, ChevronDown as ChevronDown2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReviews, useCampaigns } from '@/hooks/use-supabase-data';
import { usePlans, usePrepaidPackages, useSeasonalOffers } from '@/pages/memberships/hooks/useMembershipData';
import { useStorefrontSettings } from '@/hooks/useStorefrontSettings';
import StorefrontCustomizer from './StorefrontCustomizer';
import { format } from 'date-fns';

const ICON_MAP: Record<string, any> = { Star, Heart, Award, Shield, Crown, Sparkles, CheckCircle2 };



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
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const catScrollRef = useRef<HTMLDivElement>(null);

  const { data: plans = [] } = usePlans();
  const { data: packages = [] } = usePrepaidPackages();
  const { data: offers = [] } = useSeasonalOffers();
  const { data: campaigns = [] } = useCampaigns();
  const { data: settings } = useStorefrontSettings();
  const vis = settings?.section_visibility || {};
  const isOn = (k: string) => vis[k] !== false;



  const activePlans = useMemo(() => plans.filter((p: any) => p.status === 'active'), [plans]);
  const activePackages = useMemo(() => packages.filter((p: any) => p.active), [packages]);
  const liveOffers = useMemo(() => offers.filter((o: any) => o.status === 'live'), [offers]);
  const activePromos = useMemo(
    () => campaigns.filter((c: any) => c.is_enabled && c.status === 'active'),
    [campaigns]
  );

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
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setCustomizerOpen(true)}>
              <Palette className="w-3.5 h-3.5" /> Customize
            </Button>
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
            {/* Announcement bar */}
            {settings?.announcement_enabled && settings.announcement_text && isOn('announcement') && (
              <div className="text-center py-2 text-[12px] font-semibold" style={{ background: settings.announcement_bg || '#111', color: settings.announcement_fg || '#fff' }}>
                {settings.announcement_link ? <a href={settings.announcement_link}>{settings.announcement_text}</a> : settings.announcement_text}
              </div>
            )}

            {/* Hero Banner */}
            {isOn('hero') && (
            <div className="relative overflow-hidden">
              <div className="px-6 py-10 sm:py-14 text-center relative" style={{
                background: settings?.hero_style === 'image' && settings.hero_media_url
                  ? `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.55)), url(${settings.hero_media_url}) center/cover`
                  : `linear-gradient(135deg, ${settings?.hero_gradient_from || '#0f172a'}, ${settings?.hero_gradient_to || '#1e293b'})`,
              }}>
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                {settings?.logo_url && <img src={settings.logo_url} alt="" className="h-10 mx-auto mb-3 relative" />}
                <h1 className={cn('font-extrabold text-white relative', device === 'mobile' ? 'text-2xl' : 'text-4xl')}>
                  {settings?.hero_headline || 'Our Services'}
                </h1>
                <p className={cn('text-white/80 mt-2 relative max-w-2xl mx-auto', device === 'mobile' ? 'text-xs' : 'text-sm')}>
                  {settings?.hero_subheadline || settings?.tagline || 'Premium pet care tailored to every furry, feathered & scaly friend'}
                </p>
                {(settings?.hero_cta_label || settings?.hero_cta_secondary_label) && (
                  <div className="flex justify-center gap-2 mt-4 relative">
                    {settings?.hero_cta_label && <Button size="sm" className="rounded-full font-bold">{settings.hero_cta_label}</Button>}
                    {settings?.hero_cta_secondary_label && <Button size="sm" variant="outline" className="rounded-full font-bold bg-white/10 border-white/30 text-white hover:bg-white/20">{settings.hero_cta_secondary_label}</Button>}
                  </div>
                )}
                {/* Trust Badges */}
                {isOn('trust') && (settings?.trust_badges?.length ?? 0) > 0 && (
                  <div className={cn('flex items-center justify-center flex-wrap gap-2 mt-5 relative', device === 'mobile' ? 'gap-2' : 'gap-3')}>
                    {(settings?.trust_badges || []).map((b, i) => {
                      const Ic = ICON_MAP[b.icon] || Star;
                      return (
                        <div key={i} className="flex items-center gap-1 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
                          <Ic className="w-3 h-3 text-white" />
                          <span className="text-[10px] font-semibold text-white">{b.text}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            )}


            {/* 🔥 Live Festival Ribbon */}
            {liveOffers.length > 0 && (
              <div className="relative overflow-hidden border-b">
                <div className="flex animate-[scroll_30s_linear_infinite] whitespace-nowrap py-2.5 px-4 gap-8 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10">
                  {[...liveOffers, ...liveOffers].map((o: any, i) => (
                    <div key={i} className="flex items-center gap-2 text-[12px] font-bold">
                      <Flame className="w-3.5 h-3.5 text-rose-500" />
                      <span style={{ color: o.banner_color }}>{o.name}</span>
                      <span className="text-foreground">— {o.discount_pct}% OFF</span>
                      <span className="text-muted-foreground font-medium">ends {o.end_date}</span>
                      <span className="text-muted-foreground">•</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 🎉 Festival Offer Hero Cards */}
            {liveOffers.length > 0 && (
              <div className="px-4 pt-6">
                <div className={cn('grid gap-3', device === 'mobile' ? 'grid-cols-1' : liveOffers.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
                  {liveOffers.slice(0, 2).map((o: any) => (
                    <div
                      key={o.id}
                      className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${o.banner_color}, ${o.banner_color}cc 60%, ${o.banner_color}88)` }}
                    >
                      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
                      <div className="absolute -right-4 -bottom-8 w-24 h-24 rounded-full bg-white/10 blur-xl" />
                      <Badge className="bg-white/25 text-white border-0 backdrop-blur text-[10px] font-bold tracking-wider mb-3">
                        <Sparkles className="w-3 h-3 mr-1" /> {o.season.toUpperCase()}
                      </Badge>
                      <h3 className="text-xl font-extrabold leading-tight">{o.name}</h3>
                      {o.description && <p className="text-white/85 text-[12px] mt-1 line-clamp-2">{o.description}</p>}
                      <div className="flex items-end justify-between mt-4">
                        <div>
                          <div className="text-3xl font-black leading-none">{o.discount_pct}%<span className="text-base font-bold ml-1">OFF</span></div>
                          <div className="text-[11px] text-white/80 mt-1">Valid through {o.end_date}</div>
                        </div>
                        <Button size="sm" className="bg-white text-foreground hover:bg-white/90 rounded-xl font-bold">
                          Claim offer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 🏷️ Active Promotions Strip */}
            {activePromos.length > 0 && (
              <div className="px-4 pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className={cn('font-bold flex items-center gap-1.5', device === 'mobile' ? 'text-base' : 'text-lg')}>
                    <Tag className="w-5 h-5 text-emerald-500" /> Active Promotions
                  </h2>
                  <span className="text-[11px] text-muted-foreground">{activePromos.length} live</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {activePromos.map((c: any) => (
                    <div key={c.id} className="flex-shrink-0 w-64 rounded-xl border-2 border-dashed border-emerald-500/40 bg-emerald-500/5 p-4">
                      <div className="flex items-start justify-between">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-600">
                          {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `$${c.discount_value} OFF`}
                        </div>
                        <Gift className="w-4 h-4 text-emerald-600" />
                      </div>
                      <h4 className="font-bold text-sm mt-1">{c.name}</h4>
                      {c.description && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{c.description}</p>}
                      {c.promo_code && (
                        <div className="mt-3 flex items-center gap-2">
                          <code className="flex-1 text-center text-[12px] font-mono font-bold bg-background border-2 border-dashed border-emerald-500/50 rounded-lg py-1.5 tracking-widest">
                            {c.promo_code}
                          </code>
                        </div>
                      )}
                      {c.end_date && (
                        <p className="text-[10px] text-muted-foreground mt-2">Ends {format(new Date(c.end_date), 'MMM d')}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}


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

            {/* 👑 Membership Plans */}
            {activePlans.length > 0 && activeCategory === 'all' && (
              <div className="px-4 pb-6 pt-2">
                <div className="rounded-2xl bg-gradient-to-br from-[hsl(0_0%_8%)] via-[hsl(0_0%_12%)] to-[hsl(0_0%_8%)] p-5 sm:p-6 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl bg-[hsl(75_95%_62%)]/20" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <div>
                        <Badge className="bg-[hsl(75_95%_62%)] text-[hsl(0_0%_8%)] hover:bg-[hsl(75_95%_62%)] text-[10px] font-bold tracking-wider mb-2">
                          <Crown className="w-3 h-3 mr-1" /> MEMBERSHIPS
                        </Badge>
                        <h2 className="text-xl sm:text-2xl font-extrabold">Save more. Stress less.</h2>
                        <p className="text-white/70 text-[12px] mt-1">Join a plan, get priority booking, exclusive perks and recurring savings.</p>
                      </div>
                    </div>
                    <div className={cn('grid gap-3', device === 'mobile' ? 'grid-cols-1' : activePlans.length === 1 ? 'grid-cols-1' : activePlans.length === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
                      {activePlans.slice(0, 3).map((p: any) => (
                        <div key={p.id} className={cn(
                          'rounded-xl p-4 backdrop-blur transition-all hover:scale-[1.02] cursor-pointer',
                          p.featured ? 'bg-[hsl(75_95%_62%)] text-[hsl(0_0%_8%)] ring-2 ring-[hsl(75_95%_62%)]' : 'bg-white/5 text-white border border-white/10'
                        )}>
                          {p.featured && (
                            <Badge className="bg-[hsl(0_0%_8%)] text-[hsl(75_95%_62%)] hover:bg-[hsl(0_0%_8%)] text-[9px] font-bold tracking-wider mb-2">
                              ⭐ MOST POPULAR
                            </Badge>
                          )}
                          <div className="text-[10px] uppercase tracking-wider font-bold opacity-70">{p.tier}</div>
                          <div className="font-bold text-base">{p.name}</div>
                          <div className="flex items-baseline gap-1 mt-2">
                            <span className="text-2xl font-extrabold">${p.price}</span>
                            <span className="text-[11px] opacity-70">/{p.billing_interval}</span>
                          </div>
                          {p.trial_days > 0 && <div className="text-[10px] font-semibold mt-1 opacity-80">✦ {p.trial_days}-day free trial</div>}
                          <ul className="mt-3 space-y-1.5">
                            {(p.includes || []).slice(0, 3).map((i: string) => (
                              <li key={i} className="flex items-start gap-1.5 text-[11px]">
                                <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0 opacity-80" />
                                <span>{i}</span>
                              </li>
                            ))}
                          </ul>
                          <Button
                            size="sm"
                            className={cn('w-full mt-4 rounded-lg font-bold text-[12px]', p.featured ? 'bg-[hsl(0_0%_8%)] text-[hsl(75_95%_62%)] hover:bg-[hsl(0_0%_15%)]' : 'bg-white text-[hsl(0_0%_8%)] hover:bg-white/90')}
                          >
                            Join now
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 📦 Prepaid Packages */}
            {activePackages.length > 0 && activeCategory === 'all' && (
              <div className="px-4 pb-8">
                <div className="flex items-center justify-between mb-3">
                  <h2 className={cn('font-bold flex items-center gap-1.5', device === 'mobile' ? 'text-base' : 'text-lg')}>
                    <PackageIcon className="w-5 h-5 text-violet-500" /> Bundle & Save
                  </h2>
                  <span className="text-[11px] text-muted-foreground">Prepaid session packs</span>
                </div>
                <div className={cn('grid gap-3', device === 'mobile' ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3')}>
                  {activePackages.slice(0, 6).map((p: any) => {
                    const per = p.per_session_price ?? (p.sessions ? (Number(p.price) / p.sessions) : 0);
                    return (
                      <div key={p.id} className="rounded-xl border bg-card hover:shadow-md transition-all hover:-translate-y-0.5 p-4 cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{p.service_name}</div>
                          {Number(p.savings_pct) > 0 && (
                            <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 text-[10px] font-bold border-0">SAVE {p.savings_pct}%</Badge>
                          )}
                        </div>
                        <h4 className="font-bold text-sm mt-1">{p.name}</h4>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-2xl font-extrabold">${p.price}</span>
                          <span className="text-[11px] text-muted-foreground">${per.toFixed(2)}/session</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2">
                          <span className="flex items-center gap-1"><PackageIcon className="w-3 h-3" /> {p.sessions} sessions</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {p.expires_in_days}d</span>
                        </div>
                        <Button size="sm" className="w-full mt-3 rounded-lg font-semibold text-[12px]">Buy bundle</Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}



            )}

            {/* ═══ Photo Gallery ═══ */}
            {isOn('gallery') && (settings?.gallery_urls?.length ?? 0) > 0 && (
              <div className="px-4 pt-4 pb-8">
                <h2 className={cn('font-bold mb-3', device === 'mobile' ? 'text-base' : 'text-lg')}>📸 Gallery</h2>
                <div className={cn('grid gap-2', settings?.gallery_layout === 'grid' ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3')}>
                  {settings?.gallery_urls?.map((g, i) => (
                    <img key={i} src={g.url} alt={g.caption || ''} className={cn('w-full object-cover rounded-xl', settings.gallery_layout === 'masonry' && i % 3 === 0 ? 'row-span-2 aspect-[3/4]' : 'aspect-square')} />
                  ))}
                </div>
              </div>
            )}

            {/* ═══ About ═══ */}
            {isOn('about') && (settings?.about_body || settings?.about_image_url) && (
              <div className="px-4 pt-4 pb-8">
                <div className="rounded-2xl border bg-card overflow-hidden">
                  <div className={cn('grid gap-0', settings?.about_image_url ? 'md:grid-cols-2' : 'grid-cols-1')}>
                    {settings?.about_image_url && (
                      <img src={settings.about_image_url} alt="" className="w-full h-64 md:h-full object-cover" />
                    )}
                    <div className="p-6">
                      <h2 className="text-2xl font-extrabold mb-2">{settings?.about_title || 'About us'}</h2>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{settings?.about_body}</p>
                      {(settings?.years_in_business || settings?.pets_served) && (
                        <div className="flex gap-6 mt-4 pt-4 border-t">
                          {settings?.years_in_business != null && <div><div className="text-2xl font-extrabold">{settings.years_in_business}+</div><div className="text-[11px] uppercase tracking-wider text-muted-foreground">Years</div></div>}
                          {settings?.pets_served != null && <div><div className="text-2xl font-extrabold">{settings.pets_served.toLocaleString()}+</div><div className="text-[11px] uppercase tracking-wider text-muted-foreground">Pets served</div></div>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ Team ═══ */}
            {isOn('team') && (settings?.team_members?.length ?? 0) > 0 && (
              <div className="px-4 pt-4 pb-8">
                <h2 className={cn('font-bold mb-4', device === 'mobile' ? 'text-base' : 'text-lg')}>👋 Meet the team</h2>
                <div className={cn('grid gap-4', device === 'mobile' ? 'grid-cols-2' : 'grid-cols-3 md:grid-cols-4')}>
                  {settings?.team_members?.map((m, i) => (
                    <div key={i} className="text-center">
                      {m.photo_url ? <img src={m.photo_url} className="w-full aspect-square rounded-full object-cover mb-2" alt={m.name} /> : <div className="w-full aspect-square rounded-full bg-muted mb-2" />}
                      <div className="font-bold text-sm">{m.name}</div>
                      {m.role && <div className="text-[11px] text-muted-foreground">{m.role}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ Reviews handled elsewhere ═══ */}

            {/* ═══ FAQ ═══ */}
            {isOn('faq') && (settings?.faqs?.length ?? 0) > 0 && (
              <div className="px-4 pt-4 pb-8">
                <h2 className={cn('font-bold mb-3', device === 'mobile' ? 'text-base' : 'text-lg')}>❓ Frequently asked</h2>
                <div className="space-y-2">
                  {settings?.faqs?.map((f, i) => (
                    <details key={i} className="rounded-xl border p-3 group">
                      <summary className="font-semibold text-sm cursor-pointer flex items-center justify-between">{f.q}<ChevronDown2 className="w-4 h-4 group-open:rotate-180 transition-transform" /></summary>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ Hours + Contact ═══ */}
            {(isOn('hours') || isOn('contact')) && (
              <div className={cn('px-4 pt-4 pb-8 grid gap-4', device === 'mobile' ? 'grid-cols-1' : 'grid-cols-2')}>
                {isOn('hours') && settings?.business_hours && (
                  <div className="rounded-2xl border bg-card p-5">
                    <h3 className="font-bold text-base mb-3 flex items-center gap-2"><Clock className="w-4 h-4" /> Hours</h3>
                    <div className="space-y-1 text-sm">
                      {Object.entries(settings.business_hours).map(([day, h]: any) => (
                        <div key={day} className="flex justify-between capitalize"><span className="text-muted-foreground">{day}</span><span className="font-medium">{h.closed ? 'Closed' : `${h.open} – ${h.close}`}</span></div>
                      ))}
                    </div>
                  </div>
                )}
                {isOn('contact') && (
                  <div className="rounded-2xl border bg-card p-5">
                    <h3 className="font-bold text-base mb-3">Get in touch</h3>
                    <div className="space-y-2 text-sm">
                      {settings?.contact_phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /> {settings.contact_phone}</div>}
                      {settings?.contact_email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" /> {settings.contact_email}</div>}
                      {settings?.contact_address && <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-muted-foreground mt-0.5" /> <span>{settings.contact_address}</span></div>}
                    </div>
                    {isOn('social') && (
                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        {settings?.social_instagram && <a href={settings.social_instagram} className="p-2 rounded-full bg-muted hover:bg-accent"><Instagram className="w-4 h-4" /></a>}
                        {settings?.social_facebook && <a href={settings.social_facebook} className="p-2 rounded-full bg-muted hover:bg-accent"><Facebook className="w-4 h-4" /></a>}
                        {settings?.social_youtube && <a href={settings.social_youtube} className="p-2 rounded-full bg-muted hover:bg-accent"><Youtube className="w-4 h-4" /></a>}
                        {settings?.social_whatsapp && <a href={settings.social_whatsapp} className="p-2 rounded-full bg-muted hover:bg-accent"><MessageCircle className="w-4 h-4" /></a>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ═══ Map ═══ */}
            {isOn('map') && settings?.map_embed_url && (
              <div className="px-4 pb-8">
                <div className="rounded-2xl overflow-hidden border aspect-video">
                  <iframe src={settings.map_embed_url} className="w-full h-full" loading="lazy" title="Location" />
                </div>
              </div>
            )}

            {/* ═══ Newsletter ═══ */}
            {isOn('newsletter') && settings?.newsletter_enabled && (
              <div className="px-4 pb-8">
                <div className="rounded-2xl bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10 p-6 text-center border">
                  <h3 className="text-xl font-extrabold">{settings.newsletter_headline}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{settings.newsletter_subheadline}</p>
                  <div className="flex gap-2 mt-4 max-w-md mx-auto">
                    <input type="email" placeholder="you@example.com" className="flex-1 rounded-full border px-4 py-2 text-sm bg-background" />
                    <Button className="rounded-full font-bold">Subscribe</Button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ Loyalty teaser ═══ */}
            {isOn('loyalty') && settings?.loyalty_teaser_enabled && settings?.loyalty_teaser_text && (
              <div className="px-4 pb-8">
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 text-center text-sm font-semibold">
                  ✨ {settings.loyalty_teaser_text}
                </div>
              </div>
            )}

            {/* ═══ Press logos ═══ */}
            {isOn('press') && (settings?.press_logos?.length ?? 0) > 0 && (
              <div className="px-4 pb-8">
                <p className="text-[10px] uppercase tracking-widest text-center text-muted-foreground mb-3">As seen in</p>
                <div className="flex flex-wrap justify-center items-center gap-6 opacity-70">
                  {settings?.press_logos?.map((p, i) => (
                    p.logo_url ? <img key={i} src={p.logo_url} alt={p.name} className="h-8 object-contain" /> : <span key={i} className="text-sm font-bold">{p.name}</span>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ Certifications ═══ */}
            {isOn('certifications') && (settings?.certifications?.length ?? 0) > 0 && (
              <div className="px-4 pb-8">
                <div className="flex flex-wrap justify-center gap-2">
                  {settings?.certifications?.map((c, i) => (
                    <Badge key={i} variant="secondary" className="text-xs"><Shield className="w-3 h-3 mr-1" /> {c.name}</Badge>
                  ))}
                </div>
              </div>
            )}

            {activeServices.length === 0 && (
              <div className="text-center py-20 text-muted-foreground">
                <p className="text-lg font-medium">No active services</p>
                <p className="text-sm mt-1">Activate services to see them in your storefront</p>
              </div>
            )}
          </div>
        </div>

        {selectedService && (
          <StorefrontDetailOverlay service={selectedService} allServices={activeServices} onClose={() => setSelectedService(null)} />
        )}
      </DialogContent>
      <StorefrontCustomizer open={customizerOpen} onOpenChange={setCustomizerOpen} />
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
  const { data: allReviews = [] } = useReviews();
  
  const serviceReviews = allReviews.filter((r: any) => r.service_id === s.id && r.status === 'published');
  const avgRating = serviceReviews.length ? (serviceReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / serviceReviews.length).toFixed(1) : '0';
  const reviewCount = serviceReviews.length;
  const ratingDist = [5,4,3,2,1].map(star => {
    const count = serviceReviews.filter((r: any) => r.rating === star).length;
    return { stars: star, pct: reviewCount ? Math.round((count / reviewCount) * 100) : 0 };
  });

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
              
              {reviewCount > 0 ? (
                <>
                  <div className="bg-accent/50 rounded-2xl p-5 flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-4xl font-extrabold">{avgRating}</div>
                      <div className="flex items-center gap-0.5 mt-1">
                        {[1,2,3,4,5].map(i => <Star key={i} className={cn('w-3.5 h-3.5 text-amber-500', i <= Math.round(Number(avgRating)) ? 'fill-amber-500' : '')} />)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{reviewCount} review{reviewCount !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {ratingDist.map(({ stars, pct }) => (
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

                  <div className="space-y-3">
                    {serviceReviews.slice(0, 4).map((review: any) => (
                      <div key={review.id} className="bg-card border rounded-xl p-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                              {review.customer_name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{review.customer_name}</p>
                              <p className="text-[11px] text-muted-foreground">{format(new Date(review.created_at), 'MMM d, yyyy')}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {[1,2,3,4,5].map(j => (
                              <Star key={j} className={cn('w-3 h-3', j <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-muted')} />
                            ))}
                          </div>
                        </div>
                        {review.review_text && <p className="text-sm text-muted-foreground leading-relaxed">{review.review_text}</p>}
                        {review.pet_name && (
                          <span className="inline-block text-[10px] bg-secondary text-secondary-foreground rounded-full px-2 py-0.5">
                            {review.pet_species === 'dog' ? '🐕' : review.pet_species === 'cat' ? '🐱' : '🐾'} {review.pet_name}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  {reviewCount > 4 && (
                    <button className="text-sm text-primary font-medium hover:underline">See all {reviewCount} reviews →</button>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No reviews yet for this service.</p>
              )}
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

          {/* Right: Sticky Booking Card (desktop only) */}
          <div className="hidden sm:block sm:w-80 flex-shrink-0">
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

              {s.available_days && (
                <div className="flex flex-wrap gap-1">
                  {s.available_days.map((d: string) => (
                    <span key={d} className="text-[10px] bg-muted rounded px-1.5 py-0.5 capitalize">{d.slice(0, 3)}</span>
                  ))}
                </div>
              )}

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
        {/* Fixed Bottom Booking Bar (mobile only) */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t shadow-2xl p-4 flex items-center justify-between sm:hidden">
          <div>
            <span className="text-xl font-extrabold">{curr}{total.toFixed(2)}</span>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{s.duration_minutes}min</p>
          </div>
          <Button className="rounded-xl h-11 px-8 font-bold" size="lg">Book Now</Button>
        </div>
      </div>
    </div>
  );
}

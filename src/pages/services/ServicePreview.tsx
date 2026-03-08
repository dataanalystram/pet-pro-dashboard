import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Shield, Weight, AlertCircle, CheckCircle2, Smartphone, Monitor, Tablet, MapPin, Calendar, HelpCircle, Plus, Percent, Star, ChevronDown, X, Heart } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const currencySymbol = (c: string) => c === 'EUR' ? '€' : c === 'GBP' ? '£' : c === 'USD' ? '$' : c + ' ';

const categoryGradients: Record<string, string> = {
  grooming: 'from-blue-400 to-indigo-500', dental: 'from-emerald-400 to-teal-500',
  medical: 'from-red-400 to-rose-500', walking: 'from-amber-400 to-orange-500',
  boarding: 'from-violet-400 to-purple-500', training: 'from-orange-400 to-red-500',
  sitting: 'from-pink-400 to-rose-500', other: 'from-gray-400 to-slate-500',
};

const locationLabels: Record<string, string> = {
  in_store: 'In-Store', mobile: 'At Your Home', both: 'In-Store or At Your Home',
};

const dayLabels: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

interface Props { open: boolean; onOpenChange: (open: boolean) => void; service: any; allServices?: any[]; }

export default function ServicePreview({ open, onOpenChange, service: s, allServices = [] }: Props) {
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [selectedAddons, setSelectedAddons] = useState<Set<number>>(new Set());

  if (!s) return null;

  const frameWidth = device === 'mobile' ? 'max-w-[390px]' : device === 'tablet' ? 'max-w-[768px]' : 'max-w-[1024px]';
  const allPets = [...(s.pet_types_accepted || []), ...(s.custom_pet_types || [])];
  const addons = s.service_addons || [];
  const faq = s.faq || [];
  const sizePricing = s.pet_size_pricing;
  const curr = currencySymbol(s.currency || 'EUR');
  const addonTotal = addons.reduce((sum: number, a: any, i: number) => selectedAddons.has(i) ? sum + Number(a.price) : sum, 0);
  const total = Number(s.base_price) + addonTotal;

  const toggleAddon = (i: number) => {
    setSelectedAddons(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const recs = allServices.filter((srv: any) => s.recommended_services?.includes(srv.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto p-0 gap-0">
        {/* Toolbar */}
        <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b px-4 py-3 flex items-center justify-between">
          <h2 className="font-semibold text-sm">Customer Preview — {s.name}</h2>
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
            'w-full transition-all duration-300 overflow-hidden bg-background',
            frameWidth,
            device === 'mobile' ? 'border-[6px] border-foreground/10 rounded-[2.5rem] shadow-2xl' : 'rounded-2xl border shadow-lg'
          )}>
            {/* Hero Image */}
            <div className="relative h-56 sm:h-72">
              {s.cover_image_url ? (
                <img src={s.cover_image_url} alt={s.name} className="w-full h-full object-cover" />
              ) : (
                <div className={cn('w-full h-full bg-gradient-to-br', categoryGradients[s.category] || categoryGradients.other)}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white/30 text-7xl font-bold">{s.name.charAt(0)}</span>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              {s.difficulty_level && s.difficulty_level !== 'standard' && (
                <Badge className="absolute top-4 right-4 capitalize bg-background/20 backdrop-blur-md text-white border-white/20">{s.difficulty_level}</Badge>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <Badge className="text-[10px] mb-2 capitalize bg-primary/90 text-primary-foreground">{s.custom_category || s.category}</Badge>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{s.name}</h1>
                {s.short_description && <p className="text-white/80 text-sm mt-1">{s.short_description}</p>}
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                  </div>
                  <a href="#reviews-section" className="text-white/80 text-xs hover:text-white underline underline-offset-2 transition-colors cursor-pointer">4.9 (128 reviews)</a>
                </div>
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
            <div className={cn('flex gap-6 p-6', device === 'mobile' ? 'flex-col pb-24' : 'flex-row')}>
              {/* Left: Content */}
              <div className="flex-1 space-y-6 min-w-0">
                {/* Highlights */}
                {s.highlights && s.highlights.length > 0 && (
                  <div className="bg-accent/50 rounded-2xl p-5 space-y-3">
                    <h3 className="font-bold text-sm">What's Included</h3>
                    <div className="grid gap-2.5">
                      {s.highlights.map((h: string, i: number) => (
                        <div key={i} className="flex items-start gap-2.5 text-sm">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle2 className="w-3 h-3 text-primary" />
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

                {/* Size Pricing */}
                {sizePricing && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-sm">Pricing by Pet Size</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {(['small', 'medium', 'large', 'xl'] as const).map(size => (
                        sizePricing[size] ? (
                          <div key={size} className="bg-muted/50 rounded-xl px-4 py-3 flex justify-between items-center">
                            <span className="text-sm capitalize">{size === 'xl' ? 'Extra Large' : size}</span>
                            <span className="font-bold text-sm">{curr}{Number(sizePricing[size]).toFixed(2)}</span>
                          </div>
                        ) : null
                      ))}
                    </div>
                  </div>
                )}

                {/* Availability */}
                {s.available_days && s.available_days.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-sm">Availability</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {s.available_days.map((d: string) => (
                        <Badge key={d} variant="secondary" className="text-xs">{dayLabels[d] || d}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {s.available_time_start} – {s.available_time_end}</span>
                      {s.min_advance_hours > 0 && (
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {s.min_advance_hours}h advance</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Pet Requirements */}
                {(s.vaccination_required || s.age_restrictions || s.weight_limit_kg || allPets.length > 0) && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-sm">Pet Requirements</h3>
                    <div className="space-y-2">
                      {s.vaccination_required && (
                        <div className="flex items-center gap-2 text-sm"><Shield className="w-4 h-4 text-emerald-500" /> Up-to-date vaccinations required</div>
                      )}
                      {s.age_restrictions && (
                        <div className="flex items-center gap-2 text-sm"><AlertCircle className="w-4 h-4 text-amber-500" /> {s.age_restrictions}</div>
                      )}
                      {s.weight_limit_kg && (
                        <div className="flex items-center gap-2 text-sm"><Weight className="w-4 h-4 text-blue-500" /> Max weight: {s.weight_limit_kg}kg</div>
                      )}
                    </div>
                    {allPets.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {allPets.map((p: string) => (
                          <Badge key={p} variant="secondary" className="text-xs capitalize">{p}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Preparation & Aftercare */}
                {s.preparation_notes && (
                  <div className="space-y-2">
                    <h3 className="font-bold text-sm">Before Your Appointment</h3>
                    <p className="text-sm text-muted-foreground">{s.preparation_notes}</p>
                  </div>
                )}
                {s.aftercare_notes && (
                  <div className="space-y-2">
                    <h3 className="font-bold text-sm">Aftercare Instructions</h3>
                    <p className="text-sm text-muted-foreground">{s.aftercare_notes}</p>
                  </div>
                )}

                {/* FAQ */}
                {faq.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-sm flex items-center gap-1.5"><HelpCircle className="w-4 h-4" /> FAQ</h3>
                    <div className="space-y-2">
                      {faq.map((f: any, i: number) => (
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

                {/* Customer Reviews */}
                <div id="reviews-section" className="space-y-5">
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

                {/* Cancellation & Terms */}
                {s.cancellation_policy && (
                  <div className="space-y-2">
                    <h3 className="font-bold text-sm">Cancellation Policy</h3>
                    <p className="text-sm text-muted-foreground">{s.cancellation_policy}</p>
                  </div>
                )}
                {s.terms_conditions && (
                  <div className="space-y-2">
                    <h3 className="font-bold text-sm">Terms & Conditions</h3>
                    <p className="text-xs text-muted-foreground whitespace-pre-line">{s.terms_conditions}</p>
                  </div>
                )}
              </div>

              {/* Right: Sticky Booking Card */}
              <div className={cn(device === 'mobile' ? 'w-full' : 'w-80 flex-shrink-0')}>
                <div className={cn('bg-card border rounded-2xl p-5 space-y-4 shadow-lg', device !== 'mobile' && 'sticky top-4')}>
                  {/* Price */}
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold">
                        {s.price_type === 'starting_from' ? 'From ' : ''}
                        {curr}{total.toFixed(2)}
                      </span>
                      {s.price_type === 'hourly' && <span className="text-muted-foreground text-sm">/hr</span>}
                    </div>
                    {Number(s.tax_rate) > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">{s.tax_inclusive ? 'Incl.' : 'Excl.'} {s.tax_rate}% VAT</p>
                    )}
                    {Number(s.group_discount_percent) > 0 && (
                      <div className="flex items-center gap-1 text-sm text-primary mt-1">
                        <Percent className="w-4 h-4" /> {s.group_discount_percent}% multi-pet discount
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{s.duration_minutes}min</span>
                    {s.service_location && (
                      <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{locationLabels[s.service_location]?.split(' ')[0] || s.service_location}</span>
                    )}
                  </div>

                  {/* Interactive Add-ons */}
                  {addons.length > 0 && (
                    <div className="space-y-2 border-t pt-3">
                      <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">Customize with Add-ons</h4>
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
                      {selectedAddons.size > 0 && (
                        <div className="flex justify-between text-sm font-medium pt-1 border-t">
                          <span>Total</span>
                          <span>{curr}{total.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {s.deposit_required && s.deposit_amount && (
                    <p className="text-xs text-muted-foreground">
                      {s.deposit_type === 'percentage' ? `${s.deposit_amount}%` : `${curr}${Number(s.deposit_amount).toFixed(2)}`} deposit to confirm
                    </p>
                  )}

                  <Button className="w-full rounded-xl h-12 font-bold text-base" size="lg">Book Now</Button>
                  
                  <div className="flex items-center gap-2 justify-center">
                    <div className="flex -space-x-2">
                      {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-muted border-2 border-card" />)}
                    </div>
                    <p className="text-[10px] text-muted-foreground">120+ booked this month</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {recs.length > 0 && (
              <div className="px-6 pb-8 border-t pt-6">
                <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" /> You Might Also Like
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {recs.map((r: any) => (
                    <div key={r.id} className="flex-shrink-0 w-52 rounded-2xl border overflow-hidden bg-card hover:shadow-md transition-all hover:-translate-y-0.5">
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
                          <div className="flex items-center gap-0.5 text-amber-500">
                            {[1,2,3,4,5].map(i => <Star key={i} className="w-2 h-2 fill-current" />)}
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
      </DialogContent>
    </Dialog>
  );
}

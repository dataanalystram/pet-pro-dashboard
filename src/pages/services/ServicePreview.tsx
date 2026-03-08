import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Shield, Weight, AlertCircle, CheckCircle2, Smartphone, Monitor, Tablet, MapPin, Calendar, HelpCircle, Plus, Percent } from 'lucide-react';
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
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  if (!s) return null;

  const frameWidth = device === 'mobile' ? 'max-w-[375px]' : device === 'tablet' ? 'max-w-[768px]' : 'max-w-[1024px]';
  const allPets = [...(s.pet_types_accepted || []), ...(s.custom_pet_types || [])];
  const addons = s.service_addons || [];
  const faq = s.faq || [];
  const sizePricing = s.pet_size_pricing;
  const curr = currencySymbol(s.currency || 'EUR');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Customer Preview</span>
            <div className="flex gap-1">
              {([['mobile', Smartphone], ['tablet', Tablet], ['desktop', Monitor]] as const).map(([key, Icon]) => (
                <Button key={key} variant={device === key ? 'default' : 'outline'} size="sm" className="h-8" onClick={() => setDevice(key)}>
                  <Icon className="w-4 h-4" />
                </Button>
              ))}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-center py-4">
          <div className={cn(
            'w-full border rounded-2xl overflow-hidden bg-background shadow-lg transition-all',
            frameWidth,
            device === 'mobile' && 'border-[8px] border-foreground/10 rounded-[2rem]'
          )}>
            {/* Hero */}
            <div className={cn('h-48 relative', !s.cover_image_url && `bg-gradient-to-br ${categoryGradients[s.category] || categoryGradients.other}`)}>
              {s.cover_image_url ? (
                <img src={s.cover_image_url} alt={s.name} className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white/60 text-5xl font-bold">{s.name.charAt(0)}</span>
                </div>
              )}
              {s.difficulty_level && s.difficulty_level !== 'standard' && (
                <Badge className="absolute top-3 right-3 capitalize bg-background/80 text-foreground">{s.difficulty_level}</Badge>
              )}
            </div>

            {/* Gallery */}
            {s.gallery_urls && s.gallery_urls.length > 0 && (
              <div className="flex gap-1 p-2 overflow-x-auto">
                {s.gallery_urls.map((url: string, i: number) => (
                  <img key={i} src={url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                ))}
              </div>
            )}

            {/* Content */}
            <div className="p-5 space-y-4">
              <div>
                <Badge className="text-xs mb-2 capitalize">{s.custom_category || s.category}</Badge>
                <h2 className="text-xl font-bold">{s.name}</h2>
                {s.short_description && <p className="text-sm text-muted-foreground mt-1">{s.short_description}</p>}
              </div>

              {/* Price block */}
              <div className="bg-accent/50 rounded-xl p-4 space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                    {s.price_type === 'starting_from' ? 'From ' : ''}
                    {curr}{Number(s.base_price).toFixed(2)}
                  </span>
                  {s.price_type === 'hourly' && <span className="text-muted-foreground text-sm">/hour</span>}
                </div>
                {Number(s.tax_rate) > 0 && (
                  <p className="text-xs text-muted-foreground">{s.tax_inclusive ? 'Including' : 'Excluding'} {s.tax_rate}% VAT</p>
                )}
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" /> {s.duration_minutes} minutes
                </div>
                {Number(s.group_discount_percent) > 0 && (
                  <div className="flex items-center gap-1 text-sm text-primary">
                    <Percent className="w-4 h-4" /> {s.group_discount_percent}% multi-pet discount
                  </div>
                )}
                {s.deposit_required && s.deposit_amount && (
                  <p className="text-xs text-muted-foreground">
                    Deposit: {s.deposit_type === 'percentage' ? `${s.deposit_amount}%` : `${curr}${Number(s.deposit_amount).toFixed(2)}`} required to confirm
                  </p>
                )}
              </div>

              {/* Size pricing */}
              {sizePricing && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Pricing by Pet Size</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {(['small', 'medium', 'large', 'xl'] as const).map(size => (
                      sizePricing[size] ? (
                        <div key={size} className="bg-accent/30 rounded-lg px-3 py-2 text-sm flex justify-between">
                          <span className="capitalize">{size === 'xl' ? 'Extra Large' : size}</span>
                          <span className="font-semibold">{curr}{Number(sizePricing[size]).toFixed(2)}</span>
                        </div>
                      ) : null
                    ))}
                  </div>
                </div>
              )}

              {/* Add-ons */}
              {addons.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Optional Add-ons</h3>
                  {addons.map((a: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-accent/30 rounded-lg px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Plus className="w-3.5 h-3.5 text-primary" />
                        <span>{a.name}</span>
                      </div>
                      <span className="font-semibold">+{curr}{Number(a.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Highlights */}
              {s.highlights && s.highlights.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">What's Included</h3>
                  {s.highlights.map((h: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Description */}
              {(s.long_description || s.description) && (
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm">About This Service</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{s.long_description || s.description}</p>
                </div>
              )}

              {/* Availability */}
              {s.available_days && s.available_days.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Availability</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {s.available_days.map((d: string) => (
                      <Badge key={d} variant="secondary" className="text-xs">{dayLabels[d] || d}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" /> {s.available_time_start} – {s.available_time_end}
                  </div>
                  {s.min_advance_hours > 0 && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" /> Book at least {s.min_advance_hours}h in advance
                    </div>
                  )}
                </div>
              )}

              {/* Location */}
              {s.service_location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" /> {locationLabels[s.service_location] || s.service_location}
                  {s.service_area_km && <span>(within {s.service_area_km}km)</span>}
                </div>
              )}

              {/* Pet Requirements */}
              {(s.vaccination_required || s.age_restrictions || s.weight_limit_kg || allPets.length > 0) && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Pet Requirements</h3>
                  {s.vaccination_required && (
                    <div className="flex items-center gap-2 text-sm"><Shield className="w-4 h-4 text-emerald-500" /> Up-to-date vaccinations required</div>
                  )}
                  {s.age_restrictions && (
                    <div className="flex items-center gap-2 text-sm"><AlertCircle className="w-4 h-4 text-amber-500" /> {s.age_restrictions}</div>
                  )}
                  {s.weight_limit_kg && (
                    <div className="flex items-center gap-2 text-sm"><Weight className="w-4 h-4 text-blue-500" /> Max weight: {s.weight_limit_kg}kg</div>
                  )}
                  {allPets.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {allPets.map((p: string) => (
                        <Badge key={p} variant="secondary" className="text-xs capitalize">{p}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Preparation */}
              {s.preparation_notes && (
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm">Before Your Appointment</h3>
                  <p className="text-sm text-muted-foreground">{s.preparation_notes}</p>
                </div>
              )}

              {/* Aftercare */}
              {s.aftercare_notes && (
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm">Aftercare Instructions</h3>
                  <p className="text-sm text-muted-foreground">{s.aftercare_notes}</p>
                </div>
              )}

              {/* FAQ */}
              {faq.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm flex items-center gap-1.5"><HelpCircle className="w-4 h-4" /> FAQ</h3>
                  {faq.map((f: any, i: number) => (
                    <button key={i} type="button" className="w-full text-left" onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}>
                      <div className="bg-accent/30 rounded-lg px-3 py-2">
                        <p className="text-sm font-medium">{f.question}</p>
                        {expandedFaq === i && <p className="text-sm text-muted-foreground mt-1">{f.answer}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Cancellation */}
              {s.cancellation_policy && (
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm">Cancellation Policy</h3>
                  <p className="text-sm text-muted-foreground">{s.cancellation_policy}</p>
                </div>
              )}

              {/* Terms */}
              {s.terms_conditions && (
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm">Terms & Conditions</h3>
                  <p className="text-xs text-muted-foreground whitespace-pre-line">{s.terms_conditions}</p>
                </div>
              )}

              {/* CTA */}
              <Button className="w-full mt-4" size="lg">Book Now</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

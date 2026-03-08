import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Shield, Weight, AlertCircle, CheckCircle2, Smartphone, Monitor, Tablet } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const currencySymbol = (c: string) => c === 'EUR' ? '€' : c === 'GBP' ? '£' : c === 'USD' ? '$' : c + ' ';

const categoryGradients: Record<string, string> = {
  grooming: 'from-blue-400 to-indigo-500', dental: 'from-emerald-400 to-teal-500',
  medical: 'from-red-400 to-rose-500', walking: 'from-amber-400 to-orange-500',
  boarding: 'from-violet-400 to-purple-500', training: 'from-orange-400 to-red-500',
  sitting: 'from-pink-400 to-rose-500', other: 'from-gray-400 to-slate-500',
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: any;
}

export default function ServicePreview({ open, onOpenChange, service: s }: Props) {
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');

  if (!s) return null;

  const frameWidth = device === 'mobile' ? 'max-w-[375px]' : device === 'tablet' ? 'max-w-[768px]' : 'max-w-[1024px]';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Customer Preview</span>
            <div className="flex gap-1">
              {([['mobile', Smartphone], ['tablet', Tablet], ['desktop', Monitor]] as const).map(([key, Icon]) => (
                <Button
                  key={key}
                  variant={device === key ? 'default' : 'outline'}
                  size="sm"
                  className="h-8"
                  onClick={() => setDevice(key)}
                >
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
                <Badge className="text-xs mb-2 capitalize">{s.category}</Badge>
                <h2 className="text-xl font-bold">{s.name}</h2>
                {s.short_description && <p className="text-sm text-muted-foreground mt-1">{s.short_description}</p>}
              </div>

              {/* Price block */}
              <div className="bg-accent/50 rounded-xl p-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                    {s.price_type === 'starting_from' ? 'From ' : ''}
                    {currencySymbol(s.currency || 'EUR')}{Number(s.base_price).toFixed(2)}
                  </span>
                  {s.price_type === 'hourly' && <span className="text-muted-foreground text-sm">/hour</span>}
                </div>
                {Number(s.tax_rate) > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">{s.tax_inclusive ? 'Including' : 'Excluding'} {s.tax_rate}% VAT</p>
                )}
                <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" /> {s.duration_minutes} minutes
                </div>
              </div>

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

              {/* Pet Requirements */}
              {(s.vaccination_required || s.age_restrictions || s.weight_limit_kg) && (
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
                  {s.pet_types_accepted && s.pet_types_accepted.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {s.pet_types_accepted.map((p: string) => (
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

              {/* Cancellation */}
              {s.cancellation_policy && (
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm">Cancellation Policy</h3>
                  <p className="text-sm text-muted-foreground">{s.cancellation_policy}</p>
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

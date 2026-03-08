import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import MediaUploader from '@/components/MediaUploader';
import { Plus, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: 'grooming', label: 'Grooming' }, { value: 'dental', label: 'Dental' },
  { value: 'medical', label: 'Medical' }, { value: 'walking', label: 'Walking' },
  { value: 'boarding', label: 'Boarding' }, { value: 'training', label: 'Training' },
  { value: 'sitting', label: 'Pet Sitting' }, { value: 'other', label: 'Other' },
];

const CURRENCIES = [
  { value: 'EUR', label: '€ EUR', tax: 21 }, { value: 'USD', label: '$ USD', tax: 0 },
  { value: 'GBP', label: '£ GBP', tax: 20 }, { value: 'CHF', label: 'CHF', tax: 7.7 },
  { value: 'SEK', label: 'SEK', tax: 25 }, { value: 'NOK', label: 'NOK', tax: 25 },
  { value: 'DKK', label: 'DKK', tax: 25 }, { value: 'PLN', label: 'PLN', tax: 23 },
];

const PET_TYPES = ['dog', 'cat', 'bird', 'rabbit', 'hamster', 'reptile', 'fish', 'other'];

const PRICE_TYPES = [
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'starting_from', label: 'Starting From' },
  { value: 'hourly', label: 'Per Hour' },
];

export interface ServiceFormData {
  name: string; category: string; short_description: string; description: string;
  long_description: string; base_price: string; price_from: string; price_type: string;
  currency: string; tax_rate: string; tax_inclusive: boolean; duration_minutes: string;
  buffer_minutes: string; max_bookings_per_day: string; pet_types_accepted: string[];
  vaccination_required: boolean; age_restrictions: string; breed_restrictions: string[];
  weight_limit_kg: string; cover_image_url: string; gallery_urls: string[];
  preparation_notes: string; aftercare_notes: string; cancellation_policy: string;
  highlights: string[]; tags: string[]; is_active: boolean; featured: boolean;
}

const emptyForm: ServiceFormData = {
  name: '', category: 'grooming', short_description: '', description: '', long_description: '',
  base_price: '', price_from: '', price_type: 'fixed', currency: 'EUR', tax_rate: '21',
  tax_inclusive: true, duration_minutes: '', buffer_minutes: '15', max_bookings_per_day: '10',
  pet_types_accepted: ['dog', 'cat'], vaccination_required: false, age_restrictions: '',
  breed_restrictions: [], weight_limit_kg: '', cover_image_url: '', gallery_urls: [],
  preparation_notes: '', aftercare_notes: '', cancellation_policy: '', highlights: [],
  tags: [], is_active: true, featured: false,
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: any | null;
  onSave: (data: ServiceFormData) => void;
  saving?: boolean;
}

export default function ServiceFormDialog({ open, onOpenChange, editing, onSave, saving }: Props) {
  const [form, setForm] = useState<ServiceFormData>(emptyForm);
  const [newHighlight, setNewHighlight] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newBreed, setNewBreed] = useState('');

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name || '', category: editing.category || 'grooming',
        short_description: editing.short_description || '', description: editing.description || '',
        long_description: editing.long_description || '', base_price: editing.base_price?.toString() || '',
        price_from: editing.price_from?.toString() || '', price_type: editing.price_type || 'fixed',
        currency: editing.currency || 'EUR', tax_rate: editing.tax_rate?.toString() || '0',
        tax_inclusive: editing.tax_inclusive ?? true, duration_minutes: editing.duration_minutes?.toString() || '',
        buffer_minutes: editing.buffer_minutes?.toString() || '0',
        max_bookings_per_day: editing.max_bookings_per_day?.toString() || '10',
        pet_types_accepted: editing.pet_types_accepted || ['dog', 'cat'],
        vaccination_required: editing.vaccination_required || false,
        age_restrictions: editing.age_restrictions || '', breed_restrictions: editing.breed_restrictions || [],
        weight_limit_kg: editing.weight_limit_kg?.toString() || '',
        cover_image_url: editing.cover_image_url || '', gallery_urls: editing.gallery_urls || [],
        preparation_notes: editing.preparation_notes || '', aftercare_notes: editing.aftercare_notes || '',
        cancellation_policy: editing.cancellation_policy || '', highlights: editing.highlights || [],
        tags: editing.tags || [], is_active: editing.is_active ?? true, featured: editing.featured || false,
      });
    } else {
      setForm(emptyForm);
    }
  }, [editing, open]);

  const set = (key: keyof ServiceFormData, val: any) => setForm(f => ({ ...f, [key]: val }));

  const addToList = (key: 'highlights' | 'tags' | 'breed_restrictions', val: string, setter: (v: string) => void) => {
    if (!val.trim()) return;
    set(key, [...(form[key] as string[]), val.trim()]);
    setter('');
  };

  const removeFromList = (key: 'highlights' | 'tags' | 'breed_restrictions', idx: number) => {
    set(key, (form[key] as string[]).filter((_, i) => i !== idx));
  };

  const handleCurrencyChange = (currency: string) => {
    const curr = CURRENCIES.find(c => c.value === currency);
    set('currency', currency);
    if (curr) set('tax_rate', curr.tax.toString());
  };

  const togglePetType = (pet: string) => {
    const arr = form.pet_types_accepted;
    set('pet_types_accepted', arr.includes(pet) ? arr.filter(p => p !== pet) : [...arr, pet]);
  };

  const isValid = form.name && form.base_price && form.duration_minutes;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl w-full overflow-y-auto p-0">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle className="text-lg font-semibold">
            {editing ? 'Edit Service' : 'Create New Service'}
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="basic" className="px-6">
          <TabsList className="grid grid-cols-6 w-full h-9 text-xs">
            <TabsTrigger value="basic" className="text-xs px-1">Basic</TabsTrigger>
            <TabsTrigger value="pricing" className="text-xs px-1">Pricing</TabsTrigger>
            <TabsTrigger value="schedule" className="text-xs px-1">Schedule</TabsTrigger>
            <TabsTrigger value="pets" className="text-xs px-1">Pets</TabsTrigger>
            <TabsTrigger value="media" className="text-xs px-1">Media</TabsTrigger>
            <TabsTrigger value="details" className="text-xs px-1">Details</TabsTrigger>
          </TabsList>

          {/* BASIC INFO */}
          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label>Service Name *</Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Premium Dog Grooming" />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => set('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Short Description <span className="text-muted-foreground text-xs">(shown on cards, max 120 chars)</span></Label>
              <Input value={form.short_description} onChange={e => set('short_description', e.target.value.slice(0, 120))} placeholder="A brief tagline for your service" />
              <span className="text-xs text-muted-foreground">{form.short_description.length}/120</span>
            </div>
            <div className="space-y-1.5">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="Add a tag" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addToList('tags', newTag, setNewTag))} />
                <Button type="button" variant="outline" size="sm" onClick={() => addToList('tags', newTag, setNewTag)}><Plus className="w-4 h-4" /></Button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.tags.map((t, i) => (
                    <Badge key={i} variant="secondary" className="text-xs gap-1">{t}<button onClick={() => removeFromList('tags', i)}><X className="w-3 h-3" /></button></Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="space-y-0.5">
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">Visible to customers when active</p>
              </div>
              <Switch checked={form.is_active} onCheckedChange={v => set('is_active', v)} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-amber-500" /> Featured</Label>
                <p className="text-xs text-muted-foreground">Pin to top of listings</p>
              </div>
              <Switch checked={form.featured} onCheckedChange={v => set('featured', v)} />
            </div>
          </TabsContent>

          {/* PRICING */}
          <TabsContent value="pricing" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select value={form.currency} onValueChange={handleCurrencyChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CURRENCIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Price Type</Label>
                <Select value={form.price_type} onValueChange={v => set('price_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRICE_TYPES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Base Price *</Label>
                <Input type="number" min="0" step="0.01" value={form.base_price} onChange={e => set('base_price', e.target.value)} placeholder="0.00" />
              </div>
              {form.price_type === 'starting_from' && (
                <div className="space-y-1.5">
                  <Label>Price From</Label>
                  <Input type="number" min="0" step="0.01" value={form.price_from} onChange={e => set('price_from', e.target.value)} placeholder="0.00" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tax / VAT Rate (%)</Label>
                <Input type="number" min="0" max="100" value={form.tax_rate} onChange={e => set('tax_rate', e.target.value)} />
              </div>
              <div className="flex items-end pb-1">
                <div className="flex items-center gap-2">
                  <Switch checked={form.tax_inclusive} onCheckedChange={v => set('tax_inclusive', v)} />
                  <Label className="text-sm">Tax inclusive</Label>
                </div>
              </div>
            </div>
            {Number(form.base_price) > 0 && (
              <div className="rounded-lg bg-accent/50 p-3 text-sm">
                <p className="font-medium">Price Preview</p>
                <p className="text-muted-foreground mt-1">
                  {form.price_type === 'starting_from' ? 'From ' : ''}
                  {form.currency === 'EUR' ? '€' : form.currency === 'GBP' ? '£' : form.currency === 'USD' ? '$' : form.currency + ' '}
                  {Number(form.base_price).toFixed(2)}
                  {form.price_type === 'hourly' ? '/hr' : ''}
                  {Number(form.tax_rate) > 0 && (
                    <span> ({form.tax_inclusive ? 'incl.' : 'excl.'} {form.tax_rate}% VAT)</span>
                  )}
                </p>
              </div>
            )}
          </TabsContent>

          {/* SCHEDULE */}
          <TabsContent value="schedule" className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label>Duration (minutes) *</Label>
              <Input type="number" min="5" step="5" value={form.duration_minutes} onChange={e => set('duration_minutes', e.target.value)} placeholder="60" />
            </div>
            <div className="space-y-1.5">
              <Label>Buffer Time (minutes)</Label>
              <p className="text-xs text-muted-foreground">Break between appointments for cleanup</p>
              <Input type="number" min="0" step="5" value={form.buffer_minutes} onChange={e => set('buffer_minutes', e.target.value)} placeholder="15" />
            </div>
            <div className="space-y-1.5">
              <Label>Max Bookings Per Day</Label>
              <Input type="number" min="1" value={form.max_bookings_per_day} onChange={e => set('max_bookings_per_day', e.target.value)} placeholder="10" />
            </div>
          </TabsContent>

          {/* PET REQUIREMENTS */}
          <TabsContent value="pets" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Accepted Pet Types</Label>
              <div className="grid grid-cols-4 gap-2">
                {PET_TYPES.map(pet => (
                  <button
                    key={pet}
                    type="button"
                    onClick={() => togglePetType(pet)}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-sm capitalize transition-colors',
                      form.pet_types_accepted.includes(pet)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-card-foreground border-border hover:border-primary/50'
                    )}
                  >
                    {pet}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Vaccination Required</Label>
                <p className="text-xs text-muted-foreground">Pets must have up-to-date vaccinations</p>
              </div>
              <Switch checked={form.vaccination_required} onCheckedChange={v => set('vaccination_required', v)} />
            </div>
            <div className="space-y-1.5">
              <Label>Age Restrictions</Label>
              <Input value={form.age_restrictions} onChange={e => set('age_restrictions', e.target.value)} placeholder="e.g. Puppies 6 months and older" />
            </div>
            <div className="space-y-1.5">
              <Label>Weight Limit (kg)</Label>
              <Input type="number" min="0" value={form.weight_limit_kg} onChange={e => set('weight_limit_kg', e.target.value)} placeholder="No limit" />
            </div>
            <div className="space-y-1.5">
              <Label>Breed Restrictions</Label>
              <div className="flex gap-2">
                <Input value={newBreed} onChange={e => setNewBreed(e.target.value)} placeholder="Add breed" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addToList('breed_restrictions', newBreed, setNewBreed))} />
                <Button type="button" variant="outline" size="sm" onClick={() => addToList('breed_restrictions', newBreed, setNewBreed)}><Plus className="w-4 h-4" /></Button>
              </div>
              {form.breed_restrictions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.breed_restrictions.map((b, i) => (
                    <Badge key={i} variant="secondary" className="text-xs gap-1">{b}<button onClick={() => removeFromList('breed_restrictions', i)}><X className="w-3 h-3" /></button></Badge>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* MEDIA */}
          <TabsContent value="media" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Cover Image</Label>
              <p className="text-xs text-muted-foreground">Main hero image shown on the service card</p>
              <MediaUploader
                bucket="service-media"
                folder="covers"
                single
                value={form.cover_image_url ? [form.cover_image_url] : []}
                onChange={(urls) => set('cover_image_url', urls[0] || '')}
              />
            </div>
            <div className="space-y-2">
              <Label>Gallery</Label>
              <p className="text-xs text-muted-foreground">Additional photos and GIFs (up to 8)</p>
              <MediaUploader
                bucket="service-media"
                folder="gallery"
                value={form.gallery_urls}
                onChange={(urls) => set('gallery_urls', urls)}
                maxFiles={8}
              />
            </div>
          </TabsContent>

          {/* DETAILS */}
          <TabsContent value="details" className="space-y-4 mt-4 pb-4">
            <div className="space-y-1.5">
              <Label>Full Description</Label>
              <Textarea value={form.long_description} onChange={e => set('long_description', e.target.value)} rows={4} placeholder="Detailed description of what's included..." />
            </div>
            <div className="space-y-1.5">
              <Label>Highlights / Key Features</Label>
              <div className="flex gap-2">
                <Input value={newHighlight} onChange={e => setNewHighlight(e.target.value)} placeholder="e.g. Organic shampoo included" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addToList('highlights', newHighlight, setNewHighlight))} />
                <Button type="button" variant="outline" size="sm" onClick={() => addToList('highlights', newHighlight, setNewHighlight)}><Plus className="w-4 h-4" /></Button>
              </div>
              {form.highlights.length > 0 && (
                <div className="space-y-1 mt-2">
                  {form.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm bg-accent/50 rounded-md px-3 py-1.5">
                      <span className="text-primary">✓</span>
                      <span className="flex-1">{h}</span>
                      <button onClick={() => removeFromList('highlights', i)} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Preparation Notes</Label>
              <Textarea value={form.preparation_notes} onChange={e => set('preparation_notes', e.target.value)} rows={2} placeholder="What pet owners should do before the appointment..." />
            </div>
            <div className="space-y-1.5">
              <Label>Aftercare Notes</Label>
              <Textarea value={form.aftercare_notes} onChange={e => set('aftercare_notes', e.target.value)} rows={2} placeholder="Post-service care instructions..." />
            </div>
            <div className="space-y-1.5">
              <Label>Cancellation Policy</Label>
              <Textarea value={form.cancellation_policy} onChange={e => set('cancellation_policy', e.target.value)} rows={2} placeholder="e.g. Free cancellation up to 24 hours before..." />
            </div>
          </TabsContent>
        </Tabs>

        <div className="sticky bottom-0 bg-background border-t px-6 py-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSave(form)} disabled={!isValid || saving}>
            {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Service'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

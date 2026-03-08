import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
import { Plus, X, Sparkles, MapPin, Clock, HelpCircle, DollarSign } from 'lucide-react';
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

const PET_TYPES = [
  'dog', 'cat', 'bird', 'rabbit', 'hamster', 'guinea pig', 'ferret', 'reptile',
  'fish', 'turtle', 'chinchilla', 'hedgehog', 'parrot', 'horse', 'pig', 'other',
];

const PET_EMOJIS: Record<string, string> = {
  dog: '🐕', cat: '🐈', bird: '🐦', rabbit: '🐇', hamster: '🐹', 'guinea pig': '🐹',
  ferret: '🦦', reptile: '🦎', fish: '🐟', turtle: '🐢', chinchilla: '🐭',
  hedgehog: '🦔', parrot: '🦜', horse: '🐴', pig: '🐷', other: '🐾',
};

const PRICE_TYPES = [
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'starting_from', label: 'Starting From' },
  { value: 'hourly', label: 'Per Hour' },
];

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const DIFFICULTY_LEVELS = [
  { value: 'basic', label: 'Basic', desc: 'Simple, routine service' },
  { value: 'standard', label: 'Standard', desc: 'Regular complexity' },
  { value: 'premium', label: 'Premium', desc: 'Advanced, specialized care' },
];

export interface ServiceFormData {
  name: string; category: string; custom_category: string; short_description: string; description: string;
  long_description: string; base_price: string; price_from: string; price_type: string;
  currency: string; tax_rate: string; tax_inclusive: boolean; duration_minutes: string;
  buffer_minutes: string; max_bookings_per_day: string; pet_types_accepted: string[];
  vaccination_required: boolean; age_restrictions: string; breed_restrictions: string[];
  weight_limit_kg: string; cover_image_url: string; gallery_urls: string[];
  preparation_notes: string; aftercare_notes: string; cancellation_policy: string;
  highlights: string[]; tags: string[]; is_active: boolean; featured: boolean;
  custom_pet_types: string[];
  service_addons: { name: string; price: number }[];
  deposit_required: boolean; deposit_amount: string; deposit_type: string;
  available_days: string[];
  available_time_start: string; available_time_end: string;
  min_advance_hours: string;
  service_location: string; service_area_km: string;
  pet_size_pricing: { small: string; medium: string; large: string; xl: string } | null;
  terms_conditions: string;
  faq: { question: string; answer: string }[];
  group_discount_percent: string;
  difficulty_level: string;
  recommended_services: string[];
}

const emptyForm: ServiceFormData = {
  name: '', category: 'grooming', custom_category: '', short_description: '', description: '', long_description: '',
  base_price: '', price_from: '', price_type: 'fixed', currency: 'EUR', tax_rate: '21',
  tax_inclusive: true, duration_minutes: '', buffer_minutes: '15', max_bookings_per_day: '10',
  pet_types_accepted: ['dog', 'cat'], vaccination_required: false, age_restrictions: '',
  breed_restrictions: [], weight_limit_kg: '', cover_image_url: '', gallery_urls: [],
  preparation_notes: '', aftercare_notes: '', cancellation_policy: '', highlights: [],
  tags: [], is_active: true, featured: false,
  custom_pet_types: [],
  service_addons: [],
  deposit_required: false, deposit_amount: '', deposit_type: 'fixed',
  available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
  available_time_start: '09:00', available_time_end: '18:00',
  min_advance_hours: '24',
  service_location: 'in_store', service_area_km: '',
  pet_size_pricing: null,
  terms_conditions: '',
  faq: [],
  group_discount_percent: '0',
  difficulty_level: 'standard',
  recommended_services: [],
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: any | null;
  onSave: (data: ServiceFormData) => void;
  saving?: boolean;
  allServices?: any[];
}

export default function ServiceFormDialog({ open, onOpenChange, editing, onSave, saving, allServices = [] }: Props) {
  const [form, setForm] = useState<ServiceFormData>(emptyForm);
  const [newHighlight, setNewHighlight] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newBreed, setNewBreed] = useState('');
  const [newCustomPet, setNewCustomPet] = useState('');
  const [newAddonName, setNewAddonName] = useState('');
  const [newAddonPrice, setNewAddonPrice] = useState('');
  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');
  const [sizePricingEnabled, setSizePricingEnabled] = useState(false);

  useEffect(() => {
    if (editing) {
      const psp = editing.pet_size_pricing;
      setSizePricingEnabled(!!psp);
      setForm({
        name: editing.name || '', category: editing.category || 'grooming',
        custom_category: editing.custom_category || '',
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
        custom_pet_types: editing.custom_pet_types || [],
        service_addons: editing.service_addons || [],
        deposit_required: editing.deposit_required || false,
        deposit_amount: editing.deposit_amount?.toString() || '',
        deposit_type: editing.deposit_type || 'fixed',
        available_days: editing.available_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        available_time_start: editing.available_time_start || '09:00',
        available_time_end: editing.available_time_end || '18:00',
        min_advance_hours: editing.min_advance_hours?.toString() || '24',
        service_location: editing.service_location || 'in_store',
        service_area_km: editing.service_area_km?.toString() || '',
        pet_size_pricing: psp ? { small: psp.small?.toString() || '', medium: psp.medium?.toString() || '', large: psp.large?.toString() || '', xl: psp.xl?.toString() || '' } : null,
        terms_conditions: editing.terms_conditions || '',
        faq: editing.faq || [],
        group_discount_percent: editing.group_discount_percent?.toString() || '0',
        difficulty_level: editing.difficulty_level || 'standard',
        recommended_services: editing.recommended_services || [],
      });
    } else {
      setForm(emptyForm);
      setSizePricingEnabled(false);
    }
  }, [editing, open]);

  const set = (key: keyof ServiceFormData, val: any) => setForm(f => ({ ...f, [key]: val }));

  const addToList = (key: 'highlights' | 'tags' | 'breed_restrictions' | 'custom_pet_types', val: string, setter: (v: string) => void) => {
    if (!val.trim()) return;
    set(key, [...(form[key] as string[]), val.trim()]);
    setter('');
  };

  const removeFromList = (key: 'highlights' | 'tags' | 'breed_restrictions' | 'custom_pet_types', idx: number) => {
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

  const toggleDay = (day: string) => {
    const arr = form.available_days;
    set('available_days', arr.includes(day) ? arr.filter(d => d !== day) : [...arr, day]);
  };

  const addAddon = () => {
    if (!newAddonName.trim() || !newAddonPrice) return;
    set('service_addons', [...form.service_addons, { name: newAddonName.trim(), price: parseFloat(newAddonPrice) }]);
    setNewAddonName(''); setNewAddonPrice('');
  };

  const removeAddon = (idx: number) => {
    set('service_addons', form.service_addons.filter((_, i) => i !== idx));
  };

  const addFaq = () => {
    if (!newFaqQ.trim() || !newFaqA.trim()) return;
    set('faq', [...form.faq, { question: newFaqQ.trim(), answer: newFaqA.trim() }]);
    setNewFaqQ(''); setNewFaqA('');
  };

  const removeFaq = (idx: number) => {
    set('faq', form.faq.filter((_, i) => i !== idx));
  };

  const toggleSizePricing = (enabled: boolean) => {
    setSizePricingEnabled(enabled);
    set('pet_size_pricing', enabled ? { small: '', medium: '', large: '', xl: '' } : null);
  };

  const setSizePrice = (size: string, val: string) => {
    if (!form.pet_size_pricing) return;
    set('pet_size_pricing', { ...form.pet_size_pricing, [size]: val });
  };

  const currSymbol = form.currency === 'EUR' ? '€' : form.currency === 'GBP' ? '£' : form.currency === 'USD' ? '$' : form.currency + ' ';

  const isValid = form.name && form.base_price && form.duration_minutes;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl w-full max-w-full overflow-y-auto p-0">
        <SheetHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
          <SheetTitle className="text-base sm:text-lg font-semibold">
            {editing ? 'Edit Service' : 'Create New Service'}
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="basic" className="px-4 sm:px-6">
          <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full h-auto gap-1 p-1">
            <TabsTrigger value="basic" className="text-xs px-2 py-1.5">Basic</TabsTrigger>
            <TabsTrigger value="pricing" className="text-xs px-2 py-1.5">Pricing</TabsTrigger>
            <TabsTrigger value="schedule" className="text-xs px-2 py-1.5">Schedule</TabsTrigger>
            <TabsTrigger value="pets" className="text-xs px-2 py-1.5">Pets</TabsTrigger>
            <TabsTrigger value="media" className="text-xs px-2 py-1.5">Media</TabsTrigger>
            <TabsTrigger value="details" className="text-xs px-2 py-1.5">Details</TabsTrigger>
          </TabsList>

          {/* BASIC INFO */}
          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label>Service Name *</Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Premium Dog Grooming" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => { set('category', v); if (v !== 'other') set('custom_category', ''); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Difficulty Level</Label>
                <Select value={form.difficulty_level} onValueChange={v => set('difficulty_level', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DIFFICULTY_LEVELS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {form.category === 'other' && (
              <div className="space-y-1.5">
                <Label>Custom Category Name *</Label>
                <Input value={form.custom_category} onChange={e => set('custom_category', e.target.value)} placeholder="e.g. Aquatics, Exotic Care, Hydrotherapy" />
                <p className="text-xs text-muted-foreground">Specify the category since "Other" was selected</p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Short Description <span className="text-muted-foreground text-xs">(max 120 chars)</span></Label>
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

            {/* Add-ons */}
            <div className="border-t pt-4 space-y-3">
              <Label className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Service Add-ons</Label>
              <p className="text-xs text-muted-foreground">Optional extras customers can add (e.g. "Nail Trim", "Teeth Brushing")</p>
              <div className="flex gap-2">
                <Input value={newAddonName} onChange={e => setNewAddonName(e.target.value)} placeholder="Add-on name" className="flex-1" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAddon())} />
                <Input type="number" min="0" step="0.01" value={newAddonPrice} onChange={e => setNewAddonPrice(e.target.value)} placeholder="Price" className="w-24" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAddon())} />
                <Button type="button" variant="outline" size="sm" onClick={addAddon}><Plus className="w-4 h-4" /></Button>
              </div>
              {form.service_addons.length > 0 && (
                <div className="space-y-1.5">
                  {form.service_addons.map((a, i) => (
                    <div key={i} className="flex items-center justify-between bg-accent/50 rounded-md px-3 py-1.5 text-sm">
                      <span>{a.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">+{currSymbol}{Number(a.price).toFixed(2)}</span>
                        <button onClick={() => removeAddon(i)} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Group Discount */}
            <div className="border-t pt-4 space-y-2">
              <Label>Multi-Pet Discount (%)</Label>
              <p className="text-xs text-muted-foreground">Discount when customer books for multiple pets</p>
              <Input type="number" min="0" max="100" value={form.group_discount_percent} onChange={e => set('group_discount_percent', e.target.value)} placeholder="0" className="w-32" />
            </div>

            {/* Deposit */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Deposit Required</Label>
                  <p className="text-xs text-muted-foreground">Require advance payment to confirm booking</p>
                </div>
                <Switch checked={form.deposit_required} onCheckedChange={v => set('deposit_required', v)} />
              </div>
              {form.deposit_required && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Deposit Type</Label>
                    <Select value={form.deposit_type} onValueChange={v => set('deposit_type', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{form.deposit_type === 'percentage' ? 'Deposit %' : `Deposit Amount (${currSymbol})`}</Label>
                    <Input type="number" min="0" value={form.deposit_amount} onChange={e => set('deposit_amount', e.target.value)} placeholder={form.deposit_type === 'percentage' ? '50' : '20.00'} />
                  </div>
                </div>
              )}
            </div>

            {Number(form.base_price) > 0 && (
              <div className="rounded-lg bg-accent/50 p-3 text-sm">
                <p className="font-medium">Price Preview</p>
                <p className="text-muted-foreground mt-1">
                  {form.price_type === 'starting_from' ? 'From ' : ''}
                  {currSymbol}{Number(form.base_price).toFixed(2)}
                  {form.price_type === 'hourly' ? '/hr' : ''}
                  {Number(form.tax_rate) > 0 && <span> ({form.tax_inclusive ? 'incl.' : 'excl.'} {form.tax_rate}% VAT)</span>}
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

            {/* Availability */}
            <div className="border-t pt-4 space-y-3">
              <Label className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Availability</Label>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Available Days</Label>
                <div className="grid grid-cols-7 gap-1.5">
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={cn(
                        'rounded-md border px-1 py-2 text-xs capitalize transition-colors',
                        form.available_days.includes(day)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card text-card-foreground border-border hover:border-primary/50'
                      )}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Start Time</Label>
                  <Input type="time" value={form.available_time_start} onChange={e => set('available_time_start', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>End Time</Label>
                  <Input type="time" value={form.available_time_end} onChange={e => set('available_time_end', e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Minimum Advance Booking (hours)</Label>
                <p className="text-xs text-muted-foreground">How far in advance must customers book</p>
                <Input type="number" min="0" value={form.min_advance_hours} onChange={e => set('min_advance_hours', e.target.value)} placeholder="24" className="w-32" />
              </div>
            </div>

            {/* Location */}
            <div className="border-t pt-4 space-y-3">
              <Label className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Service Location</Label>
              <Select value={form.service_location} onValueChange={v => set('service_location', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_store">In-Store Only</SelectItem>
                  <SelectItem value="mobile">Mobile (At Customer's Home)</SelectItem>
                  <SelectItem value="both">Both In-Store & Mobile</SelectItem>
                </SelectContent>
              </Select>
              {(form.service_location === 'mobile' || form.service_location === 'both') && (
                <div className="space-y-1.5">
                  <Label>Service Area Radius (km)</Label>
                  <Input type="number" min="0" value={form.service_area_km} onChange={e => set('service_area_km', e.target.value)} placeholder="25" className="w-32" />
                </div>
              )}
            </div>
          </TabsContent>

          {/* PET REQUIREMENTS */}
          <TabsContent value="pets" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Accepted Pet Types</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PET_TYPES.map(pet => (
                  <button
                    key={pet}
                    type="button"
                    onClick={() => togglePetType(pet)}
                    className={cn(
                      'rounded-lg border px-2 py-2 text-xs capitalize transition-colors flex items-center gap-1.5',
                      form.pet_types_accepted.includes(pet)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-card-foreground border-border hover:border-primary/50'
                    )}
                  >
                    <span>{PET_EMOJIS[pet] || '🐾'}</span>
                    <span>{pet}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom pet types when "other" is selected */}
            {form.pet_types_accepted.includes('other') && (
              <div className="space-y-2 rounded-lg border border-dashed border-primary/30 p-3">
                <Label className="text-xs">Specify Custom Pet Types</Label>
                <p className="text-xs text-muted-foreground">Add the specific animals you accept that aren't listed above</p>
                <div className="flex gap-2">
                  <Input value={newCustomPet} onChange={e => setNewCustomPet(e.target.value)} placeholder="e.g. Sugar Glider, Axolotl..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addToList('custom_pet_types', newCustomPet, setNewCustomPet))} />
                  <Button type="button" variant="outline" size="sm" onClick={() => addToList('custom_pet_types', newCustomPet, setNewCustomPet)}><Plus className="w-4 h-4" /></Button>
                </div>
                {form.custom_pet_types.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.custom_pet_types.map((p, i) => (
                      <Badge key={i} variant="secondary" className="text-xs gap-1 capitalize">🐾 {p}<button onClick={() => removeFromList('custom_pet_types', i)}><X className="w-3 h-3" /></button></Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Pet Size Pricing */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Size-Based Pricing</Label>
                  <p className="text-xs text-muted-foreground">Set different prices based on pet size</p>
                </div>
                <Switch checked={sizePricingEnabled} onCheckedChange={toggleSizePricing} />
              </div>
              {sizePricingEnabled && form.pet_size_pricing && (
                <div className="grid grid-cols-2 gap-3">
                  {(['small', 'medium', 'large', 'xl'] as const).map(size => (
                    <div key={size} className="space-y-1">
                      <Label className="text-xs capitalize">{size} {size === 'xl' ? '(Extra Large)' : ''}</Label>
                      <Input type="number" min="0" step="0.01" value={form.pet_size_pricing![size]} onChange={e => setSizePrice(size, e.target.value)} placeholder={`${currSymbol}0.00`} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Group Discount */}
            <div className="border-t pt-4 space-y-2">
              <Label>Multi-Pet Discount (%)</Label>
              <p className="text-xs text-muted-foreground">Discount when customer brings 2+ pets</p>
              <Input type="number" min="0" max="100" value={form.group_discount_percent} onChange={e => set('group_discount_percent', e.target.value)} placeholder="0" className="w-32" />
            </div>

            <div className="border-t pt-4 flex items-center justify-between">
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

            {/* Terms & Conditions */}
            <div className="border-t pt-4 space-y-1.5">
              <Label>Terms & Conditions</Label>
              <Textarea value={form.terms_conditions} onChange={e => set('terms_conditions', e.target.value)} rows={3} placeholder="Terms customers must accept before booking..." />
            </div>

            {/* Recommendations */}
            {allServices.length > 0 && (
              <div className="border-t pt-4 space-y-3">
                <Label className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Recommended Services</Label>
                <p className="text-xs text-muted-foreground">Suggest related services customers might also like ("You Might Also Like")</p>
                <div className="space-y-2">
                  {allServices
                    .filter((srv: any) => srv.id !== editing?.id)
                    .map((srv: any) => (
                      <label key={srv.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={form.recommended_services.includes(srv.id)}
                          onCheckedChange={(checked) => {
                            set('recommended_services', checked
                              ? [...form.recommended_services, srv.id]
                              : form.recommended_services.filter((id: string) => id !== srv.id)
                            );
                          }}
                        />
                        <span>{srv.name}</span>
                        <Badge variant="secondary" className="text-[10px] capitalize">{srv.custom_category || srv.category}</Badge>
                      </label>
                    ))}
                </div>
              </div>
            )}

            <div className="border-t pt-4 space-y-3">
              <Label className="flex items-center gap-1.5"><HelpCircle className="w-3.5 h-3.5" /> FAQ</Label>
              <p className="text-xs text-muted-foreground">Common questions customers ask about this service</p>
              <div className="space-y-2">
                <Input value={newFaqQ} onChange={e => setNewFaqQ(e.target.value)} placeholder="Question" />
                <Textarea value={newFaqA} onChange={e => setNewFaqA(e.target.value)} placeholder="Answer" rows={2} />
                <Button type="button" variant="outline" size="sm" onClick={addFaq}><Plus className="w-4 h-4 mr-1" /> Add FAQ</Button>
              </div>
              {form.faq.length > 0 && (
                <div className="space-y-2 mt-2">
                  {form.faq.map((f, i) => (
                    <div key={i} className="bg-accent/50 rounded-md p-3 text-sm">
                      <div className="flex justify-between">
                        <p className="font-medium">Q: {f.question}</p>
                        <button onClick={() => removeFaq(i)} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                      </div>
                      <p className="text-muted-foreground mt-1">A: {f.answer}</p>
                    </div>
                  ))}
                </div>
              )}
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

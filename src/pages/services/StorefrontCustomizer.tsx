import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import MediaUploader from '@/components/MediaUploader';
import {
  useStorefrontSettings,
  useUpdateStorefrontSettings,
  THEME_PRESETS,
  StorefrontSettings,
} from '@/hooks/useStorefrontSettings';
import {
  Palette, Image as ImageIcon, LayoutGrid, Users, MegaphoneIcon, Clock, Share2, HelpCircle,
  Award, Search, Save, Loader2, Plus, Trash2, GripVertical, Eye, EyeOff, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

const SECTION_LABELS: Record<string, string> = {
  announcement: 'Announcement bar',
  hero: 'Hero banner',
  trust: 'Trust badges',
  festivals: 'Festival offers',
  promos: 'Active promotions',
  featured_services: 'Featured services',
  categories: 'Category filter',
  services: 'Service grid',
  memberships: 'Membership plans',
  packages: 'Prepaid packages',
  gallery: 'Photo gallery',
  about: 'About us',
  team: 'Meet the team',
  reviews: 'Customer reviews',
  faq: 'FAQ',
  hours: 'Business hours',
  map: 'Location & map',
  contact: 'Contact info',
  newsletter: 'Newsletter signup',
  social: 'Social links',
  press: 'As seen in',
  certifications: 'Certifications',
  loyalty: 'Loyalty teaser',
  instagram: 'Instagram feed',
};

export default function StorefrontCustomizer({ open, onOpenChange }: Props) {
  const { data: settings, isLoading } = useStorefrontSettings();
  const update = useUpdateStorefrontSettings();
  const [local, setLocal] = useState<StorefrontSettings | null>(null);

  useEffect(() => { if (settings) setLocal(settings); }, [settings]);

  if (!open) return null;

  const set = <K extends keyof StorefrontSettings>(k: K, v: StorefrontSettings[K]) => {
    setLocal(p => p ? { ...p, [k]: v } : p);
  };

  const applyPreset = (key: string) => {
    const p = THEME_PRESETS[key]; if (!p || !local) return;
    setLocal({ ...local, theme_preset: key, primary_color: p.primary, accent_color: p.accent, hero_gradient_from: p.from, hero_gradient_to: p.to });
  };

  const save = async () => {
    if (!local) return;
    const { id, created_at, updated_at, ...rest } = local as any;
    await update.mutateAsync(rest);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-6 py-4 flex items-center justify-between">
          <div>
            <SheetHeader className="text-left space-y-0.5">
              <SheetTitle className="flex items-center gap-2 text-lg"><Sparkles className="w-5 h-5 text-primary" /> Storefront Customizer</SheetTitle>
              <SheetDescription className="text-xs">Everything your marketing team needs to make the store convert.</SheetDescription>
            </SheetHeader>
          </div>
          <Button onClick={save} disabled={update.isPending || !local} size="sm" className="gap-1.5">
            {update.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </Button>
        </div>

        {isLoading || !local ? (
          <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <Tabs defaultValue="brand" className="w-full">
            <TabsList className="sticky top-[65px] z-10 grid grid-cols-5 lg:grid-cols-10 h-auto bg-muted/50 rounded-none border-b p-1 gap-0.5">
              <TabsTrigger value="brand" className="flex-col h-14 gap-0.5 text-[10px]"><Palette className="w-3.5 h-3.5" />Brand</TabsTrigger>
              <TabsTrigger value="hero" className="flex-col h-14 gap-0.5 text-[10px]"><ImageIcon className="w-3.5 h-3.5" />Hero</TabsTrigger>
              <TabsTrigger value="sections" className="flex-col h-14 gap-0.5 text-[10px]"><LayoutGrid className="w-3.5 h-3.5" />Sections</TabsTrigger>
              <TabsTrigger value="gallery" className="flex-col h-14 gap-0.5 text-[10px]"><ImageIcon className="w-3.5 h-3.5" />Photos</TabsTrigger>
              <TabsTrigger value="about" className="flex-col h-14 gap-0.5 text-[10px]"><Users className="w-3.5 h-3.5" />About</TabsTrigger>
              <TabsTrigger value="marketing" className="flex-col h-14 gap-0.5 text-[10px]"><MegaphoneIcon className="w-3.5 h-3.5" />Marketing</TabsTrigger>
              <TabsTrigger value="hours" className="flex-col h-14 gap-0.5 text-[10px]"><Clock className="w-3.5 h-3.5" />Hours</TabsTrigger>
              <TabsTrigger value="contact" className="flex-col h-14 gap-0.5 text-[10px]"><Share2 className="w-3.5 h-3.5" />Contact</TabsTrigger>
              <TabsTrigger value="trust" className="flex-col h-14 gap-0.5 text-[10px]"><Award className="w-3.5 h-3.5" />Trust</TabsTrigger>
              <TabsTrigger value="seo" className="flex-col h-14 gap-0.5 text-[10px]"><Search className="w-3.5 h-3.5" />SEO</TabsTrigger>
            </TabsList>

            {/* ============ BRAND ============ */}
            <TabsContent value="brand" className="p-6 space-y-5 mt-0">
              <SectionTitle>Business identity</SectionTitle>
              <Field label="Business name">
                <Input value={local.business_name} onChange={(e) => set('business_name', e.target.value)} />
              </Field>
              <Field label="Tagline">
                <Input value={local.tagline || ''} onChange={(e) => set('tagline', e.target.value)} placeholder="Your one-line pitch" />
              </Field>
              <Field label="Logo">
                <MediaUploader single bucket="service-media" folder="storefront/logo" value={local.logo_url ? [local.logo_url] : []} onChange={(u) => set('logo_url', u[0] || null)} />
              </Field>

              <Separator />
              <SectionTitle>Theme preset</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {Object.entries(THEME_PRESETS).map(([k, p]) => (
                  <button
                    key={k}
                    onClick={() => applyPreset(k)}
                    className={cn('rounded-xl border-2 p-3 text-left transition-all hover:shadow-md', local.theme_preset === k ? 'border-primary shadow-md' : 'border-border')}
                  >
                    <div className="h-12 rounded-md mb-2" style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }} />
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full" style={{ background: p.primary }} />
                      <div className="text-[11px] font-semibold">{p.label}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Primary color">
                  <div className="flex gap-2">
                    <Input type="color" className="w-14 p-1 h-9" value={hslOrHexToHex(local.primary_color)} onChange={(e) => set('primary_color', e.target.value)} />
                    <Input value={local.primary_color || ''} onChange={(e) => set('primary_color', e.target.value)} />
                  </div>
                </Field>
                <Field label="Accent color">
                  <div className="flex gap-2">
                    <Input type="color" className="w-14 p-1 h-9" value={hslOrHexToHex(local.accent_color)} onChange={(e) => set('accent_color', e.target.value)} />
                    <Input value={local.accent_color || ''} onChange={(e) => set('accent_color', e.target.value)} />
                  </div>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Gradient from">
                  <Input type="color" value={local.hero_gradient_from || '#000000'} onChange={(e) => set('hero_gradient_from', e.target.value)} className="h-10" />
                </Field>
                <Field label="Gradient to">
                  <Input type="color" value={local.hero_gradient_to || '#000000'} onChange={(e) => set('hero_gradient_to', e.target.value)} className="h-10" />
                </Field>
              </div>
            </TabsContent>

            {/* ============ HERO ============ */}
            <TabsContent value="hero" className="p-6 space-y-5 mt-0">
              <SectionTitle>Hero style</SectionTitle>
              <div className="grid grid-cols-4 gap-2">
                {(['gradient', 'image', 'video', 'split'] as const).map((s) => (
                  <button key={s} onClick={() => set('hero_style', s)} className={cn('capitalize rounded-lg border-2 p-2.5 text-xs font-semibold transition', local.hero_style === s ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted')}>{s}</button>
                ))}
              </div>

              <Field label="Headline">
                <Input value={local.hero_headline || ''} onChange={(e) => set('hero_headline', e.target.value)} />
              </Field>
              <Field label="Subheadline">
                <Textarea rows={2} value={local.hero_subheadline || ''} onChange={(e) => set('hero_subheadline', e.target.value)} />
              </Field>

              {(local.hero_style === 'image' || local.hero_style === 'split') && (
                <Field label="Hero image">
                  <MediaUploader single bucket="service-media" folder="storefront/hero" value={local.hero_media_url ? [local.hero_media_url] : []} onChange={(u) => set('hero_media_url', u[0] || null)} />
                </Field>
              )}
              {local.hero_style === 'video' && (
                <Field label="Video URL (MP4 or YouTube embed)">
                  <Input value={local.hero_video_url || ''} onChange={(e) => set('hero_video_url', e.target.value)} placeholder="https://…" />
                </Field>
              )}

              <Separator />
              <SectionTitle>Call-to-action buttons</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Primary label"><Input value={local.hero_cta_label || ''} onChange={(e) => set('hero_cta_label', e.target.value)} /></Field>
                <Field label="Primary link"><Input value={local.hero_cta_link || ''} onChange={(e) => set('hero_cta_link', e.target.value)} placeholder="#services" /></Field>
                <Field label="Secondary label"><Input value={local.hero_cta_secondary_label || ''} onChange={(e) => set('hero_cta_secondary_label', e.target.value)} placeholder="Optional" /></Field>
                <Field label="Secondary link"><Input value={local.hero_cta_secondary_link || ''} onChange={(e) => set('hero_cta_secondary_link', e.target.value)} /></Field>
              </div>
            </TabsContent>

            {/* ============ SECTIONS ============ */}
            <TabsContent value="sections" className="p-6 space-y-4 mt-0">
              <SectionTitle>Show / hide storefront sections</SectionTitle>
              <p className="text-xs text-muted-foreground">Toggle each block below. Changes appear in the live preview instantly.</p>
              <div className="grid gap-1.5">
                {Object.entries(SECTION_LABELS).map(([key, label]) => {
                  const enabled = local.section_visibility?.[key] ?? true;
                  return (
                    <div key={key} className="flex items-center justify-between px-3 py-2.5 rounded-lg border hover:bg-muted/50 transition">
                      <div className="flex items-center gap-2.5">
                        {enabled ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                        <span className="text-sm font-medium">{label}</span>
                      </div>
                      <Switch checked={enabled} onCheckedChange={(v) => set('section_visibility', { ...local.section_visibility, [key]: v })} />
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* ============ GALLERY ============ */}
            <TabsContent value="gallery" className="p-6 space-y-5 mt-0">
              <SectionTitle>Photo gallery</SectionTitle>
              <p className="text-xs text-muted-foreground">Show off your facility, groom transformations, and happy pets. Recommended: 6–12 photos.</p>
              <MediaUploader
                bucket="service-media"
                folder="storefront/gallery"
                maxFiles={24}
                value={(local.gallery_urls || []).map(g => g.url)}
                onChange={(urls) => set('gallery_urls', urls.map(u => {
                  const existing = local.gallery_urls?.find(g => g.url === u);
                  return existing || { url: u };
                }))}
              />
              <Field label="Layout">
                <div className="flex gap-2">
                  {['masonry', 'grid', 'carousel'].map(l => (
                    <button key={l} onClick={() => set('gallery_layout', l)} className={cn('flex-1 capitalize rounded-lg border-2 p-2 text-xs font-semibold', local.gallery_layout === l ? 'border-primary bg-primary/10' : 'border-border')}>{l}</button>
                  ))}
                </div>
              </Field>
            </TabsContent>

            {/* ============ ABOUT + TEAM ============ */}
            <TabsContent value="about" className="p-6 space-y-5 mt-0">
              <SectionTitle>About your business</SectionTitle>
              <Field label="Section title"><Input value={local.about_title || ''} onChange={(e) => set('about_title', e.target.value)} /></Field>
              <Field label="Story"><Textarea rows={5} value={local.about_body || ''} onChange={(e) => set('about_body', e.target.value)} placeholder="Tell your story…" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Years in business"><Input type="number" value={local.years_in_business ?? ''} onChange={(e) => set('years_in_business', e.target.value ? Number(e.target.value) : null)} /></Field>
                <Field label="Pets served"><Input type="number" value={local.pets_served ?? ''} onChange={(e) => set('pets_served', e.target.value ? Number(e.target.value) : null)} /></Field>
              </div>
              <Field label="About photo">
                <MediaUploader single bucket="service-media" folder="storefront/about" value={local.about_image_url ? [local.about_image_url] : []} onChange={(u) => set('about_image_url', u[0] || null)} />
              </Field>

              <Separator />
              <div className="flex items-center justify-between">
                <SectionTitle>Meet the team</SectionTitle>
                <Button size="sm" variant="outline" onClick={() => set('team_members', [...(local.team_members || []), { name: '', role: '' }])}><Plus className="w-3.5 h-3.5 mr-1" /> Add</Button>
              </div>
              <div className="space-y-3">
                {(local.team_members || []).map((m, i) => (
                  <div key={i} className="rounded-xl border p-3 space-y-2 bg-muted/30">
                    <div className="flex items-start gap-3">
                      <div className="w-16 flex-shrink-0">
                        <MediaUploader single bucket="service-media" folder="storefront/team" value={m.photo_url ? [m.photo_url] : []} onChange={(u) => {
                          const next = [...local.team_members]; next[i] = { ...m, photo_url: u[0] }; set('team_members', next);
                        }} />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <Input placeholder="Name" value={m.name} onChange={(e) => { const n = [...local.team_members]; n[i] = { ...m, name: e.target.value }; set('team_members', n); }} />
                        <Input placeholder="Role (e.g. Senior Groomer)" value={m.role || ''} onChange={(e) => { const n = [...local.team_members]; n[i] = { ...m, role: e.target.value }; set('team_members', n); }} />
                        <Textarea rows={2} placeholder="Bio (optional)" value={m.bio || ''} onChange={(e) => { const n = [...local.team_members]; n[i] = { ...m, bio: e.target.value }; set('team_members', n); }} />
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => set('team_members', local.team_members.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
                {(local.team_members || []).length === 0 && <p className="text-xs text-muted-foreground text-center py-6">No team members yet</p>}
              </div>
            </TabsContent>

            {/* ============ MARKETING ============ */}
            <TabsContent value="marketing" className="p-6 space-y-5 mt-0">
              <SectionTitle>Announcement bar</SectionTitle>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label className="text-sm">Show announcement at top of store</Label>
                <Switch checked={local.announcement_enabled} onCheckedChange={(v) => set('announcement_enabled', v)} />
              </div>
              <Field label="Message"><Input value={local.announcement_text || ''} onChange={(e) => set('announcement_text', e.target.value)} placeholder="🎉 Summer sale — 20% off all grooms" /></Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Background"><Input type="color" value={local.announcement_bg || '#111111'} onChange={(e) => set('announcement_bg', e.target.value)} className="h-9 w-full" /></Field>
                <Field label="Text color"><Input type="color" value={local.announcement_fg || '#ffffff'} onChange={(e) => set('announcement_fg', e.target.value)} className="h-9 w-full" /></Field>
                <Field label="Link (optional)"><Input value={local.announcement_link || ''} onChange={(e) => set('announcement_link', e.target.value)} /></Field>
              </div>

              <Separator />
              <SectionTitle>Newsletter</SectionTitle>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label className="text-sm">Enable signup section</Label>
                <Switch checked={local.newsletter_enabled} onCheckedChange={(v) => set('newsletter_enabled', v)} />
              </div>
              <Field label="Headline"><Input value={local.newsletter_headline || ''} onChange={(e) => set('newsletter_headline', e.target.value)} /></Field>
              <Field label="Subheadline"><Input value={local.newsletter_subheadline || ''} onChange={(e) => set('newsletter_subheadline', e.target.value)} /></Field>

              <Separator />
              <SectionTitle>Marketing pop-up</SectionTitle>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label className="text-sm">Show pop-up on first visit</Label>
                <Switch checked={local.popup_enabled} onCheckedChange={(v) => set('popup_enabled', v)} />
              </div>
              <Field label="Headline"><Input value={local.popup_headline || ''} onChange={(e) => set('popup_headline', e.target.value)} placeholder="Get 10% off" /></Field>
              <Field label="Body"><Textarea rows={2} value={local.popup_body || ''} onChange={(e) => set('popup_body', e.target.value)} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="CTA label"><Input value={local.popup_cta_label || ''} onChange={(e) => set('popup_cta_label', e.target.value)} /></Field>
                <Field label="CTA link"><Input value={local.popup_cta_link || ''} onChange={(e) => set('popup_cta_link', e.target.value)} /></Field>
              </div>

              <Separator />
              <SectionTitle>Loyalty teaser</SectionTitle>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label className="text-sm">Show loyalty banner</Label>
                <Switch checked={local.loyalty_teaser_enabled} onCheckedChange={(v) => set('loyalty_teaser_enabled', v)} />
              </div>
              <Field label="Text"><Input value={local.loyalty_teaser_text || ''} onChange={(e) => set('loyalty_teaser_text', e.target.value)} /></Field>

              <Separator />
              <div className="flex items-center justify-between">
                <SectionTitle>FAQ</SectionTitle>
                <Button size="sm" variant="outline" onClick={() => set('faqs', [...(local.faqs || []), { q: '', a: '' }])}><Plus className="w-3.5 h-3.5 mr-1" /> Add</Button>
              </div>
              <div className="space-y-2">
                {(local.faqs || []).map((f, i) => (
                  <div key={i} className="rounded-lg border p-3 space-y-2 bg-muted/30">
                    <Input placeholder="Question" value={f.q} onChange={(e) => { const n = [...local.faqs]; n[i] = { ...f, q: e.target.value }; set('faqs', n); }} />
                    <Textarea rows={2} placeholder="Answer" value={f.a} onChange={(e) => { const n = [...local.faqs]; n[i] = { ...f, a: e.target.value }; set('faqs', n); }} />
                    <Button size="sm" variant="ghost" onClick={() => set('faqs', local.faqs.filter((_, j) => j !== i))}><Trash2 className="w-3.5 h-3.5 text-destructive mr-1" /> Remove</Button>
                  </div>
                ))}
                {(local.faqs || []).length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No FAQs yet</p>}
              </div>
            </TabsContent>

            {/* ============ HOURS ============ */}
            <TabsContent value="hours" className="p-6 space-y-4 mt-0">
              <SectionTitle>Business hours</SectionTitle>
              {DAYS.map(day => {
                const h = local.business_hours?.[day] || { open: '09:00', close: '18:00', closed: false };
                return (
                  <div key={day} className="grid grid-cols-[100px_1fr_1fr_auto] items-center gap-3 rounded-lg border p-3">
                    <div className="capitalize text-sm font-semibold">{day}</div>
                    <Input type="time" value={h.open} disabled={h.closed} onChange={(e) => set('business_hours', { ...local.business_hours, [day]: { ...h, open: e.target.value } })} />
                    <Input type="time" value={h.close} disabled={h.closed} onChange={(e) => set('business_hours', { ...local.business_hours, [day]: { ...h, close: e.target.value } })} />
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Closed</Label>
                      <Switch checked={h.closed} onCheckedChange={(v) => set('business_hours', { ...local.business_hours, [day]: { ...h, closed: v } })} />
                    </div>
                  </div>
                );
              })}
              <Field label="Timezone"><Input value={local.timezone} onChange={(e) => set('timezone', e.target.value)} /></Field>
            </TabsContent>

            {/* ============ CONTACT + SOCIAL ============ */}
            <TabsContent value="contact" className="p-6 space-y-5 mt-0">
              <SectionTitle>Contact info</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Phone"><Input value={local.contact_phone || ''} onChange={(e) => set('contact_phone', e.target.value)} /></Field>
                <Field label="Email"><Input type="email" value={local.contact_email || ''} onChange={(e) => set('contact_email', e.target.value)} /></Field>
              </div>
              <Field label="Address"><Textarea rows={2} value={local.contact_address || ''} onChange={(e) => set('contact_address', e.target.value)} /></Field>
              <Field label="Google Maps embed URL">
                <Input value={local.map_embed_url || ''} onChange={(e) => set('map_embed_url', e.target.value)} placeholder="https://www.google.com/maps/embed?…" />
              </Field>

              <Separator />
              <SectionTitle>Social links</SectionTitle>
              {[
                ['social_instagram', 'Instagram'], ['social_facebook', 'Facebook'], ['social_tiktok', 'TikTok'],
                ['social_youtube', 'YouTube'], ['social_whatsapp', 'WhatsApp'], ['social_x', 'X (Twitter)'],
                ['social_google', 'Google Business'],
              ].map(([key, label]) => (
                <Field key={key} label={label}><Input value={(local as any)[key] || ''} onChange={(e) => set(key as any, e.target.value)} placeholder="https://…" /></Field>
              ))}

              <Separator />
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div><Label className="text-sm">Show Instagram feed</Label><p className="text-xs text-muted-foreground">Embed latest posts</p></div>
                <Switch checked={local.instagram_feed_enabled} onCheckedChange={(v) => set('instagram_feed_enabled', v)} />
              </div>
              <Field label="Instagram handle (no @)"><Input value={local.instagram_handle || ''} onChange={(e) => set('instagram_handle', e.target.value)} /></Field>
            </TabsContent>

            {/* ============ TRUST ============ */}
            <TabsContent value="trust" className="p-6 space-y-5 mt-0">
              <div className="flex items-center justify-between">
                <SectionTitle>Trust badges (shown in hero)</SectionTitle>
                <Button size="sm" variant="outline" onClick={() => set('trust_badges', [...(local.trust_badges || []), { icon: 'Star', text: '' }])}><Plus className="w-3.5 h-3.5 mr-1" /> Add</Button>
              </div>
              <div className="space-y-2">
                {(local.trust_badges || []).map((b, i) => (
                  <div key={i} className="flex gap-2 rounded-lg border p-2 bg-muted/30">
                    <Input placeholder="Icon (Star, Heart, Award, Shield, Crown)" value={b.icon} onChange={(e) => { const n = [...local.trust_badges]; n[i] = { ...b, icon: e.target.value }; set('trust_badges', n); }} className="w-40" />
                    <Input placeholder="Label" value={b.text} onChange={(e) => { const n = [...local.trust_badges]; n[i] = { ...b, text: e.target.value }; set('trust_badges', n); }} />
                    <Button size="icon" variant="ghost" onClick={() => set('trust_badges', local.trust_badges.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                ))}
              </div>

              <Separator />
              <div className="flex items-center justify-between">
                <SectionTitle>Press logos ("As seen in")</SectionTitle>
                <Button size="sm" variant="outline" onClick={() => set('press_logos', [...(local.press_logos || []), { name: '', logo_url: '' }])}><Plus className="w-3.5 h-3.5 mr-1" /> Add</Button>
              </div>
              <div className="space-y-2">
                {(local.press_logos || []).map((p, i) => (
                  <div key={i} className="rounded-lg border p-2 flex gap-2 items-center bg-muted/30">
                    <div className="w-16"><MediaUploader single bucket="service-media" folder="storefront/press" value={p.logo_url ? [p.logo_url] : []} onChange={(u) => { const n = [...local.press_logos]; n[i] = { ...p, logo_url: u[0] || '' }; set('press_logos', n); }} /></div>
                    <Input placeholder="Name" value={p.name} onChange={(e) => { const n = [...local.press_logos]; n[i] = { ...p, name: e.target.value }; set('press_logos', n); }} />
                    <Button size="icon" variant="ghost" onClick={() => set('press_logos', local.press_logos.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                ))}
              </div>

              <Separator />
              <div className="flex items-center justify-between">
                <SectionTitle>Certifications</SectionTitle>
                <Button size="sm" variant="outline" onClick={() => set('certifications', [...(local.certifications || []), { name: '' }])}><Plus className="w-3.5 h-3.5 mr-1" /> Add</Button>
              </div>
              <div className="space-y-2">
                {(local.certifications || []).map((c, i) => (
                  <div key={i} className="rounded-lg border p-2 flex gap-2 items-center bg-muted/30">
                    <Input placeholder="e.g. Certified Master Groomer" value={c.name} onChange={(e) => { const n = [...local.certifications]; n[i] = { ...c, name: e.target.value }; set('certifications', n); }} />
                    <Button size="icon" variant="ghost" onClick={() => set('certifications', local.certifications.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                ))}
              </div>

              <Separator />
              <SectionTitle>Policies</SectionTitle>
              <Field label="Cancellation policy"><Textarea rows={3} value={local.cancellation_policy || ''} onChange={(e) => set('cancellation_policy', e.target.value)} /></Field>
              <Field label="Refund policy"><Textarea rows={3} value={local.refund_policy || ''} onChange={(e) => set('refund_policy', e.target.value)} /></Field>
              <Field label="Vaccination policy"><Textarea rows={3} value={local.vaccination_policy || ''} onChange={(e) => set('vaccination_policy', e.target.value)} /></Field>
            </TabsContent>

            {/* ============ SEO ============ */}
            <TabsContent value="seo" className="p-6 space-y-5 mt-0">
              <SectionTitle>Search engine optimization</SectionTitle>
              <Field label="Meta title"><Input value={local.meta_title || ''} onChange={(e) => set('meta_title', e.target.value)} placeholder="Your store • Premium pet care" /></Field>
              <Field label="Meta description"><Textarea rows={3} value={local.meta_description || ''} onChange={(e) => set('meta_description', e.target.value)} /></Field>
              <Field label="Social preview image (OG)">
                <MediaUploader single bucket="service-media" folder="storefront/og" value={local.og_image_url ? [local.og_image_url] : []} onChange={(u) => set('og_image_url', u[0] || null)} />
              </Field>
              <Separator />
              <SectionTitle>Analytics</SectionTitle>
              <Field label="Google Analytics ID"><Input value={local.google_analytics_id || ''} onChange={(e) => set('google_analytics_id', e.target.value)} placeholder="G-XXXXXXXXXX" /></Field>
              <Field label="Meta Pixel ID"><Input value={local.meta_pixel_id || ''} onChange={(e) => set('meta_pixel_id', e.target.value)} /></Field>

              <div className="pt-6 flex justify-end">
                <Button onClick={save} disabled={update.isPending} className="gap-1.5">
                  {update.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save all changes
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{children}</h3>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}

function hslOrHexToHex(v: string | null): string {
  if (!v) return '#000000';
  if (v.startsWith('#')) return v;
  return '#000000';
}

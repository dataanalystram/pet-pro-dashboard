import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const KEY = ['storefront_settings'];
const ROW_ID = 'default';

export type StorefrontSettings = {
  id: string;
  business_name: string;
  tagline: string | null;
  logo_url: string | null;
  favicon_url: string | null;

  hero_style: 'gradient' | 'image' | 'video' | 'split';
  hero_headline: string | null;
  hero_subheadline: string | null;
  hero_media_url: string | null;
  hero_video_url: string | null;
  hero_cta_label: string | null;
  hero_cta_link: string | null;
  hero_cta_secondary_label: string | null;
  hero_cta_secondary_link: string | null;

  theme_preset: string;
  primary_color: string | null;
  accent_color: string | null;
  hero_gradient_from: string | null;
  hero_gradient_to: string | null;
  font_family: string | null;
  radius_scale: string | null;

  announcement_enabled: boolean;
  announcement_text: string | null;
  announcement_bg: string | null;
  announcement_fg: string | null;
  announcement_link: string | null;

  trust_badges: Array<{ icon: string; text: string }>;

  about_title: string | null;
  about_body: string | null;
  about_image_url: string | null;
  about_video_url: string | null;
  years_in_business: number | null;
  pets_served: number | null;

  gallery_urls: Array<{ url: string; caption?: string }>;
  gallery_layout: string;

  team_members: Array<{ name: string; role?: string; photo_url?: string; bio?: string; instagram?: string }>;

  business_hours: Record<string, { open: string; close: string; closed: boolean }>;
  contact_phone: string | null;
  contact_email: string | null;
  contact_address: string | null;
  map_embed_url: string | null;

  social_instagram: string | null;
  social_facebook: string | null;
  social_tiktok: string | null;
  social_youtube: string | null;
  social_whatsapp: string | null;
  social_x: string | null;
  social_google: string | null;
  instagram_feed_enabled: boolean;
  instagram_handle: string | null;

  faqs: Array<{ q: string; a: string }>;
  press_logos: Array<{ name: string; logo_url: string; link?: string }>;
  certifications: Array<{ name: string; image_url?: string; icon?: string }>;
  awards: Array<{ name: string; year?: string; image_url?: string }>;

  cancellation_policy: string | null;
  refund_policy: string | null;
  privacy_policy_url: string | null;
  terms_url: string | null;
  vaccination_policy: string | null;

  newsletter_enabled: boolean;
  newsletter_headline: string | null;
  newsletter_subheadline: string | null;

  popup_enabled: boolean;
  popup_headline: string | null;
  popup_body: string | null;
  popup_cta_label: string | null;
  popup_cta_link: string | null;
  popup_image_url: string | null;

  loyalty_teaser_enabled: boolean;
  loyalty_teaser_text: string | null;

  section_visibility: Record<string, boolean>;
  section_order: string[];

  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  google_analytics_id: string | null;
  meta_pixel_id: string | null;

  currency: string;
  timezone: string;
  languages: string[];
  custom_css: string | null;
};

export function useStorefrontSettings() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<StorefrontSettings> => {
      const { data, error } = await (supabase.from('storefront_settings' as any) as any)
        .select('*')
        .eq('id', ROW_ID)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        const { data: created } = await (supabase.from('storefront_settings' as any) as any)
          .insert({ id: ROW_ID })
          .select()
          .single();
        return created as StorefrontSettings;
      }
      return data as StorefrontSettings;
    },
  });
}

export function useUpdateStorefrontSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<StorefrontSettings>) => {
      const { data, error } = await (supabase.from('storefront_settings' as any) as any)
        .update(updates)
        .eq('id', ROW_ID)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success('Storefront updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export const THEME_PRESETS: Record<string, { label: string; primary: string; accent: string; from: string; to: string }> = {
  lime:     { label: 'Lime Editorial', primary: 'hsl(75 95% 50%)',  accent: 'hsl(0 0% 8%)',   from: '#0f172a', to: '#1e293b' },
  midnight: { label: 'Midnight Indigo',primary: 'hsl(240 90% 65%)', accent: 'hsl(240 15% 12%)', from: '#0b1226', to: '#1a1f4a' },
  rose:     { label: 'Rose Boutique',  primary: 'hsl(340 82% 60%)', accent: 'hsl(340 30% 15%)', from: '#3b0d24', to: '#7a1f4d' },
  ocean:    { label: 'Ocean Calm',     primary: 'hsl(200 90% 55%)', accent: 'hsl(215 40% 15%)', from: '#0a2540', to: '#1e5f8a' },
  sunset:   { label: 'Sunset Warm',    primary: 'hsl(20 90% 58%)',  accent: 'hsl(20 30% 15%)',  from: '#3a1301', to: '#c65711' },
  mono:     { label: 'Mono Minimal',   primary: 'hsl(0 0% 12%)',    accent: 'hsl(0 0% 45%)',    from: '#f5f5f5', to: '#dcdcdc' },
};

// Backend: slider + slider_i18n

export interface Slider {
  id: string;
  uuid: string;
  image_url: string | null;
  image_asset_id: string | null;
  featured: boolean;
  is_active: boolean;
  display_order: number;
  // i18n (coalesced by backend)
  name: string | null;
  slug: string | null;
  description: string | null;
  alt: string | null;
  button_text: string | null;
  button_link: string | null;
  locale: string;
  created_at: string;
  updated_at: string;
}

import 'server-only';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8094/api').replace(/\/$/, '');

export interface HomeSection {
  id: string;
  slug: string;
  label: string;
  component_key: string;
  order_index: number;
  is_active: number;
  config: Record<string, unknown> | null;
}

const DEFAULT_LAYOUT: HomeSection[] = [
  { id: 'd-hero', slug: 'hero', label: 'Hero', component_key: 'HeroNew', order_index: 10, is_active: 1, config: null },
  { id: 'd-expertise', slug: 'expertise', label: 'Uzmanlık Alanları', component_key: 'ExpertiseCategoriesSection', order_index: 20, is_active: 1, config: null },
  { id: 'd-featured', slug: 'featured', label: 'Öne Çıkan Danışmanlar', component_key: 'ConsultantsSection', order_index: 30, is_active: 1, config: { sort: 'rating', limit: 6 } },
  { id: 'd-how-it-works', slug: 'how-it-works', label: 'Nasıl Çalışır?', component_key: 'HomeIntroSection', order_index: 40, is_active: 1, config: null },
  { id: 'd-testimonials', slug: 'testimonials', label: 'Yorumlar', component_key: 'HomeTestimonialsSection', order_index: 50, is_active: 1, config: null },
  { id: 'd-become-consultant', slug: 'become-consultant', label: 'Danışman Ol', component_key: 'HomeBecomeConsultantBanner', order_index: 60, is_active: 1, config: null },
];

export async function fetchHomeLayout(): Promise<HomeSection[]> {
  try {
    const res = await fetch(`${API_BASE}/home/layout`, { next: { revalidate: 60 } });
    if (!res.ok) return DEFAULT_LAYOUT;
    const json = await res.json();
    const data = (json?.data ?? []) as HomeSection[];
    return Array.isArray(data) && data.length ? data : DEFAULT_LAYOUT;
  } catch {
    return DEFAULT_LAYOUT;
  }
}

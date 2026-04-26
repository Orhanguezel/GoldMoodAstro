// Backend: menu_items + menu_items_i18n

export interface MenuItem {
  id: string;
  parent_id: string | null;
  type: 'page' | 'custom';
  page_id: string | null;
  location: string; // 'header' | 'footer' | etc.
  icon: string | null;
  section_id: string | null;
  order_num: number;
  is_active: boolean;
  // i18n (coalesced by backend)
  title: string;
  url: string;
  locale: string;
  // nested children (tree structure)
  children?: MenuItem[];
  created_at: string;
  updated_at: string;
}

export interface MenuListParams {
  language?: string;
  location?: string;
  is_active?: boolean;
}

export type CreditPackageAdmin = {
  id: string;
  code: string;
  name_tr: string;
  name_en: string;
  description_tr: string | null;
  description_en: string | null;
  price_minor: number;
  currency: string;
  credits: number;
  bonus_credits: number;
  is_active: 0 | 1 | boolean;
  is_featured: 0 | 1 | boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
};

export type CreditPackageAdminInput = Omit<CreditPackageAdmin, 'id' | 'created_at' | 'updated_at'>;

// src/integrations/shared/profiles.ts


export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  country: string | null;
  postal_code: string | null;
  wallet_balance: number;
  created_at: string;
  updated_at: string;
};

export type ProfileUpsertInput = Partial<
  Pick<
    Profile,
    | 'full_name'
    | 'phone'
    | 'avatar_url'
    | 'address_line1'
    | 'address_line2'
    | 'city'
    | 'country'
    | 'postal_code'
  >
>;

export type ProfileUpsertRequest = {
  profile: ProfileUpsertInput;
};


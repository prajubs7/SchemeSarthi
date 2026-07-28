export interface Profile {
  id: string;
  age: number | null;
  occupation_category: string | null;
  income_bracket: string | null;
  state: string | null;
  gender: string | null;
  social_category: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type ProfileInput = Omit<Profile, 'id' | 'created_at' | 'updated_at'>;

export interface EligibilityRules {
  min_age?: number | null;
  max_age?: number | null;
  states?: string[];
  income_max?: number | null;
  occupation?: string[];
  category?: string[];
  gender?: string[];
  // Real schemes rarely fit clean numeric bands — this index signature lets
  // eligibility_rules carry scheme-specific keys (excluded_if, special_eligibility,
  // etc.) without needing a new TypeScript type per scheme.
  [key: string]: any;
}

export interface Scheme {
  id: string;
  title: string;
  description: string;
  benefit_summary: string | null;
  eligibility_rules: EligibilityRules;
  required_documents: string[] | null;
  official_link: string | null;
  source_document_ref: string | null;
  scheme_level: 'central' | 'state';
  states: string[];
  status: 'active' | 'inactive' | 'expired' | 'needs_verification';
  last_verified_at: string | null;
  created_at: string;
}

export interface MatchedScheme extends Scheme {
  match_score: number | null;
  match_reason: Record<string, boolean | string> | null;
  viewed: boolean;
}

export interface Bookmark {
  user_id: string;
  scheme_id: string;
  notes: string | null;
  created_at: string;
}

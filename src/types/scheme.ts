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
  /** Free-form extras, e.g. application_deadline or how_to_apply steps. */
  metadata?: Record<string, any> | null;
  created_at: string;
}

export interface MatchedScheme extends Scheme {
  match_score: number | null;
  match_reason: Record<string, { required: unknown; actual: unknown; pass: boolean; unverified?: boolean }> | null;
  viewed: boolean;
}

/** A bookmarks row joined with its scheme, as returned by getBookmarks. */
export interface BookmarkWithScheme {
  created_at: string;
  notes: string | null;
  schemes: Scheme;
}

export interface Bookmark {
  user_id: string;
  scheme_id: string;
  notes: string | null;
  created_at: string;
}
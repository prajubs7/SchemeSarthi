import type { IconName } from '../components/ui';
import { Scheme } from '../types/scheme';

// Browse categories shared by Home's category tiles and the Schemes filter chips.
//
// Categories are derived on the client instead of stored in a column: schemes have no
// category field, and `eligibility_rules.category` already means *social* category
// (SC/ST/OBC) to the matcher, so it can't be reused. A scheme is in a category when its
// eligibility rules say so (occupation, gender, minimum age) or, for rules that don't
// capture it (housing, health), when its text mentions it.

export type SchemeCategoryKey =
  | 'student'
  | 'farmer'
  | 'woman'
  | 'senior'
  | 'housing'
  | 'business'
  | 'health';

export interface SchemeCategory {
  key: SchemeCategoryKey;
  label: string;
  icon: IconName;
  /** Values of eligibility_rules.occupation that put a scheme in this category. */
  occupations?: string[];
  /** Values of eligibility_rules.gender that put a scheme in this category. */
  genders?: string[];
  /** A minimum age at or above this puts a scheme in this category. */
  minAgeAtLeast?: number;
  /** Matched against the title, description and benefit summary. */
  keywords: RegExp;
}

export const SCHEME_CATEGORIES: SchemeCategory[] = [
  {
    key: 'student',
    label: 'Students',
    icon: 'school-outline',
    occupations: ['student'],
    keywords: /\b(students?|scholarships?|school|college|education)\b/i,
  },
  {
    key: 'farmer',
    label: 'Farmers',
    icon: 'leaf-outline',
    occupations: ['farmer'],
    keywords: /\b(farmers?|farming|kisan|krishi|agricultur\w*|crops?)\b/i,
  },
  {
    key: 'woman',
    label: 'Women',
    icon: 'woman-outline',
    genders: ['woman', 'female'],
    keywords: /\b(women|woman|girls?|mahila|mothers?|widows?)\b/i,
  },
  {
    key: 'senior',
    label: 'Senior citizens',
    icon: 'people-outline',
    occupations: ['senior citizen / retired'],
    minAgeAtLeast: 60,
    keywords: /\b(senior citizens?|old age|elderly)\b/i,
  },
  {
    key: 'housing',
    label: 'Housing',
    icon: 'home-outline',
    keywords: /\b(housing|houses?|awas|awaas|shelter)\b/i,
  },
  {
    key: 'business',
    label: 'Business',
    icon: 'briefcase-outline',
    occupations: ['business owner', 'self-employed'],
    keywords: /\b(business\w*|entrepreneurs?|msmes?|start-?ups?|self[- ]employed|mudra)\b/i,
  },
  {
    key: 'health',
    label: 'Health',
    icon: 'medkit-outline',
    keywords: /\b(health|medical|hospitals?|treatment|arogya|ayushman)\b/i,
  },
];

export function findSchemeCategory(
  key: string | undefined,
): SchemeCategory | undefined {
  return SCHEME_CATEGORIES.find(c => c.key === key);
}

function lowerList(value: unknown): string[] {
  const list = Array.isArray(value) ? value : value == null ? [] : [value];
  return list.map(v => String(v).trim().toLowerCase());
}

/** The scheme's minimum age, under either rule key the matcher accepts. */
export function schemeMinAge(scheme: Scheme): number | null {
  const rules = scheme.eligibility_rules ?? {};
  const raw = rules.min_age ?? rules.age_min;
  if (raw == null) return null;
  const min = Number(raw);
  return Number.isFinite(min) ? min : null;
}

export function schemeInCategory(scheme: Scheme, category: SchemeCategory): boolean {
  const rules = scheme.eligibility_rules ?? {};

  if (category.occupations) {
    const occupations = lowerList(rules.occupation ?? rules.occupation_category);
    if (occupations.some(o => category.occupations!.includes(o))) return true;
  }
  if (category.genders) {
    if (lowerList(rules.gender).some(g => category.genders!.includes(g))) return true;
  }
  if (category.minAgeAtLeast !== undefined) {
    const min = schemeMinAge(scheme);
    if (min !== null && min >= category.minAgeAtLeast) return true;
  }

  const text = [scheme.title, scheme.description, scheme.benefit_summary]
    .filter(Boolean)
    .join(' ');
  return category.keywords.test(text);
}

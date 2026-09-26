import type { ChipOption } from '../components/ui';

// Stored values MUST match what supabase/functions/_shared/eligibility.ts compares
// against. Categorical fields are compared case-insensitively against the scheme's
// eligibility_rules; income is parsed by bracketUpper(), so keep brackets as
// "<low>-<high> <unit>" strings.

export type AgeGroupKey = 'child' | 'youth' | 'adult' | 'midlife' | 'senior';

export interface AgeGroup {
  key: AgeGroupKey;
  label: string;
  min: number;
  max: number;
}

export const AGE_GROUPS: AgeGroup[] = [
  { key: 'child', label: 'Below 18', min: 0, max: 17 },
  { key: 'youth', label: '18–25 Youth', min: 18, max: 25 },
  { key: 'adult', label: '26–40', min: 26, max: 40 },
  { key: 'midlife', label: '41–59', min: 41, max: 59 },
  { key: 'senior', label: '60+ Senior citizen', min: 60, max: 120 },
];

export const MIN_AGE = 1;
export const MAX_AGE = 120;

export function getAgeGroup(age: number | null | undefined): AgeGroup | null {
  if (age === null || age === undefined || !Number.isInteger(age)) return null;
  return AGE_GROUPS.find(g => age >= g.min && age <= g.max) ?? null;
}

export const GENDER_OPTIONS: ChipOption<string>[] = [
  { value: 'woman', label: 'Female' },
  { value: 'man', label: 'Male' },
  { value: 'other', label: 'Other' },
];

export const OCCUPATION_OPTIONS: ChipOption<string>[] = [
  { value: 'student', label: 'Student', icon: 'school-outline' },
  { value: 'farmer', label: 'Farmer', icon: 'leaf-outline' },
  { value: 'self-employed', label: 'Self-employed', icon: 'construct-outline' },
  { value: 'business owner', label: 'Business owner', icon: 'storefront-outline' },
  { value: 'salaried employee', label: 'Salaried employee', icon: 'briefcase-outline' },
  { value: 'unemployed', label: 'Looking for work', icon: 'search-outline' },
  { value: 'homemaker', label: 'Homemaker', icon: 'home-outline' },
  { value: 'senior citizen / retired', label: 'Retired', icon: 'cafe-outline' },
];

export interface IncomeBracket extends ChipOption<string> {
  /** Upper bound in rupees; must equal bracketUpper(value) on the backend. */
  max: number;
}

const LAKH = 100_000;
const CRORE = 10_000_000;

export const INCOME_BRACKETS: IncomeBracket[] = [
  { value: '0-1 lakh', label: 'Up to ₹1 lakh', max: 1 * LAKH },
  { value: '1-2.5 lakh', label: '₹1 – 2.5 lakh', max: 2.5 * LAKH },
  { value: '2.5-5 lakh', label: '₹2.5 – 5 lakh', max: 5 * LAKH },
  { value: '5-8 lakh', label: '₹5 – 8 lakh', max: 8 * LAKH },
  // The upper bound must be above 8 lakh, or these users would pass "≤ 8 lakh" rules.
  { value: '8 lakh-1 crore', label: 'Above ₹8 lakh', max: 1 * CRORE },
];

/**
 * Maps a stored income_bracket to one of INCOME_BRACKETS. Older profiles stored a
 * raw rupee amount (e.g. "250000"), which is placed in the bracket that contains it.
 */
export function toIncomeBracket(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (INCOME_BRACKETS.some(b => b.value === stored)) return stored;
  const amount = Number(stored.replace(/[₹,\s]/g, ''));
  if (!Number.isFinite(amount) || amount < 0) return null;
  const bracket =
    INCOME_BRACKETS.find(b => amount <= b.max) ??
    INCOME_BRACKETS[INCOME_BRACKETS.length - 1];
  return bracket.value;
}

export const SOCIAL_CATEGORY_OPTIONS: ChipOption<string>[] = [
  { value: 'general', label: 'General' },
  { value: 'obc', label: 'OBC' },
  { value: 'sc', label: 'SC' },
  { value: 'st', label: 'ST' },
  { value: 'ews', label: 'EWS' },
];

// Add a state once its schemes are curated.
export const STATE_OPTIONS: ChipOption<string>[] = [
  { value: 'Maharashtra', label: 'Maharashtra' },
  { value: 'UP', label: 'Uttar Pradesh' },
  { value: 'MP', label: 'Madhya Pradesh' },
];

export const DEFAULT_STATE = 'Maharashtra';

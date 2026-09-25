import { MatchedScheme } from '../types/scheme';

type MatchReason = NonNullable<MatchedScheme['match_reason']>;
type Check = MatchReason[string];

export type EligibilityStatus = 'pass' | 'fail' | 'unverified';

export interface EligibilityCheck {
  key: string;
  label: string;
  status: EligibilityStatus;
  requiredText: string;
  actualText: string;
}

// Keys written by checkEligibility in supabase/functions/_shared/eligibility.ts,
// in display order.
const LABELS: Record<string, string> = {
  age: 'Age',
  income_bracket: 'Income',
  states: 'State',
  occupation_category: 'Occupation',
  social_category: 'Category',
  gender: 'Gender',
};
const ORDER = Object.keys(LABELS);

function toText(value: unknown, fallback: string): string {
  if (value === null || value === undefined || value === '') return fallback;
  if (Array.isArray(value)) return value.length ? value.map(String).join(', ') : fallback;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function statusOf(check: Check): EligibilityStatus {
  if (!check.pass) return 'fail';
  return check.unverified ? 'unverified' : 'pass';
}

export function formatMatchReasons(matchReason: MatchedScheme['match_reason']): EligibilityCheck[] {
  if (!matchReason) return [];

  return Object.entries(matchReason)
    .filter(([, check]) => check && typeof check === 'object' && 'pass' in check)
    .sort(([a], [b]) => {
      const ia = ORDER.indexOf(a);
      const ib = ORDER.indexOf(b);
      return (ia === -1 ? ORDER.length : ia) - (ib === -1 ? ORDER.length : ib);
    })
    .map(([key, check]) => ({
      key,
      label: LABELS[key] ?? key.replace(/_/g, ' '),
      status: statusOf(check),
      requiredText: toText(check.required, 'Not specified'),
      actualText: toText(check.actual, 'Not provided'),
    }));
}
